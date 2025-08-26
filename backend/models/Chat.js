const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxLength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'location', 'system'],
    default: 'text'
  },
  metadata: {
    imageUrl: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    systemMessageType: {
      type: String,
      enum: ['ride_booked', 'ride_cancelled', 'ride_completed', 'user_joined', 'user_left']
    }
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    originalContent: String
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true,
    unique: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['text', 'image', 'location', 'system'],
      default: 'text'
    }
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: {
    type: Boolean,
    default: true
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
chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add a participant
chatSchema.methods.addParticipant = function(userId) {
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    existingParticipant.isActive = true;
    existingParticipant.joinedAt = new Date();
  } else {
    this.participants.push({
      user: userId,
      joinedAt: new Date(),
      lastReadAt: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// Method to remove a participant
chatSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.isActive = false;
  }
  
  return this.save();
};

// Method to add a message
chatSchema.methods.addMessage = function(messageData) {
  const message = {
    sender: messageData.sender,
    content: messageData.content,
    type: messageData.type || 'text',
    metadata: messageData.metadata || {}
  };
  
  this.messages.push(message);
  
  // Update last message
  this.lastMessage = {
    content: message.content,
    sender: message.sender,
    timestamp: new Date(),
    type: message.type
  };
  
  // Update unread counts
  this.participants.forEach(participant => {
    if (participant.user.toString() !== messageData.sender.toString() && participant.isActive) {
      const currentCount = this.unreadCounts.get(participant.user.toString()) || 0;
      this.unreadCounts.set(participant.user.toString(), currentCount + 1);
    }
  });
  
  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(userId, messageId = null) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.lastReadAt = new Date();
    this.unreadCounts.set(userId.toString(), 0);
    
    if (messageId) {
      const message = this.messages.id(messageId);
      if (message) {
        const existingRead = message.readBy.find(
          r => r.user.toString() === userId.toString()
        );
        
        if (!existingRead) {
          message.readBy.push({
            user: userId,
            readAt: new Date()
          });
        }
      }
    }
  }
  
  return this.save();
};

// Virtual for active participants
chatSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => p.isActive);
});

// Virtual for total unread messages
chatSchema.virtual('totalUnreadMessages').get(function() {
  let total = 0;
  this.unreadCounts.forEach(count => {
    total += count;
  });
  return total;
});

// Index for better performance
chatSchema.index({ ride: 1 });
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ 'messages.createdAt': -1 });

module.exports = mongoose.model('Chat', chatSchema);