const socketAuth = require('../middleware/socketAuth');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');
const connectedUsers = require('./connectedUsers.js')
const roomAccessHandler = require('./handlers/roomAccess');


module.exports = (io) => {
  // Socket authentication middleware
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    try {
      console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

      // Store user connection
      connectedUsers.set(socket.user.id.toString(), {
        socketId: socket.id,
        user: socket.user
      });

      // Update user online status
      await socket.user.setOnline(socket.id);
      roomAccessHandler(io, socket, socket.user);

      // Join user's rooms
      const userRooms = await Room.find({ 'members.user': socket.user.id });
      userRooms.forEach(room => {
        socket.join(room._id.toString());
      });

      // Broadcast user online status
      socket.broadcast.emit('user_joined', {
        id: socket.user.id,
        username: socket.user.username,
        status: 'online'
      });

      // Send current online users
      const onlineUsers = Array.from(connectedUsers.values()).map(conn => ({
        id: conn.user.id,
        username: conn.user.username,
        status: conn.user.status
      }));
      
      socket.emit('online_users', onlineUsers);

      // Send all public rooms and user's private rooms
      const publicRooms = await Room.find({ type: 'public', isActive: true })
        .populate('creator', 'username')
        .populate('lastMessage')
        .sort({ lastActivity: -1 });

      const userPrivateRooms = await Room.find({
        type: 'private',
        isActive: true
      })
        .populate('creator', 'username')
        .populate('lastMessage')
        .sort({ lastActivity: -1 });

      const allRooms = [...publicRooms, ...userPrivateRooms];
      socket.emit('rooms_list', allRooms);

      // Handle get rooms request
      socket.on('get_rooms', async () => {
        try {
          const publicRooms = await Room.find({ type: 'public', isActive: true })
            .populate('creator', 'username')
            .populate('lastMessage')
            .sort({ lastActivity: -1 });

          const userPrivateRooms = await Room.find({
            type: 'private',
            isActive: true
          })
            .populate('creator', 'username')
            .populate('lastMessage')
            .sort({ lastActivity: -1 });

          const allRooms = [...publicRooms, ...userPrivateRooms];
          socket.emit('rooms_list', allRooms);
        } catch (error) {
          console.error('Get rooms error:', error);
          socket.emit('error', { message: 'Failed to get rooms' });
        }
      });

      // Handle creating rooms
      socket.on('create_room', async (data) => {
        try {
          const { name, description, type = 'public' } = data;

          if (!name || name.trim().length === 0) {
            return socket.emit('error', { message: 'Room name is required' });
          }

          // Check if room with same name exists
          const existingRoom = await Room.findOne({ name: name.trim() });
          if (existingRoom) {
            return socket.emit('error', { message: 'Room with this name already exists' });
          }

          const room = new Room({
            name: name.trim(),
            description: description?.trim(),
            type,
            creator: socket.user.id,
            members: [{
              user: socket.user.id,
              role: 'admin'
            }]
          });

          await room.save();
          await room.populate('creator', 'username');

          // Join the creator to the room
          socket.join(room._id.toString());

          // Emit to all users if it's a public room
          if (type === 'public') {
            io.emit('room_created', room);
          } else {
            io.emit('room_created', room);
          }

          console.log(`🏠 Room created: ${room.name} by ${socket.user.username}`);
        } catch (error) {
          console.error('Create room error:', error);
          socket.emit('error', { message: 'Failed to create room' });
        }
      });
            
      socket.on('create_private_room_with', async (targetUserId) => {
        try {
          console.log('📨 Creating private room with:', targetUserId)

          // Check if room already exists between the two users
          const existingRoom = await Room.findOne({
            type: 'private',
            members: {
              $all: [
                { $elemMatch: { user: socket.user.id } },
                { $elemMatch: { user: targetUserId } }
              ]
            }
          })

          if (existingRoom) {
            return socket.emit('joined_room', { roomId: existingRoom._id, roomName: existingRoom.name })
          }

          const room = new Room({
            name: `${socket.user.username} ${Math.floor(Math.random() * 900) + 100}`,
            type: 'private',
            creator: socket.user.id,
            members: [
              { user: socket.user.id, role: 'admin' },
              { user: targetUserId, role: 'member' }
            ]
          })

          await room.save()
          await room.populate('creator', 'username')

          socket.join(room._id.toString())
          socket.emit('joined_room', { roomId: room._id, roomName: room.name })

          const targetConnection = connectedUsers.get(targetUserId)
          if (targetConnection) {
            io.to(targetConnection.socketId).emit('invited_to_room', room)
          }

          console.log(`✅ Private room created: ${room.name}`)
        } catch (error) {
          console.error('❌ create_private_room_with error:', error)
          socket.emit('error', { message: 'Could not create private chat' })
        }
      })
      // Handle joining a room
      socket.on('join_room', async (roomId) => {
        try {
          const room = await Room.findById(roomId);
          if (!room) {
            return socket.emit('error', { message: 'Room not found' });
          }

          // For public rooms, auto-join user if not already a member
          if (room.type === 'public' && !room.isMember(socket.user.id)) {
            await room.addMember(socket.user.id);
          }

          if (!room.isMember(socket.user.id)) {
            return socket.emit('error', { message: 'Not a member of this room' });
          }

          socket.join(roomId);
          socket.emit('joined_room', { roomId, roomName: room.name });
          
          // Send recent messages for this room
          const messages = await Message.find({ 
            room: roomId, 
            isDeleted: false 
          })
          .populate('sender', 'username avatar')
          .sort({ createdAt: -1 })
          .limit(50);

          socket.emit('messages_history', messages.reverse());

          // Notify others in the room
          socket.to(roomId).emit('user_joined_room', {
            userId: socket.user.id,
            username: socket.user.username,
            roomId
          });
          
          console.log(`👥 ${socket.user.username} joined room: ${room.name}`);
          } catch (error) {
            console.error('Join room error:', error);
            socket.emit('error', { message: 'Failed to join room' });
          }
        });

      // Handle get messages
      socket.on('get_messages', async (roomId) => {
        try {
          const room = await Room.findById(roomId);
          if (!room || !room.isMember(socket.user.id)) {
            return socket.emit('error', { message: 'Access denied' });
          }

          const messages = await Message.find({ 
            room: roomId, 
            isDeleted: false 
          })
          .populate('sender', 'username avatar')
          .sort({ createdAt: -1 })
          .limit(50);

          socket.emit('messages_history', messages.reverse());
        } catch (error) {
          console.error('Get messages error:', error);
          socket.emit('error', { message: 'Failed to get messages' });
        }
      });

      // Handle leaving a room
      socket.on('leave_room', async (roomId) => {
        try {
          const room = await Room.findById(roomId);
          if (!room) {
            return socket.emit('error', { message: 'Room not found' });
          }

          socket.leave(roomId);
          socket.emit('left_room', { roomId, roomName: room.name });
          
        } catch (error) {
          console.error('Leave room error:', error);
          socket.emit('error', { message: 'Failed to leave room' });
        }
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const { roomId, content, type = 'text', replyTo } = data;

          if (!content || content.trim().length === 0) {
            return socket.emit('error', { message: 'Message content is required' });
          }

          const room = await Room.findById(roomId);
          if (!room) {
            return socket.emit('error', { message: 'Room not found' });
          }

          if (!room.isMember(socket.user.id)) {
            return socket.emit('error', { message: 'Not a member of this room' });
          }

          // Create message
          const message = new Message({
            content: content.trim(),
            sender: socket.user.id,
            room: roomId,
            type,
            replyTo
          });

          await message.save();
          await message.populate('sender', 'username avatar');
          if (replyTo) {
            await message.populate('replyTo', 'content sender');
          }

          // Update room last activity
          await room.updateLastActivity();
          room.lastMessage = message._id;
          await room.save();

          // Broadcast message to room
          io.to(roomId).emit('new_message', message);

          console.log(`💬 Message sent by ${socket.user.username} in ${room.name}`);
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle delete message
      socket.on('delete_message', async (messageId) => {
        try {
          console.log('Delete message request:', messageId)
          const message = await Message.findById(messageId);
          if (!message) {
            return socket.emit('error', { message: 'Message not found' });
          }

          const room = await Room.findById(message.room);
          if (!room) {
            return socket.emit('error', { message: 'Room not found' });
          }

          // Check if user can delete (sender or room admin)
          const canDelete = message.sender.toString() === socket.user.id.toString() || 
                           room.creator.toString() === socket.user.id.toString();

          if (!canDelete) {
            return socket.emit('error', { message: 'Not authorized to delete this message' });
          }

          await message.softDelete();
          console.log('Message deleted successfully:', messageId)

          // Broadcast message deletion to room
          io.to(message.room.toString()).emit('message_deleted', {
            messageId: message._id,
            deletedBy: socket.user.id
          });

          console.log(`🗑️ Message deleted by ${socket.user.username}`);
        } catch (error) {
          console.error('Delete message error:', error);
          socket.emit('error', { message: 'Failed to delete message' });
        }
      });

      // Handle delete room
      socket.on('delete_room', async (roomId) => {
        try {
          console.log('Delete room request:', roomId)
          const room = await Room.findById(roomId);
          if (!room) {
            return socket.emit('error', { message: 'Room not found' });
          }

          // Check if user is the creator
          if (room.creator.toString() !== socket.user.id.toString()) {
            return socket.emit('error', { message: 'Only room creator can delete the room' });
          }

          // Soft delete the room
          room.isActive = false;
          await room.save();

          // Notify all users about room deletion
          io.emit('room_deleted', { roomId: room._id });

          console.log(`🗑️ Room deleted: ${room.name} by ${socket.user.username}`);
        } catch (error) {
          console.error('Delete room error:', error);
          socket.emit('error', { message: 'Failed to delete room' });
        }
      });
      // Handle typing indicators
      socket.on('typing_start', async (roomId) => {
        try {
          const room = await Room.findById(roomId);
          if (!room || !room.isMember(socket.user.id)) {
            return;
          }

          socket.to(roomId).emit('user_typing', {
            userId: socket.user.id,
            username: socket.user.username,
            roomId
          });
        } catch (error) {
          console.error('Typing start error:', error);
        }
      });

      socket.on('typing_stop', async (roomId) => {
        try {
          const room = await Room.findById(roomId);
          if (!room || !room.isMember(socket.user.id)) {
            return;
          }

          socket.to(roomId).emit('user_stopped_typing', {
            userId: socket.user.id,
            username: socket.user.username,
            roomId
          });
        } catch (error) {
          console.error('Typing stop error:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          console.log(`🔌 User disconnected: ${socket.user.username} (${socket.id})`);

          // Remove from connected users
          connectedUsers.delete(socket.user.id.toString());

          // Update user offline status
          await socket.user.setOffline();

          // Broadcast user offline status
          socket.broadcast.emit('user_left', socket.user.id);

        } catch (error) {
          console.error('Disconnect error:', error);
        }
      });

    } catch (error) {
      console.error('Socket connection error:', error);
      socket.emit('error', { message: 'Connection failed' });
    }
  });

  // Middleware to handle socket errors
  io.engine.on('connection_error', (err) => {
    console.error('Socket connection error:', err);
  });

// Run every hour
setInterval(async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

  try {
    const result = await Message.deleteMany({
      isDeleted: true,
      deletedAt: { $lte: cutoff }
    })

    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} deleted messages`)
    }
  } catch (error) {
    console.error('Auto-delete cleanup failed:', error)
  }
}, 60 * 60 * 1000) // every hour

};