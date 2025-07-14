const express = require('express');
const Message = require('../models/Message');
const Room = require('../models/Room');
const auth = require('../middleware/auth');

const router = express.Router();

// Get messages for a room
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user is member of the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.isMember(req.user.id) && room.type !== 'public') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ 
      room: roomId, 
      isDeleted: false 
    })
    .populate('sender', 'username avatar')
    .populate('replyTo', 'content sender')
    .populate('reactions.user', 'username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalMessages = await Message.countDocuments({ 
      room: roomId, 
      isDeleted: false 
    });

    res.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get private messages between users
router.get('/private/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Find or create direct message room
    let room = await Room.findOne({
      type: 'direct',
      'members.user': { $all: [req.user.id, userId] }
    });

    if (!room) {
      // Create new direct message room
      room = new Room({
        name: `DM_${req.user.id}_${userId}`,
        type: 'direct',
        creator: req.user.id,
        members: [
          { user: req.user.id, role: 'admin' },
          { user: userId, role: 'admin' }
        ]
      });
      await room.save();
    }

    const messages = await Message.find({ 
      room: room._id, 
      isDeleted: false 
    })
    .populate('sender', 'username avatar')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalMessages = await Message.countDocuments({ 
      room: room._id, 
      isDeleted: false 
    });

    res.json({
      messages: messages.reverse(),
      roomId: room._id,
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      }
    });

  } catch (error) {
    console.error('Get private messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Can only delete your own messages' });
    }

    await message.softDelete();

    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add reaction to message
router.post('/:messageId/reaction', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ error: 'Cannot react to deleted message' });
    }

    await message.addReaction(req.user.id, emoji);
    await message.populate('reactions.user', 'username');

    res.json({
      message: 'Reaction added successfully',
      reactions: message.reactions
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove reaction from message
router.delete('/:messageId/reaction', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.removeReaction(req.user.id, emoji);
    await message.populate('reactions.user', 'username');

    res.json({
      message: 'Reaction removed successfully',
      reactions: message.reactions
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;