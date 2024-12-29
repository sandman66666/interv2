import React, { useEffect } from 'react';

const VideoInterface: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">HitCraft Avatar Interface</h1>
          <a 
            href="/questions.html" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Questions
          </a>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Left Section - Avatar */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden video-wrapper avatar-wrapper">
              <div className="relative w-[640px] h-[640px]">
                <video 
                  id="avatar-video" 
                  className="w-full h-full object-cover bg-gray-900"
                  autoPlay 
                  playsInline
                ></video>
                <button 
                  id="start-button"
                  className="control-button absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                           px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           transition-colors flex items-center gap-2"
                >
                  Start Avatar
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - User Video & Debug */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* User Video */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden video-wrapper user-wrapper">
                <div className="relative w-[640px] h-[360px]">
                  <video 
                    id="user-video" 
                    className="w-full h-full object-cover bg-gray-900"
                    autoPlay 
                    playsInline 
                    muted
                  ></video>
                  <div 
                    id="preview-overlay"
                    className="absolute inset-0 bg-black/70 hidden items-center justify-center text-white text-lg"
                  >
                    Click Preview Recording to review your response
                  </div>
                </div>
              </div>

              {/* Debug Panel */}
              <div className="bg-white rounded-xl shadow-lg p-6" id="debug-panel">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Log</h3>
                <div 
                  id="debug-log"
                  className="h-[200px] bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-y-auto"
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div 
          id="controls"
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4"
        >
          <button
            id="record-button"
            className="control-button record-button hidden px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Record Response
          </button>
          <button
            id="preview-button"
            className="control-button preview hidden px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Preview Recording
          </button>
          <button
            id="re-record-button"
            className="control-button re-record hidden px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Re-record
          </button>
          <button
            id="confirm-button"
            className="control-button confirm hidden px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Confirm Recording
          </button>
          <button
            id="next-button"
            className="control-button hidden px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Next Question
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoInterface;