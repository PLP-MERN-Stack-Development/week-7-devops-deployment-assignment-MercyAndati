import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import socketService from '../socket/socketService'

const SocketContext = createContext()
const notificationSound = new Audio('./notification.mp3')

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [rooms, setRooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [typingUsers, setTypingUsers] = useState({})
  const [pendingRequests, setPendingRequests] = useState([])
  const [requestedRooms, setRequestedRooms] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})


  useEffect(() => {
    if (user) {
      if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission()
  }
      const token = localStorage.getItem('token')
      const socketInstance = socketService.connect(token)
      setSocket(socketInstance)

      socketInstance.on('online_users', (users) => {
        setOnlineUsers(users)
      })

      socketInstance.on('user_joined', (userData) => {
        setOnlineUsers(prev => [...prev.filter(u => u.id !== userData.id), userData])
      })

      socketInstance.on('user_left', (userId) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== userId))
      })

      socketInstance.on('rooms_list', (roomsList) => {
        setRooms(roomsList)
      })

      socketInstance.on('room_created', (room) => {
        setRooms(prev => {
          const exists = prev.find(r => r._id === room._id)
          if (exists) return prev
          return [...prev, room]
        })
      })

      socketInstance.on('joined_room', ({ roomId, roomName }) => {
        setCurrentRoom(roomId)
      })

      socketInstance.on('new_message', (message) => {
        setMessages(prev => [...prev, message])
            if (message.room !== currentRoom) {
          // Increase unread count for the room
          setUnreadCounts(prev => ({
            ...prev,
            [message.room]: (prev[message.room] || 0) + 1
          }));
        }

        if (message.sender?.id !== user?.id && document.visibilityState !== 'visible') {
          notificationSound.play().catch(err => console.error('Sound error', err))
          new Notification(`New message from ${message.sender.username}`, {
            body: message.content,
            icon: '/icon.png' 
          })
        }
        if (message.room !== currentRoom) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.room]: (prev[message.room] || 0) + 1
          }))
        }
      })

      socketInstance.on('messages_history', (messageHistory) => {
        setMessages(messageHistory)
      })

      socketInstance.on('user_typing', ({ userId, username, roomId }) => {
        setTypingUsers(prev => ({
          ...prev,
          [roomId]: { ...prev[roomId], [userId]: username }
        }))
      })
      socketInstance.on('invited_to_room', (room) => {
        console.log('✅ invited_to_room', room)
        setRooms(prev => [...prev, room])
      })
      socketInstance.on('refresh_rooms', () => {
      console.log('🌀 refresh_rooms received') 
      socketInstance.emit('get_rooms')
      })

      socketInstance.on('user_stopped_typing', ({ userId, roomId }) => {
        setTypingUsers(prev => {
          const roomTyping = { ...prev[roomId] }
          delete roomTyping[userId]
          return { ...prev, [roomId]: roomTyping }
        })
      })

      socketInstance.on('message_deleted', ({ messageId }) => {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === messageId ? { ...msg, isDeleted: true } : msg
          )
        )
      })

      socketInstance.on('room_deleted', ({ roomId }) => {
        setRooms(prev => prev.filter(room => room._id !== roomId))
        if (currentRoom === roomId) {
          setCurrentRoom(null)
          setMessages([])
        }
      })

      socketInstance.on('access_denied', ({ roomId, reason }) => {
        alert(`Access denied: ${reason}`)
      })

      socketInstance.on('new_join_request', ({ roomId, requester }) => {
        setPendingRequests(prev => [...prev, { roomId, requester }])
      })

      socketInstance.on('request_denied', ({ roomId }) => {
      setRequestedRooms(prev => prev.filter(id => id !== roomId)) // reset
      alert('Access denied by the room creator.')
    })

    socketInstance.on('request_approved', ({ roomId }) => {
      setRequestedRooms(prev => prev.filter(id => id !== roomId)) // cleanup
      alert('Access granted. You can now join the room.')
      socketInstance.emit('get_rooms') // ensure new membership is picked up
    })
    socketInstance.on('user_joined_room', ({ username, roomId }) => {
    // Only show if someone else joined the same room you're in
    if (!username || roomId !== currentRoom || username === user?.username) return;

    const systemMsg = {
      _id: `sys-${Date.now()}`,
      type: 'system',
      content: `${username} joined the room`,
      timestamp: new Date(),
      room: roomId
    };

  setMessages(prev => [...prev, systemMsg]);

    // Auto-remove system message after 5 seconds
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg._id !== systemMsg._id));
    }, 5000);
  });

    socketInstance.on('user_left_room', ({ username, roomId }) => {
      if (roomId !== currentRoom || username === user?.username) return;

    const systemMsg = {
      _id: `sys-left-${Date.now()}`,
      type: 'system',
      content: `${username} left the room.`,
      timestamp: new Date(),
      room: roomId
    };

    setMessages(prev => [...prev, systemMsg]);

    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg._id !== systemMsg._id));
    }, 5000);
    })

      socketInstance.on('invited_to_room', (room) => {
        setRooms(prev => [...prev, room])
      })
      socketInstance.on('request_approved', ({ roomId }) => {
      // ✅ Fetch updated rooms so the newly approved room appears
      socketInstance.emit('get_rooms')

      // ✅ remove the request from local state if you're tracking it
      setRequestedRooms(prev => prev.filter(id => id !== roomId))

      alert('Access granted. You can now join the room.')
    })

      socketInstance.emit('get_rooms')
      socketInstance.emit('get_online_users')

      return () => {
        socketService.disconnect()
        setSocket(null)
        setOnlineUsers([])
        setMessages([])
        setRooms([])
        setCurrentRoom(null)
        setTypingUsers({})
        setRequestedRooms([])
      }
    }
  }, [user])

    useEffect(() => {
  if (!socket || !user) return;

  const handleUserJoined = ({ username, roomId }) => {
    if (roomId !== currentRoom || username === user?.username) return;

    const systemMsg = {
      _id: `sys-joined-${Date.now()}`,
      type: 'system',
      content: `${username} joined the room.`,
      timestamp: new Date(),
      room: roomId
    };

    setMessages(prev => [...prev, systemMsg]);

    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg._id !== systemMsg._id));
    }, 5000);
  };
  socket.on('user_joined_room', handleUserJoined);
  }, [socket, currentRoom, user]);

  const joinRoom = (roomId) => {
  if (socket && roomId) {
    socket.emit('join_room', roomId)
    setCurrentRoom(roomId)
    socket.emit('get_messages', roomId)

    // Reset unread count
    setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }))
  }
}

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leave_room', roomId)
      if (currentRoom === roomId) {
        setCurrentRoom(null)
        setMessages([])
      }
    }
  }

  const sendMessage = (content, type = 'text') => {
    if (socket && currentRoom && content.trim()) {
      socket.emit('send_message', {
        roomId: currentRoom,
        content: content.trim(),
        type
      })
    }
  }

  const createRoom = (name, description, isPrivate = false) => {
    if (socket) {
      socket.emit('create_room', { 
        name: name.trim(), 
        description: description?.trim(), 
        type: isPrivate ? 'private' : 'public' 
      })
    }
  }

    const requestRoomAccess = (roomId) => {
    socket?.emit('request_access', { roomId })
    setRequestedRooms(prev => [...new Set([...prev, roomId])])  // avoids duplicates
  }

    const respondToRequest = (roomId, userId, approved) => {
      socket?.emit('respond_request', { roomId, userId, approved })
      setPendingRequests(prev => prev.filter(
        r => !(r.roomId === roomId && r.requester.id === userId)
      ))  }

    const createPrivateRoomWith = (targetUserId) => {
    console.log('🔥 EMIT create_private_room_with for', targetUserId)
    socket?.emit('create_private_room_with', targetUserId)
  }

  const startTyping = () => {
    if (socket && currentRoom) {
      socket.emit('typing_start', currentRoom)
    }
  }

  const stopTyping = () => {
    if (socket && currentRoom) {
      socket.emit('typing_stop', currentRoom)
    }
  }

  const deleteMessage = (messageId) => {
    if (socket) {
      socket.emit('delete_message', messageId)
    }
  }

  const deleteRoom = (roomId) => {
    if (socket) {
      socket.emit('delete_room', roomId)
    }
  }

  const uploadFile = async (file, roomId) => {
    if (!socket || !file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('roomId', roomId)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        socket.emit('send_message', {
          roomId,
          content: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          fileUrl: result.fileUrl,
          fileName: file.name,
          fileSize: file.size
        })
      }
    } catch (error) {
      console.error('File upload error:', error)
    }
  }
  
  return (
    <SocketContext.Provider value={{
      socket,
      onlineUsers,
      messages,
      rooms,
      currentRoom,
      typingUsers,
      pendingRequests,
      joinRoom,
      leaveRoom,
      sendMessage,
      createRoom,
      startTyping,
      stopTyping,
      deleteMessage,
      deleteRoom,
      uploadFile,
      setMessages,
      requestRoomAccess,
      respondToRequest,
      requestedRooms,
      createPrivateRoomWith
    }}>
      {children}
    </SocketContext.Provider>
  )
  
}