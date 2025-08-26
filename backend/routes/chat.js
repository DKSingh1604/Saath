const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Ride = require('../models/Ride');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

// @desc    Get chat for a ride
// @route   GET /api/chat/ride/:rideId
// @access  Private
router.get('/ride/:rideId', protect, async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user is part of the ride
    const isDriver = ride.driver.toString() === req.user.id;
    const isPassenger = ride.passengers.some(p => p.user.toString() === req.user.id);
    
    if (!isDriver && !isPassenger) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this chat'
      });
    }

    const chat = await Chat.findOne({ ride: req.params.rideId })
      .populate('participants.user', 'name profilePicture')
      .populate('messages.sender', 'name profilePicture')
      .populate('lastMessage.sender', 'name profilePicture');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's chat list
// @route   GET /api/chat
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const chats = await Chat.find({
      'participants.user': req.user.id,
      'participants.isActive': true
    })
    .populate('ride', 'origin destination departureTime status')
    .populate('participants.user', 'name profilePicture')
    .populate('lastMessage.sender', 'name profilePicture')
    .sort({ updatedAt: -1 });

    // Add unread count for each chat
    const chatsWithUnread = chats.map(chat => {
      const unreadCount = chat.unreadCounts.get(req.user.id.toString()) || 0;
      return {
        ...chat.toObject(),
        unreadCount
      };
    });

    res.status(200).json({
      success: true,
      data: chatsWithUnread
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Send a message
// @route   POST /api/chat/:chatId/messages
// @access  Private
router.post('/:chatId/messages', protect, [
  body('content').notEmpty().withMessage('Message content is required'),
  body('type').optional().isIn(['text', 'image', 'location']).withMessage('Invalid message type')
], async (req, res, next) => {
  try {
    const { content, type = 'text', metadata } = req.body;

    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p.user.toString() === req.user.id && p.isActive
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages in this chat'
      });
    }

    // Add message to chat
    await chat.addMessage({
      sender: req.user.id,
      content,
      type,
      metadata
    });

    const updatedChat = await Chat.findById(chat._id)
      .populate('messages.sender', 'name profilePicture')
      .populate('lastMessage.sender', 'name profilePicture');

    // Get the last message
    const lastMessage = updatedChat.messages[updatedChat.messages.length - 1];

    res.status(201).json({
      success: true,
      data: lastMessage
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark messages as read
// @route   PUT /api/chat/:chatId/read
// @access  Private
router.put('/:chatId/read', protect, async (req, res, next) => {
  try {
    const { messageId } = req.body;

    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p.user.toString() === req.user.id && p.isActive
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this chat'
      });
    }

    await chat.markAsRead(req.user.id, messageId);

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get chat messages with pagination
// @route   GET /api/chat/:chatId/messages
// @access  Private
router.get('/:chatId/messages', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(req.params.chatId)
      .populate('messages.sender', 'name profilePicture')
      .populate('messages.readBy.user', 'name')
      .select('messages participants');
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p.user.toString() === req.user.id && p.isActive
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this chat'
      });
    }

    // Paginate messages (newest first, then reverse for display)
    const totalMessages = chat.messages.length;
    const startIndex = Math.max(0, totalMessages - (page * limit));
    const endIndex = totalMessages - ((page - 1) * limit);
    
    const messages = chat.messages
      .slice(startIndex, endIndex)
      .reverse(); // Newest first

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;