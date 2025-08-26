const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, optionalAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('reviews', 'rating comment reviewType createdAt')
      .select('-otp -resetPasswordToken -resetPasswordExpire -fcmToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload profile picture
// @route   POST /api/users/upload-avatar
// @access  Private
router.post('/upload-avatar', protect, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const profilePicture = `/uploads/profiles/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update vehicle information
// @route   PUT /api/users/vehicle
// @access  Private
router.put('/vehicle', protect, async (req, res, next) => {
  try {
    const { make, model, year, color, plateNumber, seats } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        isDriver: true,
        vehicle: {
          make,
          model,
          year,
          color,
          plateNumber,
          seats
        }
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get users by city (for finding potential ride partners)
// @route   GET /api/users/search
// @access  Private
router.get('/search', protect, async (req, res, next) => {
  try {
    const { city, isDriver, limit = 10, page = 1 } = req.query;

    const query = {
      _id: { $ne: req.user.id }, // Exclude current user
      isActive: true
    };

    if (city) {
      query.city = new RegExp(city, 'i');
    }

    if (isDriver !== undefined) {
      query.isDriver = isDriver === 'true';
    }

    const users = await User.find(query)
      .select('name profilePicture city rating isDriver vehicle')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'rating.average': -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
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

module.exports = router;