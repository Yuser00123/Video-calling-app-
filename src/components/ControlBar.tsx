'use client';

import { motion } from 'framer-motion';

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isChatOpen: boolean;
  isAdmin: boolean;
  participantCount: number;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
  onEndMeeting?: () => void;
  onToggleParticipants: () => void;
  isParticipantsOpen: boolean;
}

export default function ControlBar({
  isMuted,
  isVideoOff,
  isChatOpen,
  isAdmin,
  participantCount,
  onToggleMute,
  onToggleVideo,
  onToggleChat,
  onLeave,
  onEndMeeting,
  onToggleParticipants,
  isParticipantsOpen,
}: ControlBarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed bottom-0 left-0 right-0 p-4 flex justify-center z-40"
    >
      <div className="glass rounded-2xl px-6 py-4 flex items-center gap-3 md:gap-4 shadow-2xl">
        {/* Mute Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleMute}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            isMuted ? 'bg-red-500 text-white' : 'bg-gray-700/50 text-white hover:bg-gray-600/50'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </motion.button>

        {/* Video Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleVideo}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700/50 text-white hover:bg-gray-600/50'
          }`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </motion.button>

        {/* Participants Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleParticipants}
          className={`w-12 h-12 rounded-xl flex items-center justify-center relative transition-colors ${
            isParticipantsOpen ? 'gradient-bg text-white' : 'bg-gray-700/50 text-white hover:bg-gray-600/50'
          }`}
          title="Participants"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
            {participantCount}
          </span>
        </motion.button>

        {/* Chat Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleChat}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            isChatOpen ? 'gradient-bg text-white' : 'bg-gray-700/50 text-white hover:bg-gray-600/50'
          }`}
          title="Chat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </motion.button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-600/50" />

        {/* Leave Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onLeave}
          className="px-6 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden md:block">Leave</span>
        </motion.button>

        {/* End Meeting (Admin only) */}
        {isAdmin && onEndMeeting && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEndMeeting}
            className="px-6 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            <span className="hidden md:block">End All</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
