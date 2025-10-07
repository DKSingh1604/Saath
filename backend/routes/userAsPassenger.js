const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// @desc    Get passenger profile
// @route   GET /api/passenger/profile
// @access  Private
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: {
        passengerProfile: user.passengerProfile || {
          preferences: {},
          travelHistory: { frequentRoutes: [], preferredTimes: [] },
          emergencyContact: {},
          specialRequirements: {},
          notifications: {},
        },
      },
    });
  } catch (error) {
    console.error("Get passenger profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Update passenger preferences
// @route   PUT /api/passenger/preferences
// @access  Private
router.put(
  "/preferences",
  protect,
  [
    body("smokingTolerance")
      .optional()
      .isIn(["no_smoking", "smoking_ok", "no_preference"]),
    body("petTolerance").optional().isIn(["no_pets", "pets_ok", "no_preference"]),
    body("musicTolerance")
      .optional()
      .isIn(["no_music", "soft_music", "any_music", "no_preference"]),
    body("conversationPreference")
      .optional()
      .isIn(["silent_ride", "some_chat", "talkative", "no_preference"]),
    body("genderPreference")
      .optional()
      .isIn(["male_driver", "female_driver", "no_preference"]),
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
      const {
        smokingTolerance,
        petTolerance,
        musicTolerance,
        conversationPreference,
        genderPreference,
      } = req.body;

      user.updatePassengerPreferences({
        smokingTolerance,
        petTolerance,
        musicTolerance,
        conversationPreference,
        genderPreference,
      });

      await user.save();

      res.json({
        success: true,
        message: "Passenger preferences updated successfully",
        data: {
          preferences: user.passengerProfile.preferences,
        },
      });
    } catch (error) {
      console.error("Update passenger preferences error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @desc    Set emergency contact
// @route   PUT /api/passenger/emergency-contact
// @access  Private
router.put(
  "/emergency-contact",
  protect,
  [
    body("name").notEmpty().withMessage("Contact name is required"),
    body("phone").isMobilePhone().withMessage("Valid phone number is required"),
    body("relationship").notEmpty().withMessage("Relationship is required"),
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
      const { name, phone, relationship } = req.body;

      user.setEmergencyContact({ name, phone, relationship });
      await user.save();

      res.json({
        success: true,
        message: "Emergency contact updated successfully",
        data: {
          emergencyContact: user.passengerProfile.emergencyContact,
        },
      });
    } catch (error) {
      console.error("Set emergency contact error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @desc    Update special requirements
// @route   PUT /api/passenger/special-requirements
// @access  Private
router.put(
  "/special-requirements",
  protect,
  [
    body("hasLuggage").optional().isBoolean(),
    body("luggageSize").optional().isIn(["small", "medium", "large"]),
    body("wheelchairAccessible").optional().isBoolean(),
    body("childSeat").optional().isBoolean(),
    body("notes")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Notes cannot exceed 200 characters"),
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
      const { hasLuggage, luggageSize, wheelchairAccessible, childSeat, notes } =
        req.body;

      if (!user.passengerProfile) {
        user.passengerProfile = {
          preferences: {},
          travelHistory: { frequentRoutes: [], preferredTimes: [] },
          emergencyContact: {},
          specialRequirements: {},
          notifications: {},
        };
      }

      if (hasLuggage !== undefined)
        user.passengerProfile.specialRequirements.hasLuggage = hasLuggage;
      if (luggageSize)
        user.passengerProfile.specialRequirements.luggageSize = luggageSize;
      if (wheelchairAccessible !== undefined)
        user.passengerProfile.specialRequirements.wheelchairAccessible =
          wheelchairAccessible;
      if (childSeat !== undefined)
        user.passengerProfile.specialRequirements.childSeat = childSeat;
      if (notes !== undefined) user.passengerProfile.specialRequirements.notes = notes;

      await user.save();

      res.json({
        success: true,
        message: "Special requirements updated successfully",
        data: {
          specialRequirements: user.passengerProfile.specialRequirements,
        },
      });
    } catch (error) {
      console.error("Update special requirements error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @desc    Update notification preferences
// @route   PUT /api/passenger/notification-preferences
// @access  Private
router.put(
  "/notification-preferences",
  protect,
  [
    body("rideReminders").optional().isBoolean(),
    body("driverUpdates").optional().isBoolean(),
    body("priceAlerts").optional().isBoolean(),
    body("newRideAlerts").optional().isBoolean(),
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
      const { rideReminders, driverUpdates, priceAlerts, newRideAlerts } = req.body;

      if (!user.passengerProfile) {
        user.passengerProfile = {
          preferences: {},
          travelHistory: { frequentRoutes: [], preferredTimes: [] },
          emergencyContact: {},
          specialRequirements: {},
          notifications: {},
        };
      }

      if (rideReminders !== undefined)
        user.passengerProfile.notifications.rideReminders = rideReminders;
      if (driverUpdates !== undefined)
        user.passengerProfile.notifications.driverUpdates = driverUpdates;
      if (priceAlerts !== undefined)
        user.passengerProfile.notifications.priceAlerts = priceAlerts;
      if (newRideAlerts !== undefined)
        user.passengerProfile.notifications.newRideAlerts = newRideAlerts;

      await user.save();

      res.json({
        success: true,
        message: "Notification preferences updated successfully",
        data: {
          notifications: user.passengerProfile.notifications,
        },
      });
    } catch (error) {
      console.error("Update notification preferences error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

module.exports = router;
