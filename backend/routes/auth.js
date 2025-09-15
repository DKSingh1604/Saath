const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect, generateToken } = require("../middleware/auth");
const sendEmail = require("../utils/mailGun");

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2-50 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("phone").isMobilePhone().withMessage("Please enter a valid phone number"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("city").trim().notEmpty().withMessage("City is required"),
    // Optional fields validation
    body("dateOfBirth")
      .optional()
      .isISO8601()
      .withMessage("Please enter a valid date of birth"),
    body("gender")
      .optional()
      .isIn(["male", "female", "other", "prefer_not_to_say"])
      .withMessage("Please select a valid gender"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { name, email, phone, password, city, dateOfBirth, gender } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email or phone number",
        });
      }

      // Note: password hashing is handled in User model pre-save hook

      // Generate email verification OTP
      const emailOTP = Math.floor(100000 + Math.random() * 900000).toString();
      const emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create user (store plain password; model will hash it before save)
      const userData = {
        name,
        email,
        phone,
        password,
        city,
        otp: {
          code: emailOTP,
          expiresAt: emailOTPExpires,
          attempts: 0,
        },
      };

      // Add optional fields if provided
      if (dateOfBirth) {
        userData.dateOfBirth = new Date(dateOfBirth);
      }
      if (gender) {
        userData.gender = gender;
      }

      const user = await User.create(userData);

      // Send verification email using Mailgun
      try {
        const sendEmail = require("../utils/mailGun");
        await sendEmail({
          to: email,
          subject: "Car Pool App - Verify Your Email",
          html: `
          <h2>Welcome to Car Pool App!</h2>
          <p>Your email verification code is: <strong>${emailOTP}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't create this account, please ignore this email.</p>
          `,
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Continue with registration even if email fails
      }

      res.status(201).json({
        success: true,
        message: "User registered successfully. Please verify your email.",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isEmailVerified: user.isVerified?.email,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error during registration",
      });
    }
  }
);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public

//LOGIN API ROUTE
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
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

      const { email, password } = req.body;

      console.log("Login attempt:", { email });

      // Find user and include password
      const user = await User.findOne({
        email,
      }).select("+password");

      // console.log("User found:", {
      //   found: !!user,
      //   emailVerified: user?.isVerified?.email,
      //   hasPassword: !!user?.password,
      //   passwordValue: user?.password,
      //   userObject: JSON.stringify(user),
      // });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // // Check password
      // console.log("Comparing passwords:", {
      //   providedPassword: password,
      //   hasStoredPassword: !!user.password,
      // });

      // console.log("About to compare passwords:", {
      //   inputPassword: password,
      //   storedHashedPassword: user.password,
      // });

      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      console.log("Password check result:", { isPasswordCorrect });

      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if email is verified
      if (!user.isVerified?.email) {
        return res.status(401).json({
          success: false,
          message: "Please verify your email before logging in",
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account has been deactivated",
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            city: user.city,
            isEmailVerified: user.isVerified?.email,
            isDriver: user.isDriver,
            profilePicture: user.profilePicture,
            rating: user.rating,
          },
          token,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error during login",
      });
    }
  }
);

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public

//VERIFY API ROUTE
router.post(
  "/verify-email",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
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

      const { email, otp } = req.body;

      const user = await User.findOne({
        email,
        "otp.code": otp,
        "otp.expiresAt": { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      console.log("Found user:", {
        email,
        providedOTP: otp,
        storedOTP: user.otp?.code,
        expiresAt: user.otp?.expiresAt,
        now: new Date(),
      });

      // Mark email as verified
      user.isVerified = {
        ...user.isVerified,
        email: true,
      };
      user.otp = undefined; // Clear the entire OTP object
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: "Email verified successfully",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            city: user.city,
            isEmailVerified: user.isVerified?.email,
            isDriver: user.isDriver,
          },
          token,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error during email verification",
      });
    }
  }
);

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public

//RESEND OTP ROUTE
router.post(
  "/resend-otp",
  [body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email")],
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

      const { email } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.isVerified?.email) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      // Generate new OTP
      const emailOTP = Math.floor(100000 + Math.random() * 900000).toString();
      const emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000);

      user.emailOTP = emailOTP;
      user.emailOTPExpires = emailOTPExpires;
      await user.save();

      // Send verification email
      try {
        const transporter = createTransporter();
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Car Pool App - Verification Code",
          html: `
          <h2>Email Verification</h2>
          <p>Your new verification code is: <strong>${emailOTP}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `,
        });

        res.json({
          success: true,
          message: "OTP sent successfully",
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        res.status(500).json({
          success: false,
          message: "Failed to send email",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private

//ME ROUTE
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
router.put(
  "/me",
  protect,
  [
    body("name").optional().trim().isLength({ min: 2, max: 50 }),
    body("city").optional().trim().notEmpty(),
    body("phone").optional().isMobilePhone(),
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

      const allowedUpdates = ["name", "city", "dateOfBirth", "gender", "profilePicture"];
      const updates = {};

      Object.keys(req.body).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      const user = await User.findByIdAndUpdate(req.user.id, updates, {
        new: true,
        runValidators: true,
      });

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error during profile update",
      });
    }
  }
);

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
router.put(
  "/update-password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
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

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user.id).select("+password");

      // Check current password
      const isCurrentPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isCurrentPasswordCorrect) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Assign new password (model pre-save will hash it)
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error during password update",
      });
    }
  }
);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post("/logout", protect, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
});

// @desc    Test email sending
// @route   POST /api/auth/test-email
// @access  Public
router.post("/test-email", async (req, res) => {
  try {
    const sendEmail = require("../utils/mailGun");
    await sendEmail({
      to: "devkaransingh1604@gmail.com",
      subject: "Test Email from Car Pool App",
      html: "<h1>Test Email</h1><p>If you received this, email sending is working!</p>",
    });

    res.json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error("Test email failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message,
    });
  }
});

module.exports = router;
