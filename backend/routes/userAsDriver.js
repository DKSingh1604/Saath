const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// @desc    Check if driver profile is setup
// @route   GET /api/driver/profile-status
// @access  Private
router.get("/profile-status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: {
        isDriverProfileSetup: user.driverProfile?.isSetup || false,
        driverProfile: user.driverProfile || null,
      },
    });
  } catch (error) {
    console.error("Driver profile status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Setup driver profile (first time only)
// @route   POST /api/driver/setup-profile
// @access  Private
router.post(
  "/setup-profile",
  protect,
  [
    body("drivingLicense.number").notEmpty().withMessage("License number is required"),
    body("drivingLicense.expiryDate")
      .isISO8601()
      .withMessage("Valid expiry date is required"),
    body("drivingLicense.state").notEmpty().withMessage("License state is required"),
    body("vehicle.make").notEmpty().withMessage("Vehicle make is required"),
    body("vehicle.model").notEmpty().withMessage("Vehicle model is required"),
    body("vehicle.color").notEmpty().withMessage("Vehicle color is required"),
    body("vehicle.plateNumber").notEmpty().withMessage("Plate number is required"),
    body("vehicle.seats")
      .isInt({ min: 2, max: 8 })
      .withMessage("Seats must be between 2-8"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const user = await User.findById(req.user.id);

      if (user.driverProfile?.isSetup) {
        return res.status(400).json({
          success: false,
          message: "Driver profile is already setup",
        });
      }

      const { drivingLicense, vehicle, preferences } = req.body;

      user.setupDriverProfile({
        drivingLicense: {
          number: drivingLicense.number,
          expiryDate: new Date(drivingLicense.expiryDate),
          state: drivingLicense.state,
          isVerified: false,
        },
        vehicle: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year || new Date().getFullYear(),
          color: vehicle.color,
          plateNumber: vehicle.plateNumber.toUpperCase(),
          seats: vehicle.seats,
          isDefault: true,
        },
        preferences: {
          smokingAllowed: preferences?.smokingAllowed || false,
          petsAllowed: preferences?.petsAllowed !== false,
          musicPreference: preferences?.musicPreference || "soft",
          conversationLevel: preferences?.conversationLevel || "some_chat",
        },
      });

      await user.save();

      res.json({
        success: true,
        message: "Driver profile setup successfully",
        data: {
          driverProfile: user.driverProfile,
        },
      });
    } catch (error) {
      console.error("Driver profile setup error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during driver profile setup",
      });
    }
  }
);

// @desc    Get complete driver profile
// @route   GET /api/driver/profile
// @access  Private
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.driverProfile?.isSetup) {
      return res.status(400).json({
        success: false,
        message: "Driver profile not setup",
      });
    }

    res.json({
      success: true,
      data: {
        driverProfile: user.driverProfile,
      },
    });
  } catch (error) {
    console.error("Get driver profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Update driver preferences
// @route   PUT /api/driver/preferences
// @access  Private
router.put(
  "/preferences",
  protect,
  [
    body("smokingAllowed").optional().isBoolean(),
    body("petsAllowed").optional().isBoolean(),
    body("musicPreference").optional().isIn(["no_music", "soft", "loud", "any"]),
    body("conversationLevel").optional().isIn(["silent", "some_chat", "talkative"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const user = await User.findById(req.user.id);

      if (!user.driverProfile?.isSetup) {
        return res.status(400).json({
          success: false,
          message: "Driver profile not setup",
        });
      }

      const { smokingAllowed, petsAllowed, musicPreference, conversationLevel } =
        req.body;

      if (smokingAllowed !== undefined)
        user.driverProfile.preferences.smokingAllowed = smokingAllowed;
      if (petsAllowed !== undefined)
        user.driverProfile.preferences.petsAllowed = petsAllowed;
      if (musicPreference)
        user.driverProfile.preferences.musicPreference = musicPreference;
      if (conversationLevel)
        user.driverProfile.preferences.conversationLevel = conversationLevel;

      await user.save();

      res.json({
        success: true,
        message: "Driver preferences updated successfully",
        data: {
          preferences: user.driverProfile.preferences,
        },
      });
    } catch (error) {
      console.error("Update driver preferences error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @desc    Add vehicle to driver profile
// @route   POST /api/driver/add-vehicle
// @access  Private
router.post(
  "/add-vehicle",
  protect,
  [
    body("make").notEmpty().withMessage("Vehicle make is required"),
    body("model").notEmpty().withMessage("Vehicle model is required"),
    body("color").notEmpty().withMessage("Vehicle color is required"),
    body("plateNumber").notEmpty().withMessage("Plate number is required"),
    body("seats").isInt({ min: 2, max: 8 }).withMessage("Seats must be between 2-8"),
    body("isDefault").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const user = await User.findById(req.user.id);

      if (!user.driverProfile?.isSetup) {
        return res.status(400).json({
          success: false,
          message: "Driver profile not setup. Please setup driver profile first.",
        });
      }

      const { make, model, year, color, plateNumber, seats, isDefault } = req.body;

      // Check if vehicle with same plate number already exists
      const plateNumberUpper = plateNumber.toUpperCase();
      const existingVehicle = user.driverProfile.vehicles.find(
        (vehicle) => vehicle.plateNumber === plateNumberUpper
      );

      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: `Vehicle with plate number ${plateNumberUpper} is already added to your profile`,
          data: {
            existingVehicle: {
              make: existingVehicle.make,
              model: existingVehicle.model,
              color: existingVehicle.color,
              plateNumber: existingVehicle.plateNumber,
              seats: existingVehicle.seats,
            },
          },
        });
      }

      // If this vehicle is set as default, remove default from other vehicles
      if (isDefault) {
        user.driverProfile.vehicles.forEach((vehicle) => {
          vehicle.isDefault = false;
        });
      }

      const newVehicle = {
        make,
        model,
        year: year || new Date().getFullYear(),
        color,
        plateNumber: plateNumberUpper,
        seats,
        isDefault: isDefault || false,
      };

      user.addVehicle(newVehicle);
      await user.save();

      res.json({
        success: true,
        message: "Vehicle added successfully",
        data: {
          vehicle: newVehicle,
          totalVehicles: user.driverProfile.vehicles.length,
        },
      });
    } catch (error) {
      console.error("Add vehicle error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Server error",
      });
    }
  }
);

// @desc    Update vehicle information
// @route   PUT /api/driver/vehicle/:vehicleId
// @access  Private
router.put(
  "/vehicle/:vehicleId",
  protect,
  [
    body("make").optional().notEmpty().withMessage("Vehicle make cannot be empty"),
    body("model").optional().notEmpty().withMessage("Vehicle model cannot be empty"),
    body("color").optional().notEmpty().withMessage("Vehicle color cannot be empty"),
    body("plateNumber").optional().notEmpty().withMessage("Plate number cannot be empty"),
    body("seats").optional().isInt({ min: 2, max: 8 }).withMessage("Seats must be between 2-8"),
    body("isDefault").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const user = await User.findById(req.user.id);

      if (!user.driverProfile?.isSetup) {
        return res.status(400).json({
          success: false,
          message: "Driver profile not setup",
        });
      }

      const vehicle = user.driverProfile.vehicles.id(req.params.vehicleId);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      const { make, model, year, color, plateNumber, seats, isDefault } = req.body;

      // Check if plateNumber is being changed and if it already exists
      if (plateNumber && plateNumber.toUpperCase() !== vehicle.plateNumber) {
        const existingVehicle = user.driverProfile.vehicles.find(
          (v) => v.plateNumber === plateNumber.toUpperCase() && v._id.toString() !== req.params.vehicleId
        );

        if (existingVehicle) {
          return res.status(400).json({
            success: false,
            message: `Vehicle with plate number ${plateNumber.toUpperCase()} already exists`,
          });
        }
      }

      // Update fields if provided
      if (make) vehicle.make = make;
      if (model) vehicle.model = model;
      if (year) vehicle.year = year;
      if (color) vehicle.color = color;
      if (plateNumber) vehicle.plateNumber = plateNumber.toUpperCase();
      if (seats) vehicle.seats = seats;

      // Handle default vehicle
      if (isDefault !== undefined && isDefault) {
        user.driverProfile.vehicles.forEach((v) => {
          v.isDefault = v._id.toString() === req.params.vehicleId;
        });
      }

      await user.save();

      res.json({
        success: true,
        message: "Vehicle updated successfully",
        data: {
          vehicle,
        },
      });
    } catch (error) {
      console.error("Update vehicle error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @desc    Delete vehicle
// @route   DELETE /api/driver/vehicle/:vehicleId
// @access  Private
router.delete("/vehicle/:vehicleId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.driverProfile?.isSetup) {
      return res.status(400).json({
        success: false,
        message: "Driver profile not setup",
      });
    }

    const vehicle = user.driverProfile.vehicles.id(req.params.vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Prevent deletion if it's the only vehicle
    if (user.driverProfile.vehicles.length === 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the only vehicle. Driver must have at least one vehicle.",
      });
    }

    // If deleting default vehicle, set another as default
    if (vehicle.isDefault) {
      user.driverProfile.vehicles.forEach((v, index) => {
        if (v._id.toString() !== req.params.vehicleId && index === 0) {
          v.isDefault = true;
        }
      });
    }

    vehicle.deleteOne();
    await user.save();

    res.json({
      success: true,
      message: "Vehicle deleted successfully",
      data: {
        remainingVehicles: user.driverProfile.vehicles.length,
      },
    });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
