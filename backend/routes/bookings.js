const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const { protect } = require('../middleware/auth');

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = {
      'passengers.user': req.user.id
    };

    if (status) {
      query['passengers.status'] = status;
    }

    const bookings = await Ride.find(query)
      .populate('driver', 'name profilePicture rating vehicle')
      .populate('passengers.user', 'name profilePicture')
      .sort({ departureTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter to show only user's booking details
    const userBookings = bookings.map(ride => {
      const userPassenger = ride.passengers.find(
        p => p.user._id.toString() === req.user.id
      );
      
      return {
        _id: ride._id,
        origin: ride.origin,
        destination: ride.destination,
        departureTime: ride.departureTime,
        estimatedArrivalTime: ride.estimatedArrivalTime,
        driver: ride.driver,
        vehicleInfo: ride.vehicleInfo,
        pricePerSeat: ride.pricePerSeat,
        currency: ride.currency,
        status: ride.status,
        booking: userPassenger,
        chatRoom: ride.chatRoom
      };
    });

    const total = await Ride.countDocuments(query);

    res.status(200).json({
      success: true,
      data: userBookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get booking details
// @route   GET /api/bookings/:rideId
// @access  Private
router.get('/:rideId', protect, async (req, res, next) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.rideId,
      'passengers.user': req.user.id
    })
    .populate('driver', 'name profilePicture rating vehicle preferences')
    .populate('passengers.user', 'name profilePicture');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const userPassenger = ride.passengers.find(
      p => p.user._id.toString() === req.user.id
    );

    const bookingDetails = {
      _id: ride._id,
      origin: ride.origin,
      destination: ride.destination,
      departureTime: ride.departureTime,
      estimatedArrivalTime: ride.estimatedArrivalTime,
      driver: ride.driver,
      vehicleInfo: ride.vehicleInfo,
      preferences: ride.preferences,
      route: ride.route,
      notes: ride.notes,
      pricePerSeat: ride.pricePerSeat,
      currency: ride.currency,
      status: ride.status,
      booking: userPassenger,
      chatRoom: ride.chatRoom,
      otherPassengers: ride.passengers.filter(
        p => p.user._id.toString() !== req.user.id
      )
    };

    res.status(200).json({
      success: true,
      data: bookingDetails
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update booking status (for drivers)
// @route   PUT /api/bookings/:rideId/:passengerId/status
// @access  Private
router.put('/:rideId/:passengerId/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const ride = await Ride.findOne({
      _id: req.params.rideId,
      driver: req.user.id
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found or you are not authorized'
      });
    }

    const passenger = ride.passengers.find(
      p => p.user.toString() === req.params.passengerId
    );

    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: 'Passenger not found'
      });
    }

    passenger.status = status;
    await ride.save();

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;