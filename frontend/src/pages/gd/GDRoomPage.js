import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGDSocket } from '../../hooks/useGDSocket';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useAIVoice } from '../../hooks/useAIVoice';
import MediaPermissionGate from './MediaPermissionGate';
import RealisticAvatar from '../../components/RealisticAvatar';
import VideoTile from './VideoTile';

const API  = process.env.REACT_APP_API_URL || 'https://pragati-backend-ixn3.onrender.com/api';
const tk   = () => ({ Authorization: `Bearer ${localStorage.getItem('pragati_token')}` });
const GRAD = 'linear-gradient(135deg,#531697,#13a1a5)';
const DARK = '#0f1a2e';

const FILLER_WORDS = ['um','uh','like','you know','basically','actually','literally','so yeah','right','okay so'];
function countFillers(text) {
  const lower = text.toLowerCase();
  return FILLER_WORDS.reduce((n, w) => n + (lower.split(w).length - 1), 0);
}
function formatTime(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// ── Session persistence helpers ───────────────────────────────────────────────
const SESSION_KEY = (code) => `gd_session_${code}`;
function saveSessionState(code, state) {
  try { sessionStorage.setItem(SESSION_KEY(code), JSON.stringify({ ...state, savedAt: Date.now() })); } catch {}
}
function loadSessionState(code) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY(code));
    if (!raw) return null;
    const s = JSON.parse(raw);
    // Only restore if saved within last 30 minutes
    if (Date.now() - s.savedAt > 30 * 60 * 1000) { sessionStorage.removeItem(SESSION_KEY(code)); return null; }
    return s;
  } catch { return null; }
}
function clearSessionState(code) {
  try { sessionStorage.removeItem(SESSION_KEY(code)); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
export default function GDRoomPage() {
  const { code }   = useParams();
  const nav        = useNavigate();
  const { user }   = useAuth();

  const [gateState, setGateState] = useState('gate');

  const [room, setRoom]                   = useState(null);
  const [sessionState, setSessionState]   = useState('loading');
  const [participants, setParticipants]   = useState([]);
  const [captions, setCaptions]           = useState([]);
  const [chatMessages, setChatMessages]   = useState([]);
  const [topic, setTopic]                 = useState('');
  const [prepTimer, setPrepTimer]         = useState(0);
  const [sessionTimer, setSessionTimer]   = useState(0);
  const [waitTimer, setWaitTimer]         = useState(null);
  const [lockedMsg, setLockedMsg]         = useState('');
  const [systemMsg, setSystemMsg]         = useState('');
  const [evalData, setEvalData]           = useState(null);
  const [isLeaving, setIsLeaving]         = useState(false);

  const [isMuted, setIsMuted]             = useState(false);
  const [isCamOff, setIsCamOff]           = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const isSpeakingRef = useRef(false); // ✅ ref keeps rec.onend closure from going stale
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [voiceEnabled, setVoiceEnabled]   = useState(true);
  const [showChat, setShowChat]           = useState(true);

  const [myStats, setMyStats] = useState({ speakingTime: 0, wordCount: 0, fillerWords: 0, interruptions: 0 });

  // Remote video streams: socketId → MediaStream
  const [remoteStreams, setRemoteStreams]   = useState({});
  // Map socketId → userId (for matching streams to participants)
  const [socketUserMap, setSocketUserMap]   = useState({});

  const localStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const speakStartRef  = useRef(null);
  const timerRef       = useRef(null);
  const captionsRef    = useRef(null);
  const chatRef        = useRef(null);
  const chatInputRef   = useRef('');
  const mySocketIdRef  = useRef(null);
  const interimBufferRef = useRef('');  // ✅ captures interim STT so releasing button still submits

  const { playAudio, playText, stopAll } = useAIVoice({ enabled: voiceEnabled });
  const playTextRef = useRef(playText);
  useEffect(() => { playTextRef.current = playText; }, [playText]);

  // ✅ Warm up speech synthesis on first user interaction so AI voice fires correctly
  useEffect(() => {
    const warmup = () => {
      try {
        if (window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance('');
          u.volume = 0;
          window.speechSynthesis.speak(u);
        }
      } catch {}
    };
    document.addEventListener('click',      warmup, { once: true });
    document.addEventListener('touchstart', warmup, { once: true });
    return () => {
      document.removeEventListener('click',      warmup);
      document.removeEventListener('touchstart', warmup);
    };
  }, []);

  const { getLocalStream, announceReady, handleWebRTCEvent, setMuted: setRTCMuted, setCameraOff: setRTCCamOff, localStreamRef: rtcLocalRef } = useWebRTC({
    emit:      (ev, data) => socketEmit(ev, data),
    roomCode:  code,
    userId:    user?._id,
    onStream:  (socketId, stream) => {
      setRemoteStreams(prev => ({ ...prev, [socketId]: stream }));
    },
    onStreamRemoved: (socketId) => {
      setRemoteStreams(prev => { const n = { ...prev }; delete n[socketId]; return n; });
    },
  });

  let socketEmit = () => {};
  const { emit, socket, getSocketId } = useGDSocket({
    onEvent: useCallback((ev, data) => {
      switch (ev) {
        // WebRTC events — handle AND update socketUserMap for webrtc-peer-joined
        case 'webrtc-peer-joined':
          handleWebRTCEvent(ev, data);
          // Track socketId → userId mapping so we can show the right video stream
          if (data.socketId && data.userId) {
            setSocketUserMap(prev => ({ ...prev, [data.socketId]: data.userId }));
          }
          break;
        case 'webrtc-offer':
        case 'webrtc-answer':
        case 'webrtc-ice':
          handleWebRTCEvent(ev, data);
          break;

        // Stop AI audio immediately when server signals human is speaking
        case 'stop-ai-audio':
          stopAll();
          break;

        case 'joined': {
          setParticipants(data.participants || []);
          setSessionState(data.state || 'waiting');
          if (data.topic)           setTopic(data.topic);
          if (data.durationSeconds) setSessionTimer(data.durationSeconds);
          // Restore timer if rejoining active session
          if (data.state === 'active' && data.startedAt && data.durationSeconds) {
            const elapsed = Math.floor((Date.now() - new Date(data.startedAt).getTime()) / 1000);
            const remaining = Math.max(data.durationSeconds - elapsed, 0);
            setSessionTimer(remaining);
          }
          // Replay recent captions on rejoin
          if (data.recentCaptions?.length > 0) {
            setCaptions(data.recentCaptions);
          }
          // Save session state for reconnection
          saveSessionState(code, { topic: data.topic, sessionState: data.state });
          // Announce WebRTC presence to existing peers
          setTimeout(() => {
            mySocketIdRef.current = getSocketId();
            announceReady(getSocketId());
          }, 500);
          break;
        }
        case 'participant-update':
          setParticipants(data.participants || []);
          if (data.state) setSessionState(data.state);
          break;
        case 'participant-left':
        case 'participant-disconnected':
          setParticipants(p => p.map(x => x.userId === data.userId ? { ...x, disconnected: true } : x));
          break;
        case 'room-locked':
          setSessionState('error'); setLockedMsg(data.message);
          break;
        case 'room-full':
          setSessionState('error'); setLockedMsg(data.message);
          break;
        case 'wait-timer-started':
          setWaitTimer(data.waitSeconds || 120);
          setSystemMsg(data.message);
          break;
        case 'ai-joined':
          setParticipants(data.participants || []);
          setSystemMsg(data.message);
          break;
        case 'room-locked-announce':
          setSessionState('locked');
          setSystemMsg(data.message);
          setParticipants(data.participants || []);
          break;
        case 'prep-phase':
          setSessionState('prep');
          setPrepTimer(data.duration || 45);
          if (data.topic) setTopic(data.topic);
          setSystemMsg(data.message);
          saveSessionState(code, { topic: data.topic, sessionState: 'prep' });
          break;
        case 'discussion-start':
          setSessionState('active');
          setTopic(data.topic || '');
          setSessionTimer(data.duration || 600);
          setSystemMsg(`🎤 ${data.message}`);
          saveSessionState(code, { topic: data.topic, sessionState: 'active', startedAt: data.startedAt, duration: data.duration });
          break;
        case 'ai-message':
          setCaptions(c => {
            const entry = { ...data, isAI: true, ts: Date.now() };
            // Deduplicate consecutive identical AI messages
            const last = c[c.length - 1];
            if (last && last.isAI && last.text === data.text && last.userId === data.userId) return c;
            return [...c.slice(-80), entry];
          });
          setTimeout(() => captionsRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          if (data.text) {
            const voiceType = data.type === 'participant' ? 'participant' : 'moderator';
            playTextRef.current?.(data.text, voiceType);
          }
          break;
        case 'ai-voice':
          // Groq TTS audio — already queued via ai-message, skip duplicate
          break;
        case 'caption':
          setCaptions(c => {
            // Deduplicate: skip if same userId+text appeared in last 3s (our optimistic update)
            const now = Date.now();
            const isDup = !data.isAI && c.slice(-5).some(
              x => x.userId === data.userId && x.text === data.text && now - x.ts < 3000
            );
            if (isDup) return c;
            return [...c.slice(-80), { ...data, ts: now }];
          });
          setTimeout(() => captionsRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          break;
        case 'chat-message':
          setChatMessages(c => [...c.slice(-100), { ...data, ts: Date.now() }]);
          setTimeout(() => chatRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          break;
        case 'time-warning':
          setSystemMsg(`⏰ ${data.secondsLeft}s remaining! Start wrapping up.`);
          break;
        case 'session-ended':
          setSessionState('completed');
          setSystemMsg(data.message);
          stopRecognition();
          stopAll();
          clearSessionState(code);
          break;
        case 'evaluation-ready':
          setEvalData(data);
          break;
        // Partial evaluation from leave-session
        case 'partial-evaluation-ready': {
          const me = data.participant;
          if (me) {
            clearSessionState(code);
            nav(`/dashboard/gd/report/${code}/${user._id}`, {
              state: {
                evalData: { participants: [me] },
                topic,
                myStats,
                isPartial: true,
              }
            });
          }
          break;
        }
        case 'participant-media-update':
          setParticipants(p => p.map(x => x.userId === data.userId ? { ...x, isMuted: data.isMuted, isCameraOff: data.isCameraOff } : x));
          break;
        case 'active-speaker-update':
          setActiveSpeaker(data.speaking ? data.userId : null);
          break;
        case 'error':
          setSessionState('error'); setLockedMsg(typeof data === 'string' ? data : data?.message || 'Unknown error');
          break;
        default: break;
      }
    }, [handleWebRTCEvent, stopAll, announceReady, code, nav, topic, myStats])
  });
  socketEmit = emit;

  // ── Wait timer countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (waitTimer === null || waitTimer <= 0) return;
    const t = setInterval(() => setWaitTimer(n => { if (n <= 1) { clearInterval(t); return 0; } return n - 1; }), 1000);
    return () => clearInterval(t);
  }, [waitTimer]);

  // ── Join room on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !code || gateState !== 'room') return;
    fetch(`${API}/gd/rooms/${code}`, { headers: tk() })
      .then(r => r.json()).then(d => { if (d.room) setRoom(d.room); });
    emit('join-room', { roomCode: code, userId: user._id, userName: user.name });
  }, [code, user, emit, gateState]);

  // ── Countdown timers ──────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionState === 'prep' && prepTimer > 0) {
      const t = setInterval(() => setPrepTimer(n => { if (n <= 1) { clearInterval(t); return 0; } return n - 1; }), 1000);
      return () => clearInterval(t);
    }
  }, [sessionState, prepTimer]);

  useEffect(() => {
    if (sessionState === 'active' && sessionTimer > 0) {
      timerRef.current = setInterval(() => setSessionTimer(n => { if (n <= 1) { clearInterval(timerRef.current); return 0; } return n - 1; }), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [sessionState, sessionTimer]);

  // ── STT — continuous speech recognition ──────────────────────────────────
  function startSpeaking() {
    if (isSpeakingRef.current) return; // already speaking
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Please use Chrome.'); return;
    }

    // Stop AI voice immediately when human starts speaking
    stopAll();
    emit('human-speaking-start', { roomCode: code });

    const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang           = room?.language === 'Hindi' ? 'hi-IN' : 'en-IN';
    rec.continuous     = true;
    rec.interimResults = true;  // ✅ true = results arrive mid-sentence, not just at end

    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          // ── Final result: emit and clear interim buffer ────────────────────
          const text = e.results[i][0].transcript.trim();
          interimBufferRef.current = ''; // clear since we got final
          if (!text) continue;

          const words  = text.split(/\s+/).filter(Boolean).length;
          const filler = countFillers(text);
          const secs   = Math.round((Date.now() - (speakStartRef.current || Date.now())) / 1000);
          speakStartRef.current = Date.now();

          setMyStats(s => ({ ...s, wordCount: s.wordCount + words, fillerWords: s.fillerWords + filler, speakingTime: s.speakingTime + secs }));
          emit('speech-update', { roomCode: code, userId: user._id, text, delta: { wordCount: words, fillerWords: filler, speakingTime: secs } });
          emit('active-speaker', { roomCode: code, userId: user._id, speaking: true });
          setTimeout(() => emit('active-speaker', { roomCode: code, userId: user._id, speaking: false }), 2500);
          // Show own transcript immediately (don't wait for server echo)
          const selfCaption = { userId: user._id, userName: user.name || 'You', text, isAI: false, ts: Date.now() };
          setCaptions(c => [...c.slice(-80), selfCaption]);
          setTimeout(() => captionsRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } else {
          // ── ✅ Interim result: save so stopSpeaking() can submit if button released early
          interimBufferRef.current = e.results[i][0].transcript;
        }
      }
    };

    rec.onerror = (e) => {
      // 'no-speech' is harmless — browser just timed out waiting, restart
      if (e.error === 'no-speech' || e.error === 'audio-capture') {
        if (isSpeakingRef.current && recognitionRef.current === rec) {
          try { rec.stop(); } catch {}
        }
      } else {
        console.warn('[STT] error:', e.error);
      }
    };

    // ✅ Fix stale closure: use isSpeakingRef.current, NOT isSpeaking state
    rec.onend = () => {
      if (recognitionRef.current === rec && isSpeakingRef.current) {
        // Auto-restart so recognition stays alive while button held
        try { rec.start(); } catch {}
      }
    };

    try {
      rec.start();
    } catch (err) {
      console.error('[STT] failed to start:', err);
      return;
    }

    recognitionRef.current = rec;
    speakStartRef.current  = Date.now();
    isSpeakingRef.current  = true;   // ✅ set ref BEFORE setIsSpeaking so onend closure sees it
    setIsSpeaking(true);
    emit('interrupt', { roomCode: code, userId: user._id });
  }

  function stopSpeaking() {
    isSpeakingRef.current = false;   // ✅ clear ref first so onend doesn't restart
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsSpeaking(false);
    emit('active-speaker', { roomCode: code, userId: user._id, speaking: false });

    // ✅ If button released before a final STT result, emit whatever interim text we have
    const interim = interimBufferRef.current.trim();
    interimBufferRef.current = '';
    if (interim) {
      const words  = interim.split(/\s+/).filter(Boolean).length;
      const filler = countFillers(interim);
      emit('speech-update', { roomCode: code, userId: user._id, text: interim, delta: { wordCount: words, fillerWords: filler, speakingTime: 1 } });
      const selfCaption = { userId: user._id, userName: user.name || 'You', text: interim, isAI: false, ts: Date.now() };
      setCaptions(c => [...c.slice(-80), selfCaption]);
      setTimeout(() => captionsRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }

  function stopRecognition() {
    isSpeakingRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsSpeaking(false);
  }

  // ── Toggle mic/camera ─────────────────────────────────────────────────────
  function toggleMic() {
    const next = !isMuted;
    setIsMuted(next); setRTCMuted(next);
    emit('media-status', { roomCode: code, userId: user._id, isMuted: next });
    if (next && isSpeakingRef.current) stopSpeaking();
  }

  function toggleCam() {
    const next = !isCamOff;
    setIsCamOff(next); setRTCCamOff(next);
    emit('media-status', { roomCode: code, userId: user._id, isCameraOff: next });
  }

  function sendChat() {
    const text = chatInputRef.current?.trim();
    if (!text) return;
    emit('chat-message', { roomCode: code, userId: user._id, userName: user.name, text });
    chatInputRef.current = '';
    const el = document.getElementById('gd-chat-input');
    if (el) el.value = '';
  }

  // ── Leave discussion — generates partial report ───────────────────────────
  function handleLeave() {
    if (isLeaving) return;
    setIsLeaving(true);
    stopAll();
    stopRecognition();
    if (sessionState === 'active') {
      // Emit leave-session → backend will evaluate and emit partial-evaluation-ready
      emit('leave-session', { roomCode: code, userId: user._id });
      setSystemMsg('Generating your report…');
      // Timeout fallback — if no response in 15s, just go to lobby
      setTimeout(() => {
        clearSessionState(code);
        nav('/dashboard/gd');
      }, 15000);
    } else {
      clearSessionState(code);
      nav('/dashboard/gd');
    }
  }

  // ── MediaPermissionGate callback ──────────────────────────────────────────
  async function handleMediaReady(stream, { isMuted: muted, isCamOff: camOff } = {}) {
    localStreamRef.current = stream;
    rtcLocalRef.current    = stream;
    setIsMuted(muted  || false);
    setIsCamOff(camOff || false);
    setGateState('room');
  }

  function handleSkipMedia() { setGateState('room'); }

  // ── MEDIA GATE ────────────────────────────────────────────────────────────
  if (gateState === 'gate') {
    return (
      <MediaPermissionGate
        roomCode={code}
        userName={user?.name || ''}
        onReady={handleMediaReady}
        onSkip={handleSkipMedia}
      />
    );
  }

  if (sessionState === 'loading') return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:40, height:40, border:'3px solid #e8edf5', borderTopColor:'#531697', borderRadius:'50%', animation:'_s .7s linear infinite' }} />
      <style>{`@keyframes _s{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color:'#b0bec9' }}>Connecting to room {code}…</div>
    </div>
  );

  if (sessionState === 'error') return (
    <div style={{ maxWidth:480, margin:'80px auto', textAlign:'center', fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ fontSize:'3rem', marginBottom:16 }}>🔒</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.3rem', color:DARK, marginBottom:8 }}>Session Locked</div>
      <div style={{ color:'#7a8ba8', marginBottom:24, lineHeight:1.6 }}>{lockedMsg || 'Group Discussion has already started.'}</div>
      <button onClick={() => nav('/dashboard/gd')} style={{ padding:'11px 28px', borderRadius:10, border:'none', background:GRAD, color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>← Back to Lobby</button>
    </div>
  );

  if (sessionState === 'completed' && evalData) return (
    <div style={{ maxWidth:540, margin:'60px auto', textAlign:'center', fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ fontSize:'3rem', marginBottom:14 }}>🎉</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.4rem', color:DARK, marginBottom:8 }}>Session Complete!</div>
      <div style={{ color:'#7a8ba8', marginBottom:20 }}>Your AI evaluation report is ready.</div>
      <button onClick={() => nav(`/dashboard/gd/report/${code}/${user._id}`, { state: { evalData, topic, myStats } })}
        style={{ padding:'12px 32px', borderRadius:12, border:'none', background:GRAD, color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'1rem' }}>
        📊 View My Report →
      </button>
      <div style={{ marginTop:12 }}>
        <button onClick={() => nav('/dashboard/gd')} style={{ padding:'9px 20px', borderRadius:10, border:'1px solid #d0d7e8', background:'transparent', color:'#7a8ba8', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Back to Lobby</button>
      </div>
    </div>
  );

  const myParticipant = participants.find(p => p.userId === user?._id) || { name: user?.name, userId: user?._id };

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", background:DARK, position:'fixed', top:0, left:0, right:0, bottom:0, display:'flex', flexDirection:'column', color:'#fff', zIndex:100 }}>

      {/* TOP BAR */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', background:'#1a2640', borderBottom:'1px solid #2a3a5a', flexShrink:0, height:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontFamily:'monospace', fontWeight:800, fontSize:'.82rem', color:'#13a1a5', background:'rgba(19,161,165,0.12)', padding:'2px 9px', borderRadius:6 }}>{code}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'.8rem', color:'#9ab0c8' }}>
            {sessionState==='waiting'   && '⏳ Waiting'}
            {sessionState==='locked'    && '🔒 Starting soon'}
            {sessionState==='prep'      && `🧠 Prep — ${formatTime(prepTimer)}`}
            {sessionState==='active'    && '🔴 LIVE'}
            {sessionState==='completed' && '✅ Ended'}
          </div>
          {waitTimer > 0 && sessionState==='waiting' && (
            <div style={{ fontSize:'.7rem', color:'#f59e0b', fontWeight:700, background:'rgba(245,158,11,0.1)', padding:'2px 8px', borderRadius:6 }}>
              AI joins in {formatTime(waitTimer)}
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {sessionState==='active' && (
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.05rem', color:sessionTimer<60?'#ef4444':'#47d372' }}>
              ⏰ {formatTime(sessionTimer)}
            </div>
          )}
          <button onClick={() => { setVoiceEnabled(v => !v); stopAll(); }}
            style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #2a3a5a', background:voiceEnabled?'rgba(19,161,165,0.15)':'rgba(255,255,255,0.05)', color:voiceEnabled?'#13a1a5':'#4a5a7a', fontWeight:700, cursor:'pointer', fontSize:'.7rem' }}>
            {voiceEnabled ? '🔊 Voice ON' : '🔇 Voice OFF'}
          </button>
        </div>
      </div>

      {/* TOPIC BANNER */}
      {topic && (
        <div style={{ background:'linear-gradient(90deg,#531697,#13a1a5)', padding:'6px 14px', textAlign:'center', flexShrink:0 }}>
          <span style={{ fontSize:'.65rem', fontWeight:700, opacity:.8, marginRight:6 }}>TOPIC</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.84rem' }}>"{topic}"</span>
        </div>
      )}

      {/* SYSTEM MESSAGE BANNER */}
      {systemMsg && (
        <div style={{ padding:'5px 14px', background:'rgba(83,22,151,0.15)', borderBottom:'1px solid rgba(83,22,151,0.3)', fontSize:'.74rem', fontWeight:700, color:'#c4a0f5', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          🤖 <span style={{ color:'#9ab0c8', fontWeight:400 }}>{systemMsg}</span>
        </div>
      )}

      {/* BODY */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

          {/* Video grid */}
          <div style={{ flex:1, overflow:'hidden', minHeight:0, padding:'8px 8px 0' }}>
            <div style={{
              display:'grid', gap:6, width:'100%', height:'100%',
              gridTemplateColumns: participants.length<=2?'1fr 1fr':participants.length<=4?'1fr 1fr':'repeat(3,1fr)',
              gridTemplateRows:    participants.length<=2?'1fr':'1fr 1fr',
            }}>
              <VideoTile
                stream={localStreamRef.current}
                participant={{ ...myParticipant, isMuted, isCameraOff: isCamOff }}
                isActiveSpeaker={activeSpeaker===user?._id}
                isLocal size={participants.length<=2?'large':'small'}
              />
              {participants.filter(p => p.userId !== user?._id).map((p, i) => {
                // ✅ Fix: look up socketId from socketUserMap to find this participant's stream
                const sid = Object.entries(socketUserMap).find(([, uid]) => uid === p.userId)?.[0];
                return (
                  <VideoTile key={p.userId||i}
                    stream={p.isAI ? null : (sid ? remoteStreams[sid] : null)}
                    participant={p}
                    isActiveSpeaker={activeSpeaker===p.userId}
                    size={participants.length<=2?'large':'small'}
                  />
                );
              })}
            </div>
          </div>

          {/* Controls bar */}
          <div style={{ flexShrink:0, height:68, display:'flex', justifyContent:'center', alignItems:'center', gap:8, background:'#131f35', borderTop:'1px solid #2a3a5a', padding:'0 10px' }}>
            <ControlButton icon={isMuted  ?'🔇':'🎙️'} label={isMuted  ?'Unmute':'Mute'}            active={isMuted}  color="#ef4444" onClick={toggleMic} />
            <ControlButton icon={isCamOff ?'📷':'📹'} label={isCamOff ?'Start Video':'Stop Video'} active={isCamOff} color="#ef4444" onClick={toggleCam} />

            {sessionState==='active' && (
              <button
                onMouseDown={startSpeaking} onMouseUp={stopSpeaking}
                onTouchStart={startSpeaking} onTouchEnd={stopSpeaking}
                style={{
                  padding:'8px 18px', borderRadius:22, border:'none',
                  background:isSpeaking?'#ef4444':'rgba(83,22,151,0.75)',
                  color:'#fff', fontWeight:800, cursor:'pointer',
                  fontFamily:"'Nunito',sans-serif", fontSize:'.8rem',
                  animation:isSpeaking?'gdpulse 1s ease-in-out infinite':'none',
                  userSelect:'none', WebkitUserSelect:'none',
                  display:'flex', alignItems:'center', gap:6,
                }}>
                {isSpeaking ? '🔴 Speaking…' : '🎤 Hold to Speak'}
              </button>
            )}

            <ControlButton icon="💬" label={showChat?'Hide Chat':'Chat'} active={showChat} color="#13a1a5" onClick={() => setShowChat(s => !s)} />
            <ControlButton
              icon={isLeaving?'⏳':'📴'}
              label={isLeaving?'Leaving…':'Leave'}
              active danger color="#ef4444"
              onClick={handleLeave}
            />
          </div>
          <style>{`@keyframes gdpulse{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
        </div>

        {/* Side panel */}
        {showChat && (
          <div style={{ width:290, flexShrink:0, display:'flex', flexDirection:'column', background:'#13203a', borderLeft:'1px solid #2a3a5a', overflow:'hidden' }}>
            <SidePanel
              captions={captions}
              chatMessages={chatMessages}
              myUserId={user?._id}
              sessionState={sessionState}
              myStats={myStats}
              captionsEndRef={captionsRef}
              chatEndRef={chatRef}
              onSendChat={sendChat}
              chatInputRef={chatInputRef}
              participants={participants}
              topic={topic}
              activeSpeaker={activeSpeaker}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ControlButton({ icon, label, active, color='#ef4444', onClick, danger }) {
  return (
    <button onClick={onClick} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'6px 12px', borderRadius:10, border:'none', background:(active||danger)?`${color}22`:'rgba(255,255,255,0.07)', cursor:'pointer', minWidth:52 }}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <span style={{ fontSize:'.6rem', color:(active||danger)?color:'#9ab0c8', fontWeight:700, fontFamily:"'Nunito',sans-serif" }}>{label}</span>
    </button>
  );
}

function SidePanel({
  captions,
  chatMessages,
  myUserId,
  sessionState,
  myStats,
  captionsEndRef,
  chatEndRef,
  onSendChat,
  chatInputRef,
  participants,
  topic,
  activeSpeaker
}) {
  const [tab, setTab] = React.useState('captions');
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <div style={{ display:'flex', borderBottom:'1px solid #2a3a5a', flexShrink:0 }}>
        {[['captions','📝 Live'],['chat','💬 Chat'],['people','👥 People'],['stats','📈 Stats']].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:'9px 2px', border:'none', background:'transparent', color:tab===id?'#13a1a5':'#4a5a7a', fontWeight:700, cursor:'pointer', fontSize:'.65rem', borderBottom:tab===id?'2px solid #13a1a5':'2px solid transparent', fontFamily:"'Nunito',sans-serif", transition:'color .15s' }}>{lbl}</button>
        ))}
      </div>
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
        {tab==='captions' && (
          <div style={{ flex:1, overflowY:'auto', padding:'10px 10px 0', minHeight:0 }}>
            {captions.length===0 && <div style={{ textAlign:'center', padding:'30px 0', color:'#4a5a7a', fontSize:'.75rem' }}>{sessionState==='active'?'Hold to speak — transcripts appear here':'Transcripts will appear during discussion'}</div>}
            {captions.map((c,i) => (
              <div key={i} style={{ marginBottom:8, padding:'7px 9px', borderRadius:8, background:c.isAI?'rgba(19,161,165,0.1)':c.userId===myUserId?'rgba(83,22,151,0.12)':'rgba(255,255,255,0.04)', border:c.isAI?'1px solid rgba(19,161,165,0.2)':'1px solid transparent' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                  <span style={{ fontWeight:800, fontSize:'.7rem', color:c.isAI?'#13a1a5':c.userId===myUserId?'#c4a0f5':'#9ab0c8' }}>
                    {c.isAI?'🤖 ':''}{c.userName}
                    {c.type==='participant'&&c.isAI&&<span style={{ fontSize:'.58rem', marginLeft:4, opacity:.7 }}>(AI participant)</span>}
                  </span>
                  <span style={{ fontSize:'.6rem', color:'#3a4a6a' }}>{new Date(c.ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                <div style={{ fontSize:'.76rem', color:'#c8d8ea', lineHeight:1.5 }}>{c.text}</div>
              </div>
            ))}
            <div ref={captionsEndRef} style={{ height:4 }} />
          </div>
        )}
        {tab==='chat' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
            <div style={{ flex:1, overflowY:'auto', padding:'10px 10px 0', minHeight:0 }}>
              {chatMessages.length===0&&<div style={{ textAlign:'center', padding:'30px 0', color:'#4a5a7a', fontSize:'.75rem' }}>No messages yet</div>}
              {chatMessages.map((m,i) => (
                <div key={i} style={{ marginBottom:7, padding:'6px 9px', borderRadius:8, background:m.userId===myUserId?'rgba(83,22,151,0.15)':'rgba(255,255,255,0.04)' }}>
                  <span style={{ fontWeight:800, fontSize:'.68rem', color:m.userId===myUserId?'#c4a0f5':'#9ab0c8' }}>{m.userName}: </span>
                  <span style={{ fontSize:'.76rem', color:'#c8d8ea' }}>{m.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} style={{ height:4 }} />
            </div>
            <div style={{ flexShrink:0, padding:'8px 10px', borderTop:'1px solid #1e2e4a', display:'flex', gap:6 }}>
              <input id="gd-chat-input" placeholder="Type a message…" onChange={e => { chatInputRef.current=e.target.value; }} onKeyDown={e => { if(e.key==='Enter')onSendChat(); }} style={{ flex:1, padding:'7px 10px', borderRadius:7, border:'1px solid #2a3a5a', background:'#0f1a2e', color:'#fff', fontFamily:"'Nunito',sans-serif", fontSize:'.78rem', outline:'none' }} />
              <button onClick={onSendChat} style={{ padding:'7px 12px', borderRadius:7, border:'none', background:GRAD, color:'#fff', fontWeight:800, cursor:'pointer', fontSize:'.82rem' }}>→</button>
            </div>
          </div>
        )}
        {tab==='people' && (
          <div style={{ flex:1, overflowY:'auto', padding:'8px 10px', minHeight:0 }}>
            {participants.map((p,i) => (
              <div key={p.userId||i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 4px', borderBottom:'1px solid #1e2e4a' }}>
                {p.isAI ? (
                  <RealisticAvatar size={32} isTalking={activeSpeaker===p.userId}
                    skinTone="indian" shirtColor={p.role==='moderator'?'#531697':'#0F766E'}
                    avatarName="" showNameBadge={false} emotion="neutral"
                    glowColor={p.role==='moderator'?'#531697':'#13a1a5'} />
                ) : (
                  <div style={{ width:32, height:32, borderRadius:'50%', background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.82rem', fontWeight:800, color:'#fff', flexShrink:0 }}>
                    {(p.name?.[0]||'?').toUpperCase()}
                  </div>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'.78rem', color:'#e0eaf8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {p.name}{p.userId===myUserId&&<span style={{ color:'#13a1a5', fontSize:'.65rem' }}> (you)</span>}
                  </div>
                  <div style={{ fontSize:'.63rem', color:'#4a5a7a' }}>
                    {p.isAI?'🤖 AI Participant':p.disconnected?'⚠️ Reconnecting':'🎓 Student'}
                  </div>
                </div>
                <div style={{ fontSize:'.65rem', display:'flex', gap:3 }}>{p.isMuted&&'🔇'}{p.isCameraOff&&'📷'}</div>
              </div>
            ))}
          </div>
        )}
        {tab==='stats' && (
          <div style={{ flex:1, overflowY:'auto', padding:'10px 12px', minHeight:0 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.8rem', color:'#9ab0c8', marginBottom:10 }}>My Live Metrics</div>
            {[['🗣️','Speaking Time',`${myStats.speakingTime}s`,'#531697'],['💬','Words Spoken',myStats.wordCount,'#13a1a5'],['⚠️','Filler Words',myStats.fillerWords,'#f59e0b'],['🔔','Interruptions',myStats.interruptions,'#ef4444']].map(([ic,label,value,color]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #1e2e4a' }}>
                <span style={{ fontSize:'.75rem', color:'#7a8ba8' }}>{ic} {label}</span>
                <span style={{ fontWeight:800, color, fontSize:'.9rem' }}>{value}</span>
              </div>
            ))}
            {topic && (
              <div style={{ marginTop:14, padding:'9px 10px', borderRadius:8, background:'rgba(83,22,151,0.1)', fontSize:'.72rem', color:'#9ab0c8', lineHeight:1.5 }}>
                <div style={{ fontWeight:700, marginBottom:3, color:'#c4a0f5' }}>📌 Topic</div>
                {topic}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}