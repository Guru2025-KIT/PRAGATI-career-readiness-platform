import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';

// ── Route map: patterns → routes ─────────────────────────────────────────────
const ROUTE_MAP = [
  { patterns: ['dashboard', 'home', 'go home', 'main page'],
    route: '/dashboard', label: 'Dashboard' },
  { patterns: ['aptitude', 'aptitude page', 'aptitude test', 'quiz', 'mcq', 'quant'],
    route: '/dashboard/aptitude', label: 'Aptitude' },
  { patterns: ['skill path', 'skillpath', 'skill', 'resume', 'ats'],
    route: '/dashboard/skillpath', label: 'Skill Path' },
  { patterns: ['group discussion', 'gd', 'discussion'],
    route: '/dashboard/gd', label: 'Group Discussion' },
  { patterns: ['interview', 'ai interview', 'avatar', 'mock interview', 'discussion with ai', 'ai discussion'],
    route: '/dashboard/interview-prep/avatar', label: 'AI Interviewer' },
  { patterns: ['interview prep', 'preparation', 'prep hub'],
    route: '/dashboard/interview-prep', label: 'Interview Prep' },
  { patterns: ['problems', 'coding', 'code', 'daily practice', 'practice problems'],
    route: '/dashboard/problems', label: 'Daily Practice' },
  { patterns: ['notes', 'study material', 'study notes'],
    route: '/dashboard/notes', label: 'Notes' },
  { patterns: ['companies', 'company', 'company intel'],
    route: '/dashboard/companies', label: 'Companies' },
  { patterns: ['drives', 'placement drives', 'placement', 'placements'],
    route: '/dashboard/drives', label: 'Placement Drives' },
  { patterns: ['practice', 'practice rounds', 'hr round', 'technical round'],
    route: '/dashboard/practice', label: 'Practice Rounds' },
  { patterns: ['leaderboard', 'rankings', 'rank', 'top students'],
    route: '/dashboard/leaderboard', label: 'Leaderboard' },
  { patterns: ['announcements', 'notice', 'news', 'updates'],
    route: '/dashboard/announcements', label: 'Announcements' },
  { patterns: ['discussions', 'doubt', 'doubts', 'forum', 'community'],
    route: '/dashboard/discussions', label: 'Discussions' },
];

const WAKE_PHRASES = [
  'hey pragati', 'hey pragathi', 'hi pragati',
  'pragati open', 'ok pragati', 'okay pragati', 'pragati',
];

function findRoute(transcript) {
  const t = transcript.toLowerCase().trim();
  for (const entry of ROUTE_MAP) {
    if (entry.patterns.some(p => t.includes(p))) return entry;
  }
  return null;
}

// ── Listening overlay ─────────────────────────────────────────────────────────
function ListeningOverlay({ visible, command }) {
  if (!visible) return null;
  return ReactDOM.createPortal(
    <div style={{
      position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)',
      background:'linear-gradient(135deg,#531697,#13a1a5)',
      color:'#fff', padding:'12px 22px', borderRadius:999,
      fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:13,
      zIndex:99999, boxShadow:'0 8px 32px rgba(83,22,151,0.45)',
      display:'flex', alignItems:'center', gap:10, minWidth:220,
      animation:'_pw_up 0.3s ease', pointerEvents:'none',
    }}>
      <div style={{ position:'relative', width:22, height:22, flexShrink:0 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            position:'absolute', inset:0, borderRadius:'50%',
            border:'2px solid rgba(255,255,255,0.55)',
            animation:`_pw_ripple 1.5s ease-out ${i*0.45}s infinite`,
          }} />
        ))}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🎙</div>
      </div>
      <div>
        <div style={{ fontSize:11, opacity:0.85, marginBottom:1 }}>PRAGATI is listening…</div>
        {command && <div style={{ fontSize:10, opacity:0.65 }}>Heard: "{command}"</div>}
      </div>
      <style>{`
        @keyframes _pw_ripple { 0%{transform:scale(1);opacity:0.9} 100%{transform:scale(2.5);opacity:0} }
        @keyframes _pw_up { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>
    </div>,
    document.body
  );
}

// ── One-time onboarding hint ──────────────────────────────────────────────────
function OnboardingHint() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!sessionStorage.getItem('_pw_hint')) {
      setVisible(true);
      sessionStorage.setItem('_pw_hint', '1');
      const t = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(t);
    }
  }, []);
  if (!visible) return null;
  return ReactDOM.createPortal(
    <div style={{
      position:'fixed', bottom:80, right:16,
      background:'#fff', border:'1.5px solid #e8edf5',
      borderRadius:16, padding:'14px 16px',
      zIndex:9998, boxShadow:'0 8px 32px rgba(4,44,93,0.12)',
      fontFamily:"'Nunito',sans-serif", maxWidth:270,
      animation:'_pw_up 0.4s ease',
    }}>
      <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
        <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#531697,#13a1a5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>🎙</div>
        <div>
          <div style={{ fontWeight:800, fontSize:13, color:'#0f1a2e', marginBottom:4 }}>Voice Assistant Active</div>
          <div style={{ fontSize:11.5, color:'#4a5568', lineHeight:1.5 }}>
            Say <strong>"Hey PRAGATI"</strong> + a command:<br/>
            <em>"open Aptitude"</em> · <em>"open GD"</em><br/>
            <em>"open Dashboard"</em> · <em>"open Interview"</em>
          </div>
        </div>
      </div>
      <button onClick={() => setVisible(false)}
        style={{ marginTop:8, fontSize:11, color:'#7a8ba8', background:'none', border:'none', cursor:'pointer', padding:0, display:'block' }}>
        Got it ✕
      </button>
    </div>,
    document.body
  );
}

// ── Navigation toast ──────────────────────────────────────────────────────────
function showNavToast(label) {
  const id = '_pw_toast';
  document.getElementById(id)?.remove();
  const el = document.createElement('div');
  el.id = id;
  el.textContent = `🤖 Hey PRAGATI! Opening ${label}…`;
  el.style.cssText = `
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:linear-gradient(135deg,#531697,#13a1a5);
    color:#fff;padding:11px 22px;border-radius:999px;
    font-family:'Nunito',sans-serif;font-weight:700;font-size:13px;
    z-index:99999;box-shadow:0 8px 32px rgba(83,22,151,0.4);
    pointer-events:none;white-space:nowrap;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WakeWordListener() {
  const nav             = useNavigate();
  const recRef          = useRef(null);
  const restartRef      = useRef(null);
  const activeRef       = useRef(false);
  const wakeRef         = useRef(false);
  const wakeResetRef    = useRef(null);

  const [listening,    setListening]    = useState(false);
  const [heardCommand, setHeardCommand] = useState('');

  const resetWake = useCallback(() => {
    wakeRef.current = false;
    setListening(false);
    setHeardCommand('');
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    function start() {
      if (activeRef.current) return;
      const r = new SR();
      r.continuous     = true;
      r.interimResults = true;
      r.lang           = 'en-IN';
      r.maxAlternatives = 3;
      recRef.current   = r;

      r.onstart = () => { activeRef.current = true; };

      r.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          for (let j = 0; j < e.results[i].length; j++) {
            const heard = e.results[i][j].transcript.toLowerCase().trim();

            // ── Step 1: detect wake word ────────────────────────────────
            if (!wakeRef.current) {
              if (WAKE_PHRASES.some(p => heard.includes(p))) {
                wakeRef.current = true;
                setListening(true);
                setHeardCommand('');
                clearTimeout(wakeResetRef.current);
                wakeResetRef.current = setTimeout(resetWake, 5000);
              }
              continue;
            }

            // ── Step 2: route command ────────────────────────────────────
            let cmd = heard;
            for (const p of WAKE_PHRASES) {
              const idx = cmd.indexOf(p);
              if (idx >= 0) cmd = cmd.slice(idx + p.length).trim();
            }
            setHeardCommand(cmd || heard);

            const match = findRoute(cmd) || findRoute(heard);
            if (match) {
              clearTimeout(wakeResetRef.current);
              resetWake();
              r.stop();
              showNavToast(match.label);
              setTimeout(() => nav(match.route), 650);
              return;
            }
          }
        }
      };

      r.onend  = () => { activeRef.current = false; restartRef.current = setTimeout(start, 400); };
      r.onerror = (e) => {
        activeRef.current = false;
        if (e.error !== 'not-allowed' && e.error !== 'service-not-allowed')
          restartRef.current = setTimeout(start, 2000);
      };
      try { r.start(); } catch (_) {}
    }

    start();
    return () => {
      clearTimeout(restartRef.current);
      clearTimeout(wakeResetRef.current);
      recRef.current?.stop();
      activeRef.current = false;
      wakeRef.current   = false;
    };
  }, [nav, resetWake]);

  return (
    <>
      <OnboardingHint />
      <ListeningOverlay visible={listening} command={heardCommand} />
    </>
  );
}
