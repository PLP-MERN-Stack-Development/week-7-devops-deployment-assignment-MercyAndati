import React, { useState } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { 
  MessageCircle, 
  Users, 
  Plus, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  X,
  Hash,
  Lock,
  Trash2,
  MoreVertical,
  UserPlus,
} from 'lucide-react'

const Sidebar = ({ onShowProfile, onShowCreateRoom, onClose, isMobile }) => {
  const { rooms, currentRoom, onlineUsers, joinRoom, deleteRoom, requestRoomAccess, createPrivateRoomWith,requestedRooms,setRequestedRooms ,unreadCounts} = useSocket()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('rooms')
  const [showRoomOptions, setShowRoomOptions] = useState(null)

  
  const handleLogout = () => {
    logout()
  }

  const handleRoomSelect = (room) => {
    if (room.type === 'private') {
      const isCreator = room.creator?._id === user?.id || room.creator?.id === user?.id || room.creator === user?.id
      const isMember = room.members?.some(m => m.user === user?.id || m.user?._id === user?.id || m.user?.id === user?.id)

      if (!isCreator && !isMember) {
        requestRoomAccess(room._id)
        return alert('Request sent to join this private room.')
      }
    }

    joinRoom(room._id)
    if (isMobile) onClose()
  }

  const handleDeleteRoom = (roomId, roomName) => {
    if (window.confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      deleteRoom(roomId)
      setShowRoomOptions(null)
    }
  }

  const canDeleteRoom = (room) => {
    return room.creator?._id === user?.id || room.creator?.id === user?.id || room.creator === user?.id
  }

  const isMemberOrCreator = (room) => {
    const isCreator = room.creator?._id === user?.id || room.creator?.id === user?.id || room.creator === user?.id
    const isMember = room.members?.some(m => m.user === user?.id || m.user?._id === user?.id || m.user?.id === user?.id)
    return isCreator || isMember
  }

  return (
    <div className="h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chat App</h1>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
            <span className="text-white font-medium">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white">{user?.username}</p>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-slate-400">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'rooms'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            Rooms
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            Users
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'rooms' ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Rooms</h3>
              <button
                onClick={onShowCreateRoom}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title="Create new room"
              >
                <Plus className="w-4 h-4 text-gray-600 dark:text-slate-400" />
              </button>
            </div>
            <div className="space-y-2">

              {rooms.map((room) => (
                <div
                  key={room._id}
                  className={`relative group w-full p-3 rounded-lg transition-colors ${
                    currentRoom === room._id
                      ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div 
                    className="flex items-center space-x-3 cursor-pointer"
                    onClick={() => handleRoomSelect(room)}
                  >
                    {room.type === 'private' ? (
                      <Lock className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                    ) : (
                      <Hash className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{room.name}</p>
                      {room.description && (
                        <p className="text-sm text-gray-600 dark:text-slate-400 truncate">
                          {room.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-slate-500">
                        {room.type === 'private' ? 'Private' : 'Public'} • 
                        Created by {room.creator?.username || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {!isMemberOrCreator(room) && room.type === 'private' && (
                    <div className="mt-2 text-xs italic">
                      {requestedRooms.includes(room._id) ? (
                        <span className="text-yellow-600 dark:text-yellow-400">Request pending...</span>
                      ) : (
                        <span className="text-red-500 dark:text-red-400">Access required — click to request</span>
                      )}
                    </div>
                  )}
                  {canDeleteRoom(room) && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowRoomOptions(showRoomOptions === room._id ? null : room._id)
                        }}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                      </button>
                      {showRoomOptions === room._id && (
                        <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10 min-w-32">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRoom(room._id, room.name)
                            }}
                            className="w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Room</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {rooms.length === 0 && (
                <div className="text-center py-6">
                  <MessageCircle className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-slate-400">No rooms yet</p>
                  <button
                    onClick={onShowCreateRoom}
                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Create your first room
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Online Users</h3>
            <div className="space-y-2">
              {onlineUsers.map((onlineUser) => (
                <div key={onlineUser.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {onlineUser.username?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {onlineUser.username}
                      </p>
                      <span className="text-xs text-gray-600 dark:text-slate-400">Online</span>
                    </div>
                  </div>
                  <button
                    onClick={() => createPrivateRoomWith(onlineUser.id)}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <div className="text-center py-6">
                  <Users className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-slate-400">No users online</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-slate-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-slate-400" />
              )}
            </button>
            <button
              onClick={onShowProfile}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group"
            title="Sign out"
          >
            <LogOut className="w-5 h-5 text-gray-600 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar