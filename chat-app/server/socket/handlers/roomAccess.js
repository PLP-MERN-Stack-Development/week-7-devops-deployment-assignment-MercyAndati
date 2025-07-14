const Room = require('../../models/Room')
const connectedUsers = require('../connectedUsers')

module.exports = function (io, socket, user) {
  socket.on('join_room', async (roomId) => {
    const room = await Room.findById(roomId)
    if (!room) return

    const isCreator = room.creator.equals(user._id)
    const isMember = room.members.some(m => m.user.toString() === user._id.toString())

    if (room.type === 'private' && !(isCreator || isMember)) {
      socket.emit('access_denied', { roomId, reason: 'Permission needed to join this room.' })
      return
    }

    socket.join(roomId)
    socket.emit('joined_room', { roomId, roomName: room.name })
    io.to(roomId).emit('user_joined_room', { roomId, userId: user._id })
  })

socket.on('request_access', async ({ roomId }) => {
  const room = await Room.findById(roomId)
  if (!room || room.type !== 'private') return

  const alreadyRequested = room.joinRequests.includes(user._id)
  const alreadyMember = room.members.some(m => m.user.toString() === user._id.toString())

  if (!alreadyRequested && !alreadyMember) {
    room.joinRequests.push(user._id)
    await room.save()

    const creatorConn = connectedUsers.get(room.creator.toString())
    if (creatorConn) {
      io.to(creatorConn.socketId).emit('new_join_request', {
        roomId,
        requester: { id: user._id, username: user.username }
      })
    }
  }
})

  socket.on('respond_request', async ({ roomId, userId, approved }) => {
    const room = await Room.findById(roomId)
    if (!room || !room.creator.equals(user._id)) return

    room.joinRequests = room.joinRequests.filter(rid => rid.toString() !== userId)

    const isAlreadyMember = room.members.some(m => m.user.toString() === userId.toString())
    if (approved && !isAlreadyMember) {
    room.members.push({ user: userId })

    // Emit approval
    io.to(userId).emit('request_approved', { roomId })
        
    // Tell user to refresh their room list
    io.to(userId).emit('refresh_rooms')
    io.to(user._id.toString()).emit('refresh_rooms')
    } else {
    io.to(userId).emit('request_denied', { roomId })
    }
    await room.save()
  })

  socket.on('create_private_room_with', async (targetUserId) => {
    console.log(' creating private room with', targetUserId)
    const existing = await Room.findOne({
      type: 'private',
      'members.user': { $all: [user._id, targetUserId] },
      members: { $size: 2 }
    })

    if (existing) {
      socket.emit('joined_room', { roomId: existing._id, roomName: existing.name })
      return
    }

    const room = new Room({
      name: `${user.username} ${Math.floor(Math.random() * 900) + 100}`,
      type: 'private',
      creator: user._id,
      members: [
        { user: user._id },
        { user: targetUserId }
      ]
    })
    await room.save()

    socket.join(room._id)
    socket.emit('room_created', room)
  })

} 
