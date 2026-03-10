'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  const createMeeting = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });

      const data = await res.json();

      if (res.ok) {
        setActiveRoom(data.room);
      }
    } catch (e) {
      console.error('Create meeting error:', e);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    if (activeRoom) {
      router.push(`/room/${activeRoom.id}`);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #6C5CE7, transparent)' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold"
            >
              Admin <span className="gradient-text">Dashboard</span>
            </motion.h1>
            <p className="text-gray-400 text-sm mt-1">Welcome, {user.username}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { logout(); router.push('/'); }}
            className="glass px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white glass-hover"
          >
            Logout
          </motion.button>
        </div>

        {/* Create Meeting Card */}
        {!activeRoom ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl gradient-bg-animated flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold mb-2">Create a Meeting</h2>
            <p className="text-gray-400 mb-8">Start a new meeting room and share the code with participants</p>

            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(108, 92, 231, 0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={createMeeting}
              disabled={loading}
              className="gradient-bg px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg shadow-primary/30 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Create Meeting
                </div>
              )}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-8"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-1">Meeting Created!</h2>
              <p className="text-gray-400 text-sm">Share this code with participants</p>
            </div>

            <div className="bg-darker rounded-xl p-6 mb-6 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Room Code</p>
              <p className="text-4xl font-mono font-bold tracking-[0.4em] gradient-text">
                {activeRoom.room_code}
              </p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  navigator.clipboard.writeText(activeRoom.room_code);
                }}
                className="flex-1 glass py-3 rounded-xl text-white font-semibold glass-hover"
              >
                Copy Code
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={joinRoom}
                className="flex-1 gradient-bg py-3 rounded-xl text-white font-semibold shadow-lg shadow-primary/30"
              >
                Join Meeting
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
