'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ICE_SERVERS } from '@/lib/webrtc';
import VideoTile from '@/components/VideoTile';
import ChatPanel from '@/components/ChatPanel';
import ControlBar from '@/components/ControlBar';
import ParticipantList from '@/components/ParticipantList';

interface PeerConnection {
  userId: string;
  username: string;
  isAdmin: boolean;
  pc: RTCPeerConnection;
  stream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user, loading: authLoading } = useAuth();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true); // Default camera off
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [participantsList, setParticipantsList] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState('');

  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const signalChannelRef = useRef<any>(null);
  const processedSignals = useRef<Set<string>>(new Set());

  // Initialize media and join room
  useEffect(() => {
    if (authLoading || !user) return;

    let mounted = true;

    const init = async () => {
      try {
        // Get local media - audio only by default (camera off)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        // Disable video tracks by default
        stream.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setLocalStream(stream);
        localStreamRef.current = stream;

        // Get room info
        const { data: room } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .eq('is_active', true)
          .single();

        if (!room) {
          setError('Room not found or has ended');
          setIsConnecting(false);
          return;
        }

        setRoomInfo(room);

        // Get current participants
        const { data: participants } = await supabase
          .from('room_participants')
          .select('*, users:user_id(id, username, is_admin)')
          .eq('room_id', roomId);

        if (participants) {
          setParticipantsList(participants);

          // Create peer connections for existing participants
          for (const p of participants) {
            if (p.user_id !== user.id && p.users) {
              await createPeerConnection(
                p.user_id,
                p.users.username,
                p.users.is_admin,
                true, // We are the initiator since we're new
                stream
              );
            }
          }
        }

        // Subscribe to participant changes
        channelRef.current = supabase
          .channel(`room-${roomId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'room_participants',
              filter: `room_id=eq.${roomId}`,
            },
            async (payload) => {
              const newP = payload.new as any;
              if (newP.user_id === user.id) return;

              // Get user details
              const { data: userData } = await supabase
                .from('users')
                .select('id, username, is_admin')
                .eq('id', newP.user_id)
                .single();

              if (userData) {
                setParticipantsList((prev) => [
                  ...prev.filter((p) => p.user_id !== newP.user_id),
                  { ...newP, users: userData },
                ]);

                // Don't create connection here - let the new user initiate
                // The new user will send an offer through signals
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'room_participants',
              filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
              const oldP = payload.old as any;
              if (oldP.user_id === user.id) {
                // We were kicked
                handleLeave();
                return;
              }
              removePeer(oldP.user_id);
              setParticipantsList((prev) =>
                prev.filter((p) => p.user_id !== oldP.user_id)
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'room_participants',
              filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
              const updated = payload.new as any;
              if (updated.user_id === user.id && updated.is_muted_by_admin) {
                // Admin muted us
                setIsMuted(true);
                if (localStreamRef.current) {
                  localStreamRef.current.getAudioTracks().forEach((t) => {
                    t.enabled = false;
                  });
                }
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'rooms',
              filter: `id=eq.${roomId}`,
            },
            (payload) => {
              const updated = payload.new as any;
              if (!updated.is_active) {
                handleLeave();
              }
            }
          )
          .subscribe();

        // Subscribe to signals
        signalChannelRef.current = supabase
          .channel(`signals-${roomId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'signals',
              filter: `room_id=eq.${roomId}`,
            },
            async (payload) => {
              const signal = payload.new as any;
              if (signal.to_user !== user.id) return;
              if (processedSignals.current.has(signal.id)) return;
              processedSignals.current.add(signal.id);

              await handleSignal(signal, stream);
            }
          )
          .subscribe();

        setIsConnecting(false);
      } catch (err: any) {
        console.error('Init error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
          setError('Please allow camera and microphone access');
        } else {
          setError('Failed to initialize. Please try again.');
        }
        setIsConnecting(false);
      }
    };

    init();

    return () => {
      mounted = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, roomId]);

  const createPeerConnection = async (
    targetUserId: string,
    targetUsername: string,
    targetIsAdmin: boolean,
    initiator: boolean,
    stream: MediaStream
  ): Promise<RTCPeerConnection> => {
    // Close existing connection if any
    const existing = peersRef.current.get(targetUserId);
    if (existing) {
      existing.pc.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    const remoteStream = new MediaStream();

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });

      const peerData: PeerConnection = {
        userId: targetUserId,
        username: targetUsername,
        isAdmin: targetIsAdmin,
        pc,
        stream: remoteStream,
        isMuted: false,
        isVideoOff: false,
      };

      peersRef.current.set(targetUserId, peerData);
      setPeers(new Map(peersRef.current));
    };

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            fromUser: user!.id,
            toUser: targetUserId,
            signalType: 'ice-candidate',
            signalData: { candidate: event.candidate },
          }),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log(`Connection ${pc.connectionState} with ${targetUsername}`);
      }
    };

    // Store the peer
    const peerData: PeerConnection = {
      userId: targetUserId,
      username: targetUsername,
      isAdmin: targetIsAdmin,
      pc,
      stream: remoteStream,
      isMuted: false,
      isVideoOff: false,
    };

    peersRef.current.set(targetUserId, peerData);
    setPeers(new Map(peersRef.current));

    // If initiator, create and send offer
    if (initiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            fromUser: user!.id,
            toUser: targetUserId,
            signalType: 'offer',
            signalData: {
              sdp: pc.localDescription,
              username: user!.username,
              isAdmin: user!.is_admin,
            },
          }),
        });
      } catch (err) {
        console.error('Create offer error:', err);
      }
    }

    return pc;
  };

  const handleSignal = async (signal: any, stream: MediaStream) => {
    const { from_user, signal_type, signal_data } = signal;

    if (signal_type === 'offer') {
      // Someone sent us an offer
      const pc = await createPeerConnection(
        from_user,
        signal_data.username || 'Unknown',
        signal_data.isAdmin || false,
        false,
        stream
      );

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal_data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            fromUser: user!.id,
            toUser: from_user,
            signalType: 'answer',
            signalData: {
              sdp: pc.localDescription,
              username: user!.username,
              isAdmin: user!.is_admin,
            },
          }),
        });
      } catch (err) {
        console.error('Handle offer error:', err);
      }
    } else if (signal_type === 'answer') {
      const peer = peersRef.current.get(from_user);
      if (peer && peer.pc.signalingState === 'have-local-offer') {
        try {
          await peer.pc.setRemoteDescription(
            new RTCSessionDescription(signal_data.sdp)
          );
          // Update username if available
          if (signal_data.username) {
            peer.username = signal_data.username;
            peer.isAdmin = signal_data.isAdmin || false;
            peersRef.current.set(from_user, peer);
            setPeers(new Map(peersRef.current));
          }
        } catch (err) {
          console.error('Handle answer error:', err);
        }
      }
    } else if (signal_type === 'ice-candidate') {
      const peer = peersRef.current.get(from_user);
      if (peer) {
        try {
          await peer.pc.addIceCandidate(
            new RTCIceCandidate(signal_data.candidate)
          );
        } catch (err) {
          console.error('Add ICE candidate error:', err);
        }
      }
    }
  };

  const removePeer = (userId: string) => {
    const peer = peersRef.current.get(userId);
    if (peer) {
      peer.pc.close();
      peersRef.current.delete(userId);
      setPeers(new Map(peersRef.current));
    }
  };

  const cleanup = () => {
    // Close all peer connections
    peersRef.current.forEach((peer) => {
      peer.pc.close();
    });
    peersRef.current.clear();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    // Unsubscribe from channels
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    if (signalChannelRef.current) {
      supabase.removeChannel(signalChannelRef.current);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted; // Toggle: if muted, enable; if unmuted, disable
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = isVideoOff; // Toggle
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleLeave = useCallback(async () => {
    // Remove self from participants
    if (user) {
      await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);
    }

    cleanup();

    if (user?.is_admin) {
      router.push('/admin/dashboard');
    } else {
      router.push('/user/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomId, router]);

  const handleEndMeeting = async () => {
    if (!user?.is_admin) return;

    try {
      await fetch('/api/room/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, roomId }),
      });
    } catch (e) {
      console.error('End meeting error:', e);
    }

    cleanup();
    router.push('/admin/dashboard');
  };

  const handleKick = async (targetUserId: string) => {
    if (!user?.is_admin) return;

    try {
      await fetch('/api/room/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          targetUserId,
          roomId,
        }),
      });
    } catch (e) {
      console.error('Kick error:', e);
    }
  };

  const handleMuteUser = async (targetUserId: string) => {
    if (!user?.is_admin) return;

    try {
      await fetch('/api/room/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          targetUserId,
          roomId,
        }),
      });
    } catch (e) {
      console.error('Mute error:', e);
    }
  };

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-red-400">{error}</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(user.is_admin ? '/admin/dashboard' : '/user/dashboard')}
            className="mt-4 gradient-bg px-6 py-3 rounded-xl text-white font-semibold"
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Connecting to meeting...</p>
        </motion.div>
      </div>
    );
  }

  // Build participants for the list component
  const allParticipants = [
    {
      userId: user.id,
      username: user.username,
      isAdmin: user.is_admin,
      isMuted: isMuted,
    },
    ...Array.from(peers.values()).map((p) => ({
      userId: p.userId,
      username: p.username,
      isAdmin: p.isAdmin,
      isMuted: p.isMuted,
    })),
  ];

  // Separate admin and regular peers
  const adminPeer = Array.from(peers.values()).find((p) => p.isAdmin);
  const regularPeers = Array.from(peers.values()).filter((p) => !p.isAdmin);

  return (
    <div className="min-h-screen bg-darker p-4 pb-24">
      {/* Room header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-400">
            Room: <span className="text-white font-mono">{roomInfo?.room_code}</span>
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {allParticipants.length} participant{allParticipants.length !== 1 ? 's' : ''}
        </div>
      </motion.div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
        {/* Admin tile (large) - Show first */}
        {user.is_admin ? (
          <VideoTile
            stream={localStream}
            username={user.username}
            isAdmin={true}
            isSelf={true}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isLarge={true}
          />
        ) : adminPeer ? (
          <VideoTile
            stream={adminPeer.stream}
            username={adminPeer.username}
            isAdmin={true}
            isSelf={false}
            isMuted={adminPeer.isMuted}
            isVideoOff={adminPeer.isVideoOff}
            isLarge={true}
            showAdminControls={false}
          />
        ) : null}

        {/* Self tile (if not admin) */}
        {!user.is_admin && (
          <VideoTile
            stream={localStream}
            username={user.username}
            isAdmin={false}
            isSelf={true}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
          />
        )}

        {/* Other peers */}
        {(user.is_admin ? Array.from(peers.values()) : regularPeers).map((peer) => (
          <VideoTile
            key={peer.userId}
            stream={peer.stream}
            username={peer.username}
            isAdmin={peer.isAdmin}
            isSelf={false}
            isMuted={peer.isMuted}
            isVideoOff={peer.isVideoOff}
            isLarge={peer.isAdmin}
            showAdminControls={user.is_admin && !peer.isAdmin}
            onKick={() => handleKick(peer.userId)}
            onMute={() => handleMuteUser(peer.userId)}
          />
        ))}
      </div>

      {/* Control Bar */}
      <ControlBar
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isChatOpen={isChatOpen}
        isAdmin={user.is_admin}
        participantCount={allParticipants.length}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onLeave={handleLeave}
        onEndMeeting={user.is_admin ? handleEndMeeting : undefined}
        onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
        isParticipantsOpen={isParticipantsOpen}
      />

      {/* Chat Panel */}
      <ChatPanel
        roomId={roomId}
        userId={user.id}
        username={user.username}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Participant List */}
      <ParticipantList
        participants={allParticipants}
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        isAdmin={user.is_admin}
        onKick={handleKick}
        onMute={handleMuteUser}
        currentUserId={user.id}
      />
    </div>
  );
}