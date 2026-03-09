'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Participant {
  userId: string;
  username: string;
  isAdmin: boolean;
  isMuted: boolean;
}

interface ParticipantListProps {
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onKick?: (userId: string) => void;
  onMute?: (userId: string) => void;
  currentUserId: string;
}

export default function ParticipantList({
  participants,
  isOpen,
  onClose,
  isAdmin,
  onKick,
  onMute,
  currentUserId,
}: ParticipantListProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 top-0 h-full w-80 glass border-r border-primary/20 flex flex-col z-50"
        >
          <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
            <h3 className="font-bold text-lg gradient-text">
              Participants ({participants.length})
            </h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-darker flex items-center justify-center text-gray-400 hover:text-white"
            >
              ✕
            </motion.button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {participants.map((p) => (
              <motion.div
                key={p.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 rounded-xl bg-darker hover:bg-card transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {p.username}
                      {p.userId === currentUserId && (
                        <span className="text-gray-500 text-xs ml-1">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.isAdmin ? '👑 Admin' : '👤 Participant'}
                    </p>
                  </div>
                </div>

                {isAdmin && p.userId !== currentUserId && !p.isAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onMute?.(p.userId)}
                      className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center hover:bg-yellow-500/30"
                      title="Mute"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onKick?.(p.userId)}
                      className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
