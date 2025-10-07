const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxLength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId && !this.appleId;
      },
      minLength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: "prefer_not_to_say",
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    totalRides: {
      asDriver: {
        type: Number,
        default: 0,
      },
      asPassenger: {
        type: Number,
        default: 0,
      },
    },
    isVerified: {
      email: {
        type: Boolean,
        default: false,
      },
      phone: {
        type: Boolean,
        default: false,
      },
      identity: {
        type: Boolean,
        default: false,
      },
      drivingLicense: {
        type: Boolean,
        default: false,
      },
    },
    otp: {
      code: String,
      expiresAt: Date,
      attempts: {
        type: Number,
        default: 0,
      },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    googleId: String,
    appleId: String,
    fcmToken: String, // For push notifications
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,

    // Driver profile - only filled when user chooses to be a driver
    driverProfile: {
      isSetup: {
        type: Boolean,
        default: false,
      },
      drivingLicense: {
        number: {
          type: String,
          required: function () {
            return this.parent().isSetup;
          },
        },
        expiryDate: {
          type: Date,
          required: function () {
            return this.parent().isSetup;
          },
        },
        state: {
          type: String,
          required: function () {
            return this.parent().isSetup;
          },
        },
        isVerified: {
          type: Boolean,
          default: false,
        },
      },
      vehicles: [
        {
          make: {
            type: String,
            required: function () {
              return this.parent().parent().driverProfile?.isSetup;
            },
          },
          model: {
            type: String,
            required: function () {
              return this.parent().parent().driverProfile?.isSetup;
            },
          },
          year: {
            type: Number,
            min: 1990,
            max: new Date().getFullYear() + 1,
          },
          color: {
            type: String,
            required: function () {
              return this.parent().parent().driverProfile?.isSetup;
            },
          },
          plateNumber: {
            type: String,
            required: function () {
              return this.parent().parent().driverProfile?.isSetup;
            },
            uppercase: true,
          },
          seats: {
            type: Number,
            required: function () {
              return this.parent().parent().driverProfile?.isSetup;
            },
            min: 1,
            max: 8,
          },
          isDefault: {
            type: Boolean,
            default: false,
          },
        },
      ],
      preferences: {
        smokingAllowed: {
          type: Boolean,
          default: false,
        },
        petsAllowed: {
          type: Boolean,
          default: true,
        },
        musicPreference: {
          type: String,
          enum: ["no_music", "soft", "loud", "any"],
          default: "soft",
        },
        conversationLevel: {
          type: String,
          enum: ["silent", "some_chat", "talkative"],
          default: "some_chat",
        },
      },
      setupDate: {
        type: Date,
        default: Date.now,
      },
    },

    // Passenger profile - preferences and settings for when user books rides
    passengerProfile: {
      preferences: {
        smokingTolerance: {
          type: String,
          enum: ["no_smoking", "smoking_ok", "no_preference"],
          default: "no_preference",
        },
        petTolerance: {
          type: String,
          enum: ["no_pets", "pets_ok", "no_preference"],
          default: "no_preference",
        },
        musicTolerance: {
          type: String,
          enum: ["no_music", "soft_music", "any_music", "no_preference"],
          default: "no_preference",
        },
        conversationPreference: {
          type: String,
          enum: ["silent_ride", "some_chat", "talkative", "no_preference"],
          default: "no_preference",
        },
        genderPreference: {
          type: String,
          enum: ["male_driver", "female_driver", "no_preference"],
          default: "no_preference",
        },
      },
      travelHistory: {
        frequentRoutes: [
          {
            from: {
              type: String,
              trim: true,
            },
            to: {
              type: String,
              trim: true,
            },
            count: {
              type: Number,
              default: 1,
              min: 1,
            },
          },
        ],
        preferredTimes: [
          {
            dayOfWeek: {
              type: String,
              enum: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
            },
            timeSlot: {
              type: String,
              enum: ["early_morning", "morning", "afternoon", "evening", "night"],
            },
            frequency: {
              type: Number,
              default: 1,
              min: 1,
            },
          },
        ],
      },
      emergencyContact: {
        name: {
          type: String,
          trim: true,
        },
        phone: {
          type: String,
          match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"],
        },
        relationship: {
          type: String,
          trim: true,
        },
      },
      specialRequirements: {
        hasLuggage: {
          type: Boolean,
          default: false,
        },
        luggageSize: {
          type: String,
          enum: ["small", "medium", "large"],
          default: "small",
        },
        wheelchairAccessible: {
          type: Boolean,
          default: false,
        },
        childSeat: {
          type: Boolean,
          default: false,
        },
        notes: {
          type: String,
          maxLength: [200, "Notes cannot exceed 200 characters"],
          trim: true,
        },
      },
      notifications: {
        rideReminders: {
          type: Boolean,
          default: true,
        },
        driverUpdates: {
          type: Boolean,
          default: true,
        },
        priceAlerts: {
          type: Boolean,
          default: false,
        },
        newRideAlerts: {
          type: Boolean,
          default: false,
        },
      },
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Update the updatedAt field before saving
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getJWTToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      name: this.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );
};

// Generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  };
  return otp;
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const crypto = require("crypto");
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Driver profile helper methods
userSchema.methods.isDriverSetup = function () {
  return this.driverProfile?.isSetup || false;
};

userSchema.methods.getDefaultVehicle = function () {
  if (!this.driverProfile?.vehicles?.length) return null;
  return (
    this.driverProfile.vehicles.find((v) => v.isDefault) || this.driverProfile.vehicles[0]
  );
};

userSchema.methods.setupDriverProfile = function (profileData) {
  this.driverProfile = {
    isSetup: true,
    drivingLicense: profileData.drivingLicense,
    vehicles: [{ ...profileData.vehicle, isDefault: true }],
    preferences: profileData.preferences,
    setupDate: new Date(),
  };
};

userSchema.methods.addVehicle = function (vehicleData) {
  if (!this.driverProfile?.isSetup) {
    throw new Error("Driver profile must be setup first");
  }

  // If this is the first vehicle, make it default
  if (!this.driverProfile.vehicles.length) {
    vehicleData.isDefault = true;
  }

  this.driverProfile.vehicles.push(vehicleData);
};

// Passenger profile helper methods
userSchema.methods.updatePassengerPreferences = function (preferences) {
  if (!this.passengerProfile) {
    this.passengerProfile = {
      preferences: {},
      travelHistory: { frequentRoutes: [], preferredTimes: [] },
    };
  }

  Object.keys(preferences).forEach((key) => {
    if (this.passengerProfile.preferences.hasOwnProperty(key)) {
      this.passengerProfile.preferences[key] = preferences[key];
    }
  });
};

userSchema.methods.addFrequentRoute = function (from, to) {
  if (!this.passengerProfile) {
    this.passengerProfile = {
      preferences: {},
      travelHistory: { frequentRoutes: [], preferredTimes: [] },
      emergencyContact: {},
      specialRequirements: {},
      notifications: {},
    };
  }

  const existingRoute = this.passengerProfile.travelHistory.frequentRoutes.find(
    (route) =>
      route.from.toLowerCase() === from.toLowerCase() &&
      route.to.toLowerCase() === to.toLowerCase()
  );

  if (existingRoute) {
    existingRoute.count += 1;
  } else {
    this.passengerProfile.travelHistory.frequentRoutes.push({
      from: from.trim(),
      to: to.trim(),
      count: 1,
    });
  }
};

userSchema.methods.addPreferredTime = function (dayOfWeek, timeSlot) {
  if (!this.passengerProfile) {
    this.passengerProfile = {
      preferences: {},
      travelHistory: { frequentRoutes: [], preferredTimes: [] },
      emergencyContact: {},
      specialRequirements: {},
      notifications: {},
    };
  }

  const existingTime = this.passengerProfile.travelHistory.preferredTimes.find(
    (time) => time.dayOfWeek === dayOfWeek && time.timeSlot === timeSlot
  );

  if (existingTime) {
    existingTime.frequency += 1;
  } else {
    this.passengerProfile.travelHistory.preferredTimes.push({
      dayOfWeek,
      timeSlot,
      frequency: 1,
    });
  }
};

userSchema.methods.setEmergencyContact = function (contactData) {
  if (!this.passengerProfile) {
    this.passengerProfile = {
      preferences: {},
      travelHistory: { frequentRoutes: [], preferredTimes: [] },
      emergencyContact: {},
      specialRequirements: {},
      notifications: {},
    };
  }

  this.passengerProfile.emergencyContact = {
    name: contactData.name,
    phone: contactData.phone,
    relationship: contactData.relationship,
  };
};

userSchema.methods.getPassengerPreferences = function () {
  return this.passengerProfile?.preferences || {};
};

userSchema.methods.getMostFrequentRoute = function () {
  if (!this.passengerProfile?.travelHistory?.frequentRoutes?.length) return null;

  return this.passengerProfile.travelHistory.frequentRoutes.reduce((prev, current) =>
    prev.count > current.count ? prev : current
  );
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return this.name;
});

// Virtual for age
userSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ city: 1 });
userSchema.index({ "rating.average": -1 });

module.exports = mongoose.model("User", userSchema);
