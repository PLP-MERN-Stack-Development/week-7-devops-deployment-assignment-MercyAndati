import React from 'react'
import { Loader } from 'lucide-react'

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 mb-4 shadow-lg">
          <Loader className="w-8 h-8 text-white animate-spin" />
        </div>
        <p className="text-gray-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
