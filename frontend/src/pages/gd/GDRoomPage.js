import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGDSocket } from '../../hooks/useGDSocket';

const API  = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tk   = () => ({ Authorization:`Bearer ${localStorage.getItem('pragati_token')}` });
const GRAD = 'linear-gradient(135deg,#531697,#13a1a5)';

const FILLER_WORDS = ['um','uh','like','you know','basically','actually','literally','so yeah','right','okay so'];

// Detect filler words in transcript text
function countFillers(text) {
  const lower = text.toLowerCase();
  return FILLER_WORDS.reduce((n, w) => n + (lower.split(w).length - 1), 0);
}

export default function GDRoomPage() {
  const { code }      = useParams();
  const nav           = useNavigate();
  const { user }      = useAuth();

  // State
  const [room, setRoom]             = useState(null);
  const [state, setState]           = useState('loading'); // loading|waiting|locked|prep|active|completed|error
  const [participants, setParticipants] = useState([]);
  const [captions, setCaptions]     = useState([]);
  const [topic, setTopic]           = useState('');
  const [prepTimer, setPrepTimer]   = useState(0);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [lockedMsg, setLockedMsg]   = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [myStats, setMyStats]       = useState({ speakingTime:0, wordCount:0, fillerWords:0, interruptions:0 });
  const [evalData, setEvalData]     = useState(null);
  const [systemMsg, setSystemMsg]   = useState('');

  // Refs
  const recognitionRef  = useRef(null);
  const speakStartRef   = useRef(null);
  const timerRef        = useRef(null);
  const captionsRef     = useRef(null);

  // ── Socket ────────────────────────────────────────────────────────────────
  const { emit } = useGDSocket({
    onEvent: useCallback((ev, data) => {
      switch(ev) {
        case 'joined':
          setParticipants(data.participants || []);
          setState(data.state || 'waiting');
          break;
        case 'participant-update':
          setParticipants(data.participants || []);
          if (data.state) setState(data.state);
          break;
        case 'participant-left':
          setParticipants(p => p.filter(x=>x.userId!==data.userId));
          break;
        case 'room-locked':
          setState('error'); setLockedMsg(data.message);
          break;
        case 'room-full':
          setState('error'); setLockedMsg(data.message);
          break;
        case 'room-locked-announce':
          setState('locked');
          setSystemMsg(data.message);
          setParticipants(data.participants || []);
          break;
        case 'prep-phase':
          setState('prep'); setPrepTimer(data.duration || 45);
          setSystemMsg(data.message);
          break;
        case 'discussion-start':
          setState('active'); setTopic(data.topic || '');
          setSessionTimer(data.duration || 600);
          setSystemMsg(`🎤 ${data.message}`);
          break;
        case 'caption':
          setCaptions(c => [...c.slice(-60), { ...data, ts: Date.now() }]);
          setTimeout(()=>captionsRef.current?.scrollIntoView({behavior:'smooth'}), 50);
          break;
        case 'time-warning':
          setSystemMsg(`⏰ 1 minute remaining! Start wrapping up.`);
          break;
        case 'session-ended':
          setState('completed'); setSystemMsg(data.message);
          stopRecognition();
          break;
        case 'evaluation-ready':
          setEvalData(data);
          break;
        case 'error':
          setState('error'); setLockedMsg(data);
          break;
        default: break;
      }
    }, [])
  });

  // ── Join room on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !code) return;
    // Fetch room first
    fetch(`${API}/gd/rooms/${code}`, { headers:tk() }).then(r=>r.json()).then(d => {
      if (d.room) setRoom(d.room);
    });
    emit('join-room', { roomCode:code, userId:user._id, userName:user.name });
  }, [code, user, emit]);

  // ── Countdown timers ─────────────────────────────────────────────────────
  useEffect(() => {
    if (state === 'prep' && prepTimer > 0) {
      const t = setInterval(() => setPrepTimer(n => {
        if (n <= 1) { clearInterval(t); return 0; }
        return n - 1;
      }), 1000);
      return () => clearInterval(t);
    }
  }, [state, prepTimer]);

  useEffect(() => {
    if (state === 'active' && sessionTimer > 0) {
      timerRef.current = setInterval(() => setSessionTimer(n => {
        if (n <= 1) { clearInterval(timerRef.current); return 0; }
        return n - 1;
      }), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [state, sessionTimer]);

  // ── STT ───────────────────────────────────────────────────────────────────
  function startSpeaking() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Use Chrome.'); return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = room?.language === 'Hindi' ? 'hi-IN' : 'en-IN';
    rec.continuous = true; rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[e.results.length-1][0].transcript.trim();
      if (!text) return;
      const words  = text.split(' ').length;
      const filler = countFillers(text);
      const secs   = Math.round((Date.now() - (speakStartRef.current || Date.now())) / 1000);
      setMyStats(s=>({ ...s, wordCount:s.wordCount+words, fillerWords:s.fillerWords+filler, speakingTime:s.speakingTime+secs }));
      emit('speech-update', { roomCode:code, userId:user._id, text, delta:{ wordCount:words, fillerWords:filler, speakingTime:secs } });
    };
    rec.onend = () => { if (isSpeaking) rec.start(); };
    rec.start();
    recognitionRef.current = rec;
    speakStartRef.current = Date.now();
    setIsSpeaking(true);
    emit('interrupt', { roomCode:code, userId:user._id });
  }

  function stopSpeaking() {
    recognitionRef.current?.stop();
    setIsSpeaking(false);
  }

  function stopRecognition() { recognitionRef.current?.stop(); setIsSpeaking(false); }

  function formatTime(s) {
    const m = Math.floor(s/60); const sec = s%60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (state === 'loading') return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:40,height:40,border:'3px solid #e8edf5',borderTopColor:'#531697',borderRadius:'50%',animation:'_s .7s linear infinite' }}/>
      <style>{`@keyframes _s{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color:'#b0bec9' }}>Connecting to room {code}…</div>
    </div>
  );

  // ── Locked out / Error ────────────────────────────────────────────────────
  if (state === 'error') return (
    <div style={{ maxWidth:480, margin:'80px auto', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:16 }}>🔒</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.3rem', color:'#0f1a2e', marginBottom:8 }}>Session Locked</div>
      <div style={{ color:'#7a8ba8', marginBottom:24, lineHeight:1.6 }}>{lockedMsg || 'Group Discussion has already started. Please wait for the next session.'}</div>
      <button onClick={()=>nav('/dashboard/gd')} style={{ padding:'11px 28px', borderRadius:10, border:'none', background:GRAD, color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>← Back to Lobby</button>
    </div>
  );

  // ── Completed — show result link ──────────────────────────────────────────
  if (state === 'completed' && evalData) return (
    <div style={{ maxWidth:540, margin:'60px auto', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:14 }}>🎉</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.4rem', color:'#0f1a2e', marginBottom:8 }}>Session Complete!</div>
      <div style={{ color:'#7a8ba8', marginBottom:20 }}>Your AI evaluation report is ready.</div>
      <button onClick={()=>nav(`/dashboard/gd/report/${code}/${user._id}`, { state:{ evalData, topic, myStats } })}
        style={{ padding:'12px 32px', borderRadius:12, border:'none', background:GRAD, color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'1rem' }}>
        📊 View My Report →
      </button>
      <div style={{ marginTop:12 }}>
        <button onClick={()=>nav('/dashboard/gd')} style={{ padding:'9px 20px', borderRadius:10, border:'1px solid #d0d7e8', background:'transparent', color:'#7a8ba8', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Back to Lobby</button>
      </div>
    </div>
  );

  // ── Main Room UI ──────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", maxWidth:1100, margin:'0 auto' }}>
      {/* Header bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, padding:'12px 18px', background:'#fff', borderRadius:12, border:'1px solid #e8edf5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontFamily:'monospace', fontWeight:800, fontSize:'1rem', color:'#531697', background:'rgba(83,22,151,0.08)', padding:'4px 12px', borderRadius:8 }}>{code}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:'#0f1a2e' }}>
            {state==='waiting'&&'⏳ Waiting for participants'}
            {state==='locked'&&'🔒 Room Locked'}
            {state==='prep'&&`🧠 Prepare — ${formatTime(prepTimer)}`}
            {state==='active'&&`🎤 Discussion Live`}
            {state==='completed'&&'✅ Session Ended'}
          </div>
        </div>
        {state==='active'&&(
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.2rem', color:sessionTimer<60?'#ef4444':'#531697' }}>⏰ {formatTime(sessionTimer)}</div>
          </div>
        )}
        {state==='waiting'&&(
          <div style={{ fontSize:'.8rem', color:'#7a8ba8' }}>👥 {participants.filter(p=>!p.isAI).length}/{room?.minParticipants} needed to start</div>
        )}
      </div>

      {/* System message banner */}
      {systemMsg && (
        <div style={{ padding:'10px 18px', borderRadius:10, background:'rgba(83,22,151,0.07)', border:'1.5px solid rgba(83,22,151,0.2)', marginBottom:12, fontSize:'.88rem', fontWeight:700, color:'#531697' }}>
          🤖 AI Moderator: {systemMsg}
        </div>
      )}

      {/* Topic reveal */}
      {topic && (
        <div style={{ padding:'14px 20px', borderRadius:12, background:GRAD, color:'#fff', marginBottom:14, textAlign:'center' }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, marginBottom:4, opacity:.8 }}>TODAY'S GD TOPIC</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.2rem' }}>"{topic}"</div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.8fr', gap:12 }}>
        {/* Left — Participants */}
        <div>
          <div className="card" style={{ padding:'16px 18px', marginBottom:10 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.9rem', marginBottom:10 }}>👥 Participants ({participants.length})</div>
            {participants.map((p, i) => (
              <div key={p.userId||i} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 0', borderBottom:'1px solid #f0f3fa' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:p.isAI?'rgba(19,161,165,0.15)':GRAD, display:'flex', alignItems:'center', justifyContent:'center', fontSize:p.isAI?'.8rem':'1rem', fontWeight:800, color:p.isAI?'#13a1a5':'#fff', fontFamily:"'Syne',sans-serif", flexShrink:0 }}>
                  {p.isAI ? '🤖' : (p.name?.[0] || '?').toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'.82rem', color:'#0f1a2e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}{p.userId===user?._id&&<span style={{ color:'#531697', fontSize:'.7rem' }}> (you)</span>}</div>
                  <div style={{ fontSize:'.68rem', color:'#b0bec9' }}>{p.isAI?'AI Participant':'Student'}</div>
                </div>
                {p.userId===user?._id && state==='active' && (
                  <div style={{ width:8, height:8, borderRadius:'50%', background:isSpeaking?'#ef4444':'#47d372', animation:isSpeaking?'pulse 1s infinite':undefined }} />
                )}
              </div>
            ))}
            {state==='waiting' && (
              <div style={{ marginTop:10, padding:'8px 10px', borderRadius:8, background:'rgba(83,22,151,.05)', fontSize:'.75rem', color:'#7a8ba8', textAlign:'center' }}>
                Waiting for {Math.max(0,(room?.minParticipants||3)-participants.filter(p=>!p.isAI).length)} more participant(s) to join…<br/>
                <span style={{ fontWeight:700, color:'#531697' }}>AI will fill if not enough students join</span>
              </div>
            )}
          </div>

          {/* My stats (during active) */}
          {state==='active' && (
            <div className="card" style={{ padding:'16px 18px' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.9rem', marginBottom:10 }}>📈 My Live Stats</div>
              {[['🗣️ Speaking','',`${myStats.speakingTime}s`,'#531697'],['💬 Words','',myStats.wordCount,'#13a1a5'],['⚠️ Fillers','',myStats.fillerWords,'#f59e0b']].map(([ic,l,v,c])=>(
                <div key={ic} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #f0f3fa', fontSize:'.8rem' }}>
                  <span style={{ color:'#3d4e6b' }}>{ic}</span>
                  <span style={{ fontWeight:800, color:c }}>{v}</span>
                </div>
              ))}
              {/* Speak button */}
              <button
                onMouseDown={startSpeaking} onMouseUp={stopSpeaking}
                onTouchStart={startSpeaking} onTouchEnd={stopSpeaking}
                style={{ width:'100%', marginTop:12, padding:'12px', borderRadius:10, border:'none',
                  background:isSpeaking?'#ef4444':GRAD, color:'#fff', fontWeight:800,
                  cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.9rem',
                  animation:isSpeaking?'pulse 1s ease-in-out infinite':undefined }}>
                {isSpeaking ? '🔴 Speaking… (release to stop)' : '🎙️ Hold to Speak'}
              </button>
              <div style={{ marginTop:6, fontSize:'.68rem', color:'#b0bec9', textAlign:'center' }}>Hold button while speaking. Release to stop.</div>
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}`}</style>
            </div>
          )}
        </div>

        {/* Right — Live captions */}
        <div className="card" style={{ padding:'16px 18px', display:'flex', flexDirection:'column' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.9rem', marginBottom:10 }}>📝 Live Discussion</div>
          <div style={{ flex:1, minHeight:300, maxHeight:480, overflowY:'auto', padding:'4px 0' }}>
            {captions.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#b0bec9' }}>
                {state==='waiting'&&'Discussion will appear here once started…'}
                {state==='prep'&&'Preparing… Topic will be revealed soon.'}
                {state==='active'&&'Start speaking to add to the discussion!'}
                {state==='locked'&&'Room locked. Discussion starting soon…'}
              </div>
            )}
            {captions.map((c, i) => (
              <div key={i} style={{ padding:'8px 12px', borderRadius:9, marginBottom:6,
                background: c.isAI?'rgba(19,161,165,0.07)':c.userId===user?._id?'rgba(83,22,151,0.07)':'#fafbff',
                border: c.userId===user?._id?'1px solid rgba(83,22,151,0.15)':'1px solid transparent' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <span style={{ fontWeight:800, fontSize:'.78rem', color:c.isAI?'#13a1a5':c.userId===user?._id?'#531697':'#0f1a2e' }}>
                    {c.isAI?'🤖':''}{c.userName || 'Unknown'}
                  </span>
                  <span style={{ fontSize:'.65rem', color:'#b0bec9' }}>{new Date(c.ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
                </div>
                <div style={{ fontSize:'.83rem', color:'#3d4e6b', lineHeight:1.6 }}>{c.text}</div>
              </div>
            ))}
            <div ref={captionsRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
