const express = require("express");
const router = express.Router();
const Ride = require("../models/Ride");
const User = require("../models/User");
const Chat = require("../models/Chat");
const { protect, checkOwnership } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// @desc    Get all rides with filters
// @route   GET /api/rides
// @access  Private
router.get("/", protect, async (req, res, next) => {
  try {
    const {
      origin,
      destination,
      date,
      seats,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = "departureTime",
    } = req.query;
    
    // Debug: Log requesting user
    console.log(`GET /api/rides - User: ${req.user.id}, Name: ${req.user.name || 'unknown'}`);
    
    // Debug: Query parameters
    console.log(`Query params: ${JSON.stringify(req.query)}`);
    
    // Normalize pagination params to numbers
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    const query = {
      status: "active",
      departureTime: { $gte: new Date() },
      driver: { $ne: req.user.id },
    };
    
    // Debug: Initial query and current server time
    console.log(`Initial query: ${JSON.stringify(query)}`);
    console.log(`Current server time: ${new Date().toISOString()}`);

    if (origin) {
      query["origin.city"] = new RegExp(origin, "i");
    }

    if (destination) {
      query["destination.city"] = new RegExp(destination, "i");
    }

    if (date) {
      // Create start date at 00:00:00 of the provided date
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      
      // Create end date as 00:00:00 of the next day
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      query.departureTime = {
        $gte: start,
        $lt: end,
      };
      
      // Debug: Date filter
      console.log(`Date filter - Start: ${start.toISOString()}, End: ${end.toISOString()}`);
    }

    if (seats) {
      query.availableSeats = { $gte: parseInt(seats) };
    }

    if (maxPrice) {
      query.pricePerSeat = { $lte: parseFloat(maxPrice) };
    }

    // Debug: Final query before execution
    console.log(`Final query: ${JSON.stringify(query)}`);

    // Debug: Find all rides (without filters) to check what's in DB
    const allRides = await Ride.find().lean();
    console.log(`Total rides in DB: ${allRides.length}`);
    
    // Log some details about each ride
    allRides.forEach((ride, i) => {
      console.log(`Ride ${i+1}: ID=${ride._id}, Driver=${ride.driver}, Status=${ride.status}, Departure=${new Date(ride.departureTime).toISOString()}, AvailableSeats=${ride.availableSeats}`);
    });

    const rides = await Ride.find(query)
      .populate("driver", "name profilePicture rating city vehicle")
      .populate("passengers.user", "name profilePicture")
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ [sortBy]: 1 });

    // Debug: Found rides after filtering
    console.log(`Rides found after filtering: ${rides.length}`);

    const total = await Ride.countDocuments(query);

    
    res.status(200).json({
      success: true,
      data: rides,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's rides (as driver and passenger)
// @route   GET /api/rides/my/rides
// @access  Private
router.get("/my/rides", protect, async (req, res, next) => {
  try {
    const { status = "all", type = "all", page = 1, limit = 10 } = req.query;

    // Get rides as driver
    let driverQuery = { driver: req.user.id };
    if (status !== "all") {
      driverQuery.status = status;
    }

    // Get rides as passenger
    let passengerQuery = {
      "passengers.user": req.user.id,
    };
    if (status !== "all") {
      passengerQuery[`passengers.$.status`] = status;
    }

    let rides = [];

    if (type === "driver" || type === "all") {
      const driverRides = await Ride.find(driverQuery)
        .populate("passengers.user", "name profilePicture")
        .sort({ departureTime: -1 });

      rides.push(
        ...driverRides.map((ride) => ({ ...ride.toObject(), userRole: "driver" }))
      );
    }

    if (type === "passenger" || type === "all") {
      const passengerRides = await Ride.find(passengerQuery)
        .populate("driver", "name profilePicture rating vehicle")
        .sort({ departureTime: -1 });

      rides.push(
        ...passengerRides.map((ride) => ({ ...ride.toObject(), userRole: "passenger" }))
      );
    }

    // Sort by departure time
    rides.sort((a, b) => new Date(b.departureTime) - new Date(a.departureTime));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRides = rides.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedRides,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: rides.length,
        pages: Math.ceil(rides.length / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single ride
// @route   GET /api/rides/:id
// @access  Private
router.get("/:id", protect, async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("driver", "name profilePicture rating city vehicle preferences")
      .populate("passengers.user", "name profilePicture rating")
      .populate("reviews");

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    res.status(200).json({
      success: true,
      data: ride,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new ride
// @route   POST /api/rides
// @access  Private
router.post(
  "/",
  protect,
  [
    body("origin.address").notEmpty().withMessage("Origin address is required"),
    body("origin.coordinates")
      .isArray({ min: 2, max: 2 })
      .withMessage("Origin coordinates are required"),
    body("destination.address").notEmpty().withMessage("Destination address is required"),
    body("destination.coordinates")
      .isArray({ min: 2, max: 2 })
      .withMessage("Destination coordinates are required"),
    body("departureTime").isISO8601().withMessage("Valid departure time is required"),
    body("availableSeats")
      .isInt({ min: 1, max: 7 })
      .withMessage("Available seats must be between 1 and 7"),
    body("pricePerSeat")
      .isFloat({ min: 0 })
      .withMessage("Price per seat must be a positive number"),
    body("vehicleInfo.make").notEmpty().withMessage("Vehicle make is required"),
    body("vehicleInfo.model").notEmpty().withMessage("Vehicle model is required"),
    body("vehicleInfo.color").notEmpty().withMessage("Vehicle color is required"),
    body("vehicleInfo.plateNumber")
      .notEmpty()
      .withMessage("Vehicle plate number is required"),
    body("route.distance")
      .isFloat({ min: 0 })
      .withMessage("Route distance is required"),
    body("route.duration")
      .isInt({ min: 1 })
      .withMessage("Route duration is required"),
  ],
  async (req, res, next) => {
    try {
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }
      
      
      const { vehicleInfo, route, ...otherData } = req.body;

      
      if (!vehicleInfo) {
        return res.status(400).json({
          success: false,
          message: "vehicleInfo object is required",
        });
      }
      
      if (!route) {
        return res.status(400).json({
          success: false,
          message: "route object is required",
        });
      }

      const rideData = {
        ...otherData,
        driver: req.user.id,
        route: route, 
        vehicleInfo: {
          make: vehicleInfo.make,
          model: vehicleInfo.model,
          color: vehicleInfo.color,
          plateNumber: vehicleInfo.plateNumber,
        },
      };

      const ride = await Ride.create(rideData);

      // Create chat room for the ride
      const chat = await Chat.create({
        ride: ride._id,
        participants: [
          {
            user: req.user.id,
          },
        ],
      });

      ride.chatRoom = chat._id;
      await ride.save();

      // Update user's total rides as driver
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { "totalRides.asDriver": 1 },
      });

      const populatedRide = await Ride.findById(ride._id).populate(
        "driver",
        "name profilePicture rating city"
      );

      res.status(201).json({
        success: true,
        data: populatedRide,
      });
    } catch (error) {
      next(error);
    }
  }
);


// @desc    Update ride
// @route   PUT /api/rides/:id
// @access  Private
router.put("/:id", protect, checkOwnership("Ride"), async (req, res, next) => {
  try {
    const { availableSeats, pricePerSeat, notes, preferences } = req.body;

    const updateData = {};
    if (availableSeats !== undefined) updateData.availableSeats = availableSeats;
    if (pricePerSeat !== undefined) updateData.pricePerSeat = pricePerSeat;
    if (notes !== undefined) updateData.notes = notes;
    if (preferences !== undefined) updateData.preferences = preferences;

    const ride = await Ride.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("driver", "name profilePicture rating city vehicle")
      .populate("passengers.user", "name profilePicture");

    res.status(200).json({
      success: true,
      data: ride,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Cancel ride
// @route   DELETE /api/rides/:id
// @access  Private
router.delete("/:id", protect, checkOwnership("Ride"), async (req, res, next) => {
  try {
    const ride = req.resource;

    // Check if ride has passengers
    if (ride.passengers.length > 0) {
      // Update status to cancelled instead of deleting
      ride.status = "cancelled";
      await ride.save();

      // TODO: Send notifications to passengers

      return res.status(200).json({
        success: true,
        message: "Ride cancelled successfully",
      });
    }

    await ride.deleteOne();

    res.status(200).json({
      success: true,
      message: "Ride deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Book a ride
// @route   POST /api/rides/:id/book
// @access  Private
router.post(
  "/:id/book",
  protect,
  [
    body("seatsBooked").isInt({ min: 1 }).withMessage("Seats booked must be at least 1"),
    body("pickupPoint.address").optional().isString(),
    body("dropoffPoint.address").optional().isString(),
  ],
  async (req, res, next) => {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const ride = await Ride.findById(req.params.id).populate(
        "driver",
        "name profilePicture"
      );

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: "Ride not found",
        });
      }

      const { seatsBooked, pickupPoint, dropoffPoint } = req.body;

      // Check if user can book this ride
      const canBook = ride.canBook(req.user.id, seatsBooked);
      if (!canBook.canBook) {
        return res.status(400).json({
          success: false,
          message: canBook.reason,
        });
      }
      
      // Extra check to ensure seats requested don't exceed available seats
      if (seatsBooked > ride.availableSeats) {
        return res.status(400).json({
          success: false,
          message: `Cannot book ${seatsBooked} seats. Only ${ride.availableSeats} seats available.`,
        });
      }

      // Calculate total amount
      const totalAmount = ride.pricePerSeat * seatsBooked;

      // Add passenger to ride
      const passengerData = {
        user: req.user.id,
        seatsBooked,
        totalAmount,
        pickupPoint: pickupPoint || ride.origin,
        dropoffPoint: dropoffPoint || ride.destination,
      };

      ride.passengers.push(passengerData);

      // Update ride status if full
      if (ride.isFull()) {
        ride.status = "full";
      }

      await ride.save();

      // Add user to chat room
      const chat = await Chat.findById(ride.chatRoom);
      if (chat) {
        await chat.addParticipant(req.user.id);
      }

      // Update user's total rides
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { "totalRides.asPassenger": 1 },
      });

      const updatedRide = await Ride.findById(ride._id)
        .populate("driver", "name profilePicture rating")
        .populate("passengers.user", "name profilePicture");

      res.status(200).json({
        success: true,
        data: updatedRide,
        message: "Ride booked successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Cancel booking
// @route   DELETE /api/rides/:id/cancel-booking
// @access  Private
router.delete("/:id/cancel-booking", protect, async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Find user's booking
    const passengerIndex = ride.passengers.findIndex(
      (passenger) => passenger.user.toString() === req.user.id
    );

    if (passengerIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Remove passenger
    ride.passengers.splice(passengerIndex, 1);

    // Update ride status
    if (ride.status === "full") {
      ride.status = "active";
    }

    await ride.save();

    // Remove user from chat room
    const chat = await Chat.findById(ride.chatRoom);
    if (chat) {
      await chat.removeParticipant(req.user.id);
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
