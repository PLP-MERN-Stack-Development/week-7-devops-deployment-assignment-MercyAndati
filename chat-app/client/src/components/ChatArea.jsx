import React, { useState, useRef, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { 
  Send, 
  Menu, 
  Phone, 
  Video, 
  MoreVertical,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Trash2
} from 'lucide-react'

const ChatArea = ({ onToggleSidebar, isMobile }) => {
  const {
    messages,
    currentRoom,
    rooms,
    sendMessage,
    startTyping,
    stopTyping,
    typingUsers,
    deleteMessage,
    pendingRequests,
    respondToRequest
  } = useSocket()
  const { user } = useAuth()
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const currentRoomData = rooms.find(room => room._id === currentRoom)
  const currentRoomTyping = typingUsers[currentRoom] || {}
  const typingUsernames = Object.values(currentRoomTyping).filter(username => username !== user?.username)

  const roomRequests = pendingRequests.filter(r => r.roomId === currentRoom)
  const isCreator = currentRoomData?.creator === user?.id || currentRoomData?.creator?._id === user?.id

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleInputChange = (e) => {
    setMessageInput(e.target.value)
    if (!isTyping) {
      setIsTyping(true)
      startTyping()
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      stopTyping()
    }, 1000)
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (messageInput.trim()) {
      sendMessage(messageInput.trim())
      setMessageInput('')
      if (isTyping) {
        setIsTyping(false)
        stopTyping()
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(messageId)
    }
  }

  const handleFileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) alert(`File selected: ${file.name}. File upload feature coming soon!`)
    }
    input.click()
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) alert(`Image selected: ${file.name}. Image upload feature coming soon!`)
    }
    input.click()
  }

  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return 'Today'
    else if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    else return date.toLocaleDateString()
  }
  const groupMessagesByDate = (messages) => {
    const groups = {}
    messages.forEach(message => {
      const date = formatDate(message.createdAt || message.timestamp)
      if (!groups[date]) groups[date] = []
      groups[date].push(message)
    })
    return groups
  }
  const messageGroups = groupMessagesByDate(messages.filter(msg => msg.room === currentRoom))
  const canDeleteMessage = (message) => message.sender?._id === user?.id || message.sender?.id === user?.id || currentRoomData?.creator === user?.id

  if (!currentRoom || !currentRoomData) {
    return <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-800">
      <p className="text-gray-600 dark:text-slate-400">Select a room to start chatting</p>
    </div>
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isMobile && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-slate-400" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentRoomData.name}
              </h2>
              {currentRoomData.description && (
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {currentRoomData.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <Phone className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <Video className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {isCreator && roomRequests.length > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Join Requests</h4>
            {roomRequests.map(({ requester }) => (
              <div key={requester.id} className="flex justify-between items-center text-sm mb-2">
                <span className="font-semibold text-gray-800 dark:text-white">{requester.username}</span>
                <div className="space-x-2">
                  <button onClick={() => respondToRequest(currentRoom, requester.id, true)} className="px-2 py-1 text-xs bg-green-500 text-white rounded">Approve</button>
                  <button onClick={() => respondToRequest(currentRoom, requester.id, false)} className="px-2 py-1 text-xs bg-red-500 text-white rounded">Deny</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-4">
        <div className="space-y-4">
          {Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Divider */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-700">
                  <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                    {date}
                  </span>
                </div>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message) => {
                if (message.type === 'system') {
                  return (
                    <div key={message._id} className="text-center text-xs text-gray-500 italic my-2">
                      {message.content}
                    </div>
                  )
                }
                const isOwn = message.sender?._id === user?.id || message.sender?.id === user?.id
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'} relative`}>
                      {!isOwn && (
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {message.sender?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                            {message.sender?.username || 'Unknown'}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-blue-500 text-white'
                            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        <p className="text-sm italic text-gray-400">
                          {message.isDeleted ? 'This message was deleted' : message.content}
                        </p>
                        
                        {/* Delete button for own messages or room creator */}
                        {canDeleteMessage(message) && (
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className={`mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {formatTime(message.createdAt || message.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Typing Indicator */}
        {typingUsernames.length > 0 && (
          <div className="flex items-center space-x-2 mt-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-gray-600 dark:text-slate-400">
              {typingUsernames.join(', ')} {typingUsernames.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleFileUpload}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Upload file"
            >
              <Paperclip className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </button>
            <button
              type="button"
              onClick={handleImageUpload}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Upload image"
            >
              <ImageIcon className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </button>
          </div>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
              title="Add emoji"
            >
              <Smile className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!messageInput.trim()}
            className={`p-3 rounded-2xl transition-all duration-200 ${
              messageInput.trim()
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatArea