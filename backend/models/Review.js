const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    overall: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    driving: {
      type: Number,
      min: 1,
      max: 5
    },
    friendliness: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  comment: {
    type: String,
    trim: true,
    maxLength: [500, 'Comment cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    enum: [
      'punctual', 'late', 'friendly', 'quiet', 'talkative', 'clean', 'messy',
      'safe_driver', 'reckless', 'polite', 'rude', 'helpful', 'cancelled_last_minute',
      'great_music', 'no_show', 'comfortable_car', 'uncomfortable_car', 'professional',
      'flexible', 'rigid', 'reliable', 'unreliable'
    ]
  }],
  reviewType: {
    type: String,
    enum: ['driver_to_passenger', 'passenger_to_driver'],
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: true // Assuming all reviews are verified after ride completion
  },
  helpfulVotes: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'harassment', 'other']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isHidden: {
    type: Boolean,
    default: false
  },
  moderatorNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure one review per user per ride
reviewSchema.index({ ride: 1, reviewer: 1 }, { unique: true });

// Method to calculate average rating
reviewSchema.methods.calculateAverageRating = function() {
  const ratings = this.rating;
  const ratingKeys = ['punctuality', 'communication', 'cleanliness', 'driving', 'friendliness'];
  
  let sum = ratings.overall;
  let count = 1;
  
  ratingKeys.forEach(key => {
    if (ratings[key]) {
      sum += ratings[key];
      count++;
    }
  });
  
  return Math.round((sum / count) * 10) / 10; // Round to 1 decimal place
};

// Static method to update user rating
reviewSchema.statics.updateUserRating = async function(userId) {
  const User = mongoose.model('User');
  
  const stats = await this.aggregate([
    {
      $match: {
        reviewee: mongoose.Types.ObjectId(userId),
        isHidden: false
      }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating.overall' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await User.findByIdAndUpdate(userId, {
      'rating.average': Math.round(stats[0].avgRating * 10) / 10,
      'rating.count': stats[0].totalReviews
    });
  }
};

// Method to add helpful vote
reviewSchema.methods.addHelpfulVote = function(userId) {
  if (!this.helpfulVotes.users.includes(userId)) {
    this.helpfulVotes.users.push(userId);
    this.helpfulVotes.count += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove helpful vote
reviewSchema.methods.removeHelpfulVote = function(userId) {
  const index = this.helpfulVotes.users.indexOf(userId);
  if (index > -1) {
    this.helpfulVotes.users.splice(index, 1);
    this.helpfulVotes.count = Math.max(0, this.helpfulVotes.count - 1);
    return this.save();
  }
  return Promise.resolve(this);
};

// Indexes for better performance
reviewSchema.index({ reviewee: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1, createdAt: -1 });
reviewSchema.index({ 'rating.overall': -1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);