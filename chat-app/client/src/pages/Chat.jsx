import React, { useState, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'
import UserProfile from '../components/UserProfile'
import CreateRoomModal from '../components/CreateRoomModal'

const Chat = () => {
  const { rooms, currentRoom } = useSocket()
  const [showProfile, setShowProfile] = useState(false)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="h-screen flex bg-white dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className={`${
        isMobile 
          ? sidebarOpen 
            ? 'fixed inset-0 z-50' 
            : 'hidden'
          : 'flex'
      } ${isMobile ? 'w-full' : 'w-80'} flex-shrink-0 transition-all duration-300 ease-in-out`}>
        <Sidebar 
          onShowProfile={() => setShowProfile(true)}
          onShowCreateRoom={() => setShowCreateRoom(true)}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentRoom ? (
          <ChatArea 
            onToggleSidebar={toggleSidebar}
            isMobile={isMobile}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-800">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Chat
              </h2>
              <p className="text-gray-600 dark:text-slate-400 mb-6">
                Select a room from the sidebar to start chatting, or create a new room to begin a conversation.
              </p>
              <button
                onClick={() => {
                  setShowCreateRoom(true)
                  if (isMobile) setSidebarOpen(false)
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create New Room
              </button>
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="mt-4 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-200"
                >
                  Show Sidebar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}

      {showCreateRoom && (
        <CreateRoomModal onClose={() => setShowCreateRoom(false)} />
      )}
    </div>
  )
}

export default Chat