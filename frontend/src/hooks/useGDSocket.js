import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const GD_URL = (process.env.REACT_APP_API_URL || 'https://pragati-backend-ixn3.onrender.com').replace('/api', '');

const ALL_EVENTS = [
  'joined', 'participant-update', 'participant-left', 'participant-disconnected',
  'room-locked', 'room-full', 'room-locked-announce', 'wait-timer-started', 'ai-joined',
  'prep-phase', 'discussion-start', 'caption', 'ai-message', 'ai-voice',
  'chat-message', 'session-ended', 'evaluation-ready', 'partial-evaluation-ready',
  'time-warning', 'error', 'stt-result', 'forward-speech',
  'participant-media-update', 'active-speaker-update',
  'stop-ai-audio',
  // WebRTC
  'webrtc-offer', 'webrtc-answer', 'webrtc-ice', 'webrtc-peer-joined',
];

export function useGDSocket({ onEvent } = {}) {
  const socketRef  = useRef(null);
  const onEventRef = useRef(onEvent);

  // Keep callback ref fresh
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    const token  = localStorage.getItem('pragati_token');
    const socket = io(`${GD_URL}/gd`, {
      auth:                { token },
      transports:          ['websocket'],
      reconnection:        true,
      reconnectionDelay:   1000,
      reconnectionAttempts:15,
      timeout:             10000,
    });
    socketRef.current = socket;

    ALL_EVENTS.forEach(ev => socket.on(ev, data => onEventRef.current?.(ev, data)));

    socket.on('connect', () => {
      console.log('[GDSocket] connected:', socket.id);
    });
    socket.on('disconnect', (reason) => {
      console.warn('[GDSocket] disconnected:', reason);
    });
    socket.on('reconnect', (attempt) => {
      console.log('[GDSocket] reconnected after', attempt, 'attempts');
    });

    return () => { socket.disconnect(); };
  // eslint-disable-next-line
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const getSocketId = useCallback(() => socketRef.current?.id, []);

  return { emit, socket: socketRef, getSocketId };
}