const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Ride = require('../models/Ride');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, [
  body('ride').isMongoId().withMessage('Valid ride ID is required'),
  body('reviewee').isMongoId().withMessage('Valid reviewee ID is required'),
  body('rating.overall').isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
], async (req, res, next) => {
  try {
    const { ride: rideId, reviewee, rating, comment, tags, reviewType, isAnonymous } = req.body;

    // Check if ride exists and user was part of it
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if ride is completed
    if (ride.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed rides'
      });
    }

    // Check if user was part of the ride
    const isDriver = ride.driver.toString() === req.user.id;
    const isPassenger = ride.passengers.some(p => p.user.toString() === req.user.id);
    
    if (!isDriver && !isPassenger) {
      return res.status(403).json({
        success: false,
        message: 'You can only review rides you participated in'
      });
    }

    // Check if reviewer is trying to review themselves
    if (reviewee === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review yourself'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      ride: rideId,
      reviewer: req.user.id,
      reviewee
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this user for this ride'
      });
    }

    // Create review
    const review = await Review.create({
      ride: rideId,
      reviewer: req.user.id,
      reviewee,
      rating,
      comment,
      tags,
      reviewType,
      isAnonymous: isAnonymous || false
    });

    // Update user's rating
    await Review.updateUserRating(reviewee);

    // Populate review for response
    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name profilePicture')
      .populate('reviewee', 'name profilePicture')
      .populate('ride', 'origin destination departureTime');

    res.status(201).json({
      success: true,
      data: populatedReview
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, reviewType } = req.query;

    let query = {
      reviewee: req.params.userId,
      isHidden: false
    };

    if (reviewType) {
      query.reviewType = reviewType;
    }

    const reviews = await Review.find(query)
      .populate('reviewer', 'name profilePicture')
      .populate('ride', 'origin destination departureTime')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    // Calculate rating statistics
    const stats = await Review.aggregate([
      { $match: { reviewee: mongoose.Types.ObjectId(req.params.userId), isHidden: false } },
      {
        $group: {
          _id: '$reviewType',
          avgRating: { $avg: '$rating.overall' },
          count: { $sum: 1 },
          ratings: { $push: '$rating.overall' }
        }
      }
    ]);

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating.overall]++;
    });

    res.status(200).json({
      success: true,
      data: reviews,
      stats,
      ratingDistribution,
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

// @desc    Get reviews for a ride
// @route   GET /api/reviews/ride/:rideId
// @access  Private
router.get('/ride/:rideId', protect, async (req, res, next) => {
  try {
    const reviews = await Review.find({ ride: req.params.rideId })
      .populate('reviewer', 'name profilePicture')
      .populate('reviewee', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
router.put('/:id', protect, [
  body('rating.overall').optional().isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
], async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Check if review is within edit time limit (e.g., 24 hours)
    const editTimeLimit = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - review.createdAt > editTimeLimit) {
      return res.status(400).json({
        success: false,
        message: 'Review can only be edited within 24 hours of creation'
      });
    }

    const { rating, comment, tags } = req.body;
    const updateData = {};
    
    if (rating) updateData.rating = { ...review.rating, ...rating };
    if (comment !== undefined) updateData.comment = comment;
    if (tags) updateData.tags = tags;

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('reviewer', 'name profilePicture')
     .populate('reviewee', 'name profilePicture');

    // Update user's rating
    await Review.updateUserRating(review.reviewee);

    res.status(200).json({
      success: true,
      data: updatedReview
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await review.deleteOne();

    // Update user's rating
    await Review.updateUserRating(review.reviewee);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add helpful vote to review
// @route   POST /api/reviews/:id/helpful
// @access  Private
router.post('/:id/helpful', protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.addHelpfulVote(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Helpful vote added'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Remove helpful vote from review
// @route   DELETE /api/reviews/:id/helpful
// @access  Private
router.delete('/:id/helpful', protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.removeHelpfulVote(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Helpful vote removed'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;