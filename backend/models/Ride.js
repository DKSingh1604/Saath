const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  origin: {
    address: {
      type: String,
      required: [true, 'Origin address is required']
    },
    coordinates: {
      type: [Number], // [long, lat]
      required: [true, 'Origin coordinates are required']
    },
    city: {
      type: String,
      required: true
    }
  },
  destination: {
    address: {
      type: String,
      required: [true, 'Destination address is required']
    },
    coordinates: {
      type: [Number], // [long, lat]
      required: [true, 'Destination coordinates are required']
    },
    city: {
      type: String,
      required: true
    }
  },
  departureTime: {
    type: Date,
    required: [true, 'Departure time is required']
  },
  estimatedArrivalTime: {
    type: Date
  },
  availableSeats: {
    type: Number,
    required: [true, 'Available seats is required'],
    min: [0, "Available seats cannot be negative"],
    validate: {
      validator: Number.isInteger,
      message: "Available seats must be an integer",
    },
    max: [7, 'Maximum 7 seats allowed']
  },
  pricePerSeat: {
    type: Number,
    required: [true, 'Price per seat is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY']
  },
  route: {
    distance: {
      type: Number, // in kilometers
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true
    },
    waypoints: [{
      address: String,
      coordinates: [Number],
      pickupAllowed: {
        type: Boolean,
        default: true
      },
      dropoffAllowed: {
        type: Boolean,
        default: true
      }
    }]
  },
  passengers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    seatsBooked: {
      type: Number,
      required: true,
      min: 1
    },
    pickupPoint: {
      address: String,
      coordinates: [Number]
    },
    dropoffPoint: {
      address: String,
      coordinates: [Number]
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'confirmed'
    },
    bookingTime: {
      type: Date,
      default: Date.now
    },
    totalAmount: {
      type: Number,
      required: true
    }
  }],
  vehicleInfo: {
    make: String,
    model: String,
    color: String,
    plateNumber: String
  },
  preferences: {
    smokingAllowed: {
      type: Boolean,
      default: false
    },
    petsAllowed: {
      type: Boolean,
      default: false
    },
    musicPreference: {
      type: String,
      enum: ['any', 'no_music', 'soft', 'upbeat'],
      default: 'any'
    },
    conversationLevel: {
      type: String,
      enum: ['quiet', 'some_chat', 'chatty'],
      default: 'some_chat'
    },
    maxDetour: {
      type: Number, // in kilometers
      default: 5
    }
  },
  status: {
    type: String,
    enum: ['active', 'full', 'completed', 'cancelled'],
    default: 'active'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: function() { return this.isRecurring; }
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6 // 0 = Sunday, 6 = Saturday
    }],
    endDate: Date
  },
  notes: {
    type: String,
    maxLength: [500, 'Notes cannot exceed 500 characters']
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
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
rideSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total booked seats
rideSchema.virtual('bookedSeats').get(function() {
  return this.passengers.reduce((total, passenger) => {
    if (passenger.status === 'confirmed' || passenger.status === 'completed') {
      return total + passenger.seatsBooked;
    }
    return total;
  }, 0);
});

// Virtual for remaining seats
rideSchema.virtual('remainingSeats').get(function() {
  return this.availableSeats - this.bookedSeats;
});

// Virtual for total earnings
rideSchema.virtual('totalEarnings').get(function() {
  return this.passengers.reduce((total, passenger) => {
    if (passenger.status === 'confirmed' || passenger.status === 'completed') {
      return total + passenger.totalAmount;
    }
    return total;
  }, 0);
});

// Check if ride is full
rideSchema.methods.isFull = function() {
  return this.bookedSeats >= this.availableSeats;
};

// Check if user can book this ride
rideSchema.methods.canBook = function(userId, seatsRequested) {
  // Check if user is the driver
  if (this.driver.toString() === userId.toString()) {
    return { canBook: false, reason: 'Cannot book your own ride' };
  }
  
  // Check if user already booked this ride
  const existingBooking = this.passengers.find(
    passenger => passenger.user.toString() === userId.toString() && 
    (passenger.status === 'pending' || passenger.status === 'confirmed')
  );
  
  if (existingBooking) {
    return { canBook: false, reason: 'Already booked this ride' };
  }
  
  // Check if enough seats available
  if (this.remainingSeats < seatsRequested) {
    return { canBook: false, reason: 'Not enough seats available' };
  }
  
  // Check if ride is in the past
  if (this.departureTime < new Date()) {
    return { canBook: false, reason: 'Ride has already departed' };
  }
  
  return { canBook: true };
};

// Geospatial index for location-based queries
rideSchema.index({ 'origin.coordinates': '2dsphere' });
rideSchema.index({ 'destination.coordinates': '2dsphere' });

// Other indexes for better performance
rideSchema.index({ driver: 1, status: 1 });
rideSchema.index({ departureTime: 1, status: 1 });
rideSchema.index({ 'origin.city': 1, 'destination.city': 1 });
rideSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Ride', rideSchema);