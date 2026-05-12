import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const GD_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace('/api','');

export function useGDSocket({ onEvent } = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('pragati_token');
    const socket = io(`${GD_URL}/gd`, {
      auth:      { token },
      transports: ['websocket'],
      reconnection: true,
    });
    socketRef.current = socket;

    const events = ['joined','participant-update','participant-left','room-locked','room-full',
      'room-locked-announce','prep-phase','discussion-start','caption','session-ended',
      'evaluation-ready','time-warning','error'];

    events.forEach(ev => socket.on(ev, data => onEvent && onEvent(ev, data)));
    return () => { socket.disconnect(); };
  // eslint-disable-next-line
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit, socket: socketRef };
}
