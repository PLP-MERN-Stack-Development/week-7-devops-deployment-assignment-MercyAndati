const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'offline'
  },
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  isTyping: {
    type: Boolean,
    default: false
  },
  typingInRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last seen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Set online status
userSchema.methods.setOnline = function(socketId) {
  this.isOnline = true;
  this.status = 'online';
  this.socketId = socketId;
  this.lastSeen = new Date();
  return this.save();
};

// Set offline status
userSchema.methods.setOffline = function() {
  this.isOnline = false;
  this.status = 'offline';
  this.socketId = null;
  this.isTyping = false;
  this.typingInRoom = null;
  this.lastSeen = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);