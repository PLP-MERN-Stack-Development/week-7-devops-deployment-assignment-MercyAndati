const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all public rooms
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ 
      type: 'public', 
      isActive: true 
    })
    .populate('creator', 'username')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    res.json({ rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's rooms
router.get('/my-rooms', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ 
      'members.user': req.user.id,
      isActive: true 
    })
    .populate('creator', 'username')
    .populate('lastMessage')
    .populate('members.user', 'username isOnline')
    .sort({ lastActivity: -1 });

    res.json({ rooms });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new room
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, type = 'public' } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    // Check if room with same name exists
    const existingRoom = await Room.findOne({ name: name.trim() });
    if (existingRoom) {
      return res.status(400).json({ error: 'Room with this name already exists' });
    }

    const room = new Room({
      name: name.trim(),
      description: description?.trim(),
      type,
      creator: req.user.id,
      members: [{
        user: req.user.id,
        role: 'admin'
      }]
    });

    await room.save();
    await room.populate('creator', 'username');

    res.status(201).json({
      message: 'Room created successfully',
      room
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Server error during room creation' });
  }
});

// Join room
router.post('/:roomId/join', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.isActive) {
      return res.status(400).json({ error: 'Room is not active' });
    }

    if (room.isMember(req.user.id)) {
      return res.status(400).json({ error: 'Already a member of this room' });
    }

    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    await room.addMember(req.user.id);
    await room.populate('members.user', 'username isOnline');

    res.json({
      message: 'Joined room successfully',
      room
    });

  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave room
router.post('/:roomId/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.isMember(req.user.id)) {
      return res.status(400).json({ error: 'Not a member of this room' });
    }

    await room.removeMember(req.user.id);

    res.json({ message: 'Left room successfully' });

  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get room details
router.get('/:roomId', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('creator', 'username')
      .populate('members.user', 'username isOnline status');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.isMember(req.user.id) && room.type !== 'public') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ room });

  } catch (error) {
    console.error('Get room details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete room (admin only)
router.delete('/:roomId', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.creator.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only room creator can delete the room' });
    }

    room.isActive = false;
    await room.save();

    res.json({ message: 'Room deleted successfully' });

  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;