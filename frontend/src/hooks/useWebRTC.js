import { useRef, useCallback, useEffect } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

/**
 * useWebRTC — v2 (Fixed)
 *
 * Fixes:
 *  1. Camera stream properly shared across all participants (mesh P2P)
 *  2. Auto-reconnect after page refresh — renegotiates with all existing peers
 *  3. onStream fires reliably once remote track arrives
 *  4. socketIdRef updated immediately on announceReady
 *  5. Tracks added before offer/answer to avoid empty streams
 */
export function useWebRTC({ emit, roomCode, userId, onStream, onStreamRemoved }) {
  const localStreamRef   = useRef(null);
  const peersRef         = useRef({});    // socketId → RTCPeerConnection
  const socketIdRef      = useRef(null);
  const onStreamRef      = useRef(onStream);
  const onStreamRemovedRef = useRef(onStreamRemoved);
  const emitRef          = useRef(emit);

  // Keep refs current without re-creating callbacks
  useEffect(() => { onStreamRef.current      = onStream; },      [onStream]);
  useEffect(() => { onStreamRemovedRef.current= onStreamRemoved;}, [onStreamRemoved]);
  useEffect(() => { emitRef.current          = emit; },          [emit]);

  // ── Get local media ───────────────────────────────────────────────────────
  const getLocalStream = useCallback(async ({ audio = true, video = true } = {}) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.warn('[WebRTC] getUserMedia failed:', err.message);
      // Try audio-only fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        return stream;
      } catch {
        return null;
      }
    }
  }, []);

  // ── Create or retrieve a peer connection ──────────────────────────────────
  const createPeer = useCallback((remoteSocketId, isInitiator) => {
    // Reuse existing connection if healthy
    const existing = peersRef.current[remoteSocketId];
    if (existing && ['connecting','connected'].includes(existing.connectionState)) {
      return existing;
    }
    // Close stale connection
    if (existing) {
      try { existing.close(); } catch {}
      delete peersRef.current[remoteSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[remoteSocketId] = pc;

    // ✅ Add all local tracks BEFORE creating offer so remote gets video+audio
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try { pc.addTrack(track, localStreamRef.current); } catch {}
      });
    }

    // ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        emitRef.current('webrtc-ice', {
          roomCode,
          toSocketId:   remoteSocketId,
          candidate,
          fromSocketId: socketIdRef.current,
        });
      }
    };

    // ✅ ontrack — fires when remote stream arrives, calls onStream
    pc.ontrack = (event) => {
      const stream = event.streams?.[0];
      if (stream) {
        onStreamRef.current?.(remoteSocketId, stream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        onStreamRemovedRef.current?.(remoteSocketId);
        try { pc.close(); } catch {}
        delete peersRef.current[remoteSocketId];
      }
      // Auto-retry on transient disconnect
      if (pc.connectionState === 'failed') {
        console.warn('[WebRTC] Connection failed to', remoteSocketId, '— will retry on next peer announce');
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce?.();
      }
    };

    return pc;
  }, [roomCode]);

  // ── Handle incoming WebRTC events ─────────────────────────────────────────
  const handleWebRTCEvent = useCallback(async (ev, data) => {
    switch (ev) {
      case 'webrtc-peer-joined': {
        // Another peer announced themselves — we are the initiator
        try {
          const pc    = createPeer(data.socketId, true);
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
          await pc.setLocalDescription(offer);
          emitRef.current('webrtc-offer', {
            roomCode,
            toSocketId:   data.socketId,
            offer:        pc.localDescription,
            fromSocketId: socketIdRef.current,
          });
        } catch (err) { console.error('[WebRTC] peer-joined offer error:', err.message); }
        break;
      }
      case 'webrtc-offer': {
        // Remote peer offered — we answer
        try {
          const pc = createPeer(data.fromSocketId, false);
          // Guard against duplicate offers
          if (pc.signalingState !== 'stable') {
            await pc.setLocalDescription({ type: 'rollback' }).catch(() => {});
          }
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          emitRef.current('webrtc-answer', {
            roomCode,
            toSocketId:   data.fromSocketId,
            answer:       pc.localDescription,
            fromSocketId: socketIdRef.current,
          });
        } catch (err) { console.error('[WebRTC] answer error:', err.message); }
        break;
      }
      case 'webrtc-answer': {
        try {
          const pc = peersRef.current[data.fromSocketId];
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        } catch (err) { console.error('[WebRTC] set-answer error:', err.message); }
        break;
      }
      case 'webrtc-ice': {
        try {
          const pc = peersRef.current[data.fromSocketId];
          if (pc && data.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
          }
        } catch {}
        break;
      }
      default: break;
    }
  }, [createPeer, roomCode]);

  // ── Announce self — triggers existing peers to initiate connections ────────
  const announceReady = useCallback((mySocketId) => {
    socketIdRef.current = mySocketId;
    emitRef.current('webrtc-ready', { roomCode, userId });
  }, [roomCode, userId]);

  // ── Toggle audio/video tracks ─────────────────────────────────────────────
  const setMuted = useCallback((muted) => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !muted; });
  }, []);

  const setCameraOff = useCallback((off) => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !off; });
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      Object.values(peersRef.current).forEach(pc => { try { pc.close(); } catch {} });
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { getLocalStream, announceReady, handleWebRTCEvent, setMuted, setCameraOff, localStreamRef };
}