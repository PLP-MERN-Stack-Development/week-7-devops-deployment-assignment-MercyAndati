
import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
  }

  connect(token) {
    const SOCKET_URL = import.meta.env.SOCKET_URL || 'http://localhost:5000';

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    })

    this.socket.on('connect', () => {
      console.log('Connected to server')
      this.isConnected = true
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      this.isConnected = false
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  getSocket() {
    return this.socket
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected
  }

  // Room operations
  joinRoom(roomId) {
    if (this.socket) {
      this.socket.emit('join-room', roomId)
    }
  }

  leaveRoom(roomId) {
    if (this.socket) {
      this.socket.emit('leave-room', roomId)
    }
  }

  // Message operations
  sendMessage(message) {
    if (this.socket) {
      this.socket.emit('send-message', message)
    }
  }

  // Typing indicators
  startTyping(roomId) {
    if (this.socket) {
      this.socket.emit('typing-start', { roomId })
    }
  }

  stopTyping(roomId) {
    if (this.socket) {
      this.socket.emit('typing-stop', { roomId })
    }
  }
}

const socketService = new SocketService()
export default socketService
