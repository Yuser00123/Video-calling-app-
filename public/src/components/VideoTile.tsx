'use client';

import { useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';

interface VideoTileProps {
  stream: MediaStream | null;
  username: string;
  isAdmin: boolean;
  isSelf: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isLarge?: boolean;
  onKick?: () => void;
  onMute?: () => void;
  showAdminControls?: boolean;
}

const VideoTile = memo(function VideoTile({
  stream,
  username,
  isAdmin,
  isSelf,
  isMuted,
  isVideoOff,
  isLarge,
  onKick,
  onMute,
  showAdminControls,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      layout
      className={`video-tile relative group ${isLarge ? 'admin-tile' : ''} ${
        isLarge ? 'col-span-2 row-span-2' : ''
      }`}
      style={{ aspectRatio: isLarge ? '16/10' : '16/9' }}
    >
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className="w-full h-full object-cover rounded-2xl"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-darker rounded-2xl">
          <div className={`${isLarge ? 'w-24 h-24 text-4xl' : 'w-16 h-16 text-2xl'} rounded-full gradient-bg flex items-center justify-center font-bold text-white`}>
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Username label */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium truncate">
              {username} {isSelf && '(You)'} {isAdmin && '👑'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isMuted && (
              <div className="w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </div>
            )}
            {isVideoOff && (
              <div className="w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin controls hover overlay */}
      {showAdminControls && !isSelf && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onMute}
            className="px-4 py-2 bg-yellow-500 rounded-lg text-black font-semibold text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
            Mute
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onKick}
            className="px-4 py-2 bg-red-500 rounded-lg text-white font-semibold text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Remove
          </motion.button>
        </div>
      )}
    </motion.div>
  );
});

export default VideoTile;
