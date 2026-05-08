import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tk = () => ({ Authorization: `Bearer ${localStorage.getItem('pragati_token')}` });

const MODES = [
  { id: 'prep', icon: '🎯', label: 'Full Interview Prep', desc: 'Complete guide: technical questions, behavioural questions, gap coaching and quick wins' },
  { id: 'mock', icon: '🎤', label: 'Mock Interview Chat', desc: 'Live mock interview — answer with your voice or type, get instant AI feedback' },
  { id: 'tips', icon: '💡', label: 'Topic Deep Dive', desc: 'Pick any skill gap and get a focused explanation, resources, and practice questions' },
];

// ── Voice Button ─────────────────────────────────────────────────────────────
function VoiceButton({ onTranscript, onStop, disabled }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setSupported(true);
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognitionRef.current = recognition;
    let final = '';
    recognition.onstart  = () => setListening(true);
    recognition.onend    = () => { setListening(false); onStop && onStop(final); };
    recognition.onerror  = () => setListening(false);
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + ' ';
        else interim = t;
      }
      onTranscript(final + interim);
    };
    recognition.start();
  }, [onTranscript, onStop]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  if (!supported) return (
    <div title="Voice not supported in this browser" style={{ width: 44, height: 44, borderRadius: '50%', background: '#e8edf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', color: '#b0bec9', flexShrink: 0 }}>🚫</div>
  );

  return (
    <button onClick={listening ? stopListening : startListening} disabled={disabled}
      title={listening ? 'Stop recording' : 'Speak your answer'}
      style={{
        width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: listening ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'linear-gradient(135deg,#531697,#13a1a5)',
        color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: listening ? '0 0 0 4px rgba(239,68,68,0.3)' : '0 3px 10px rgba(83,22,151,0.3)',
        animation: listening ? 'voicepulse 1.2s ease-in-out infinite' : 'none',
        transition: 'background .2s, box-shadow .2s',
      }}>
      {listening ? '⏹' : '🎙️'}
    </button>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
      {!isUser && <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#531697,#13a1a5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, marginRight: 10, alignSelf: 'flex-end' }}>🤖</div>}
      <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isUser ? 'linear-gradient(135deg,#531697,#13a1a5)' : '#fff', color: isUser ? '#fff' : '#0f1a2e', fontSize: '.875rem', lineHeight: 1.65, border: isUser ? 'none' : '1px solid #e8edf5', boxShadow: isUser ? '0 4px 14px rgba(83,22,151,0.25)' : '0 2px 8px rgba(4,44,93,0.06)', whiteSpace: 'pre-wrap', fontFamily: "'Nunito',sans-serif" }}>
        {msg.content}{msg.loading && <span style={{ opacity: .5 }}>▋</span>}
      </div>
      {isUser && <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0f3fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', flexShrink: 0, marginLeft: 10, alignSelf: 'flex-end' }}>👤</div>}
    </div>
  );
}

// ── Full Prep Display ─────────────────────────────────────────────────────────
function PrepResult({ data, targetRole }) {
  const [section, setSection] = useState('technical');
  const secs = [
    { id: 'technical', label: '💻 Technical', count: data.technical_questions?.length },
    { id: 'behavioral', label: '🤝 Behavioural', count: data.behavioral_questions?.length },
    { id: 'gap', label: '⚠️ Gap Questions', count: data.gap_questions?.length },
    { id: 'wins', label: '⚡ Quick Wins', count: data.quick_wins?.length },
  ];
  return (
    <div style={{ fontFamily: "'Nunito',sans-serif" }}>
      <div style={{ background: 'linear-gradient(135deg,rgba(83,22,151,0.05),rgba(19,161,165,0.05))', border: '1px solid rgba(83,22,151,0.12)', borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#531697', marginBottom: 6, letterSpacing: '.05em' }}>🧠 PERSONALISED COACHING SUMMARY</div>
        <div style={{ fontSize: '.88rem', color: '#3d4e6b', lineHeight: 1.7 }}>{data.coaching_summary}</div>
        <div style={{ marginTop: 8, fontSize: '.72rem', color: '#b0bec9' }}>Target role: <strong style={{ color: '#531697' }}>{targetRole}</strong> · Powered by Gemini 2.0 Flash</div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {secs.map(s => <button key={s.id} onClick={() => setSection(s.id)} style={{ padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${section === s.id ? '#531697' : '#d0d7e8'}`, background: section === s.id ? 'rgba(83,22,151,0.08)' : '#fff', color: section === s.id ? '#531697' : '#7a8ba8', fontWeight: 700, cursor: 'pointer', fontSize: '.78rem', fontFamily: "'Nunito',sans-serif" }}>{s.label} ({s.count || 0})</button>)}
      </div>
      {section === 'technical' && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{(data.technical_questions || []).map((q, i) => { const dc = { easy: '#47d372', medium: '#f59e0b', hard: '#ef4444' }; return <div key={i} style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 12, padding: '14px 16px', borderLeft: `3px solid ${dc[q.difficulty] || '#531697'}` }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}><div style={{ fontWeight: 700, fontSize: '.88rem', color: '#0f1a2e', flex: 1, paddingRight: 8 }}>Q{i + 1}. {q.question}</div><span style={{ padding: '2px 8px', borderRadius: 999, background: `${dc[q.difficulty] || '#531697'}15`, color: dc[q.difficulty] || '#531697', fontSize: '.65rem', fontWeight: 700, flexShrink: 0, textTransform: 'capitalize' }}>{q.difficulty}</span></div><div style={{ fontSize: '.78rem', color: '#7a8ba8', lineHeight: 1.55 }}>💡 <em>{q.tip}</em></div>{q.skill && <div style={{ marginTop: 6 }}><span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(83,22,151,0.07)', color: '#531697', fontSize: '.68rem', fontWeight: 700 }}>{q.skill}</span></div>}</div>; })}</div>}
      {section === 'behavioral' && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{(data.behavioral_questions || []).map((q, i) => <div key={i} style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 12, padding: '14px 16px', borderLeft: '3px solid #13a1a5' }}><div style={{ fontWeight: 700, fontSize: '.88rem', color: '#0f1a2e', marginBottom: 6 }}>Q{i + 1}. {q.question}</div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(19,161,165,0.08)', color: '#0d7a7e', fontSize: '.68rem', fontWeight: 700 }}>Use {q.framework} framework</span><span style={{ fontSize: '.75rem', color: '#7a8ba8' }}>Testing: <em>{q.angle}</em></span></div></div>)}</div>}
      {section === 'gap' && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{(data.gap_questions || []).map((q, i) => <div key={i} style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 12, padding: '14px 16px', borderLeft: '3px solid #f59e0b' }}><div style={{ fontWeight: 700, fontSize: '.88rem', color: '#0f1a2e', marginBottom: 8 }}>⚠️ {q.question}</div><div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: 8, fontSize: '.8rem', color: '#3d4e6b', lineHeight: 1.6 }}><strong style={{ color: '#92400e' }}>How to handle: </strong>{q.how_to_handle}</div></div>)}</div>}
      {section === 'wins' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>{(data.quick_wins || []).map((w, i) => <div key={i} style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 12, padding: '14px 16px', borderTop: '3px solid #47d372', display: 'flex', gap: 10 }}><div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(71,211,114,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '.75rem', color: '#166534' }}>{i + 1}</div><div style={{ fontSize: '.83rem', color: '#3d4e6b', lineHeight: 1.6 }}>{w}</div></div>)}</div>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InterviewPrepPage() {
  const { user } = useAuth();
  const [mode, setMode]                     = useState(null);
  const [latestResult, setLatestResult]     = useState(null);
  const [targetRole, setTargetRole]         = useState('Software Engineer');
  const [prepLoading, setPrepLoading]       = useState(false);
  const [prepResult, setPrepResult]         = useState(null);
  const [prepError, setPrepError]           = useState('');
  const [messages, setMessages]             = useState([]);
  const [input, setInput]                   = useState('');
  const [chatLoading, setChatLoading]       = useState(false);
  const [questionIndex, setQuestionIndex]   = useState(0);
  const [mockQuestions, setMockQuestions]   = useState([]);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [isRecording, setIsRecording]       = useState(false);
  const [deepDiveTopic, setDeepDiveTopic]   = useState('');
  const [deepDiveResult, setDeepDiveResult] = useState(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const bottomRef = useRef(null);

  // ── Questions Bank state ──────────────────────────────────────────
  const [mainTab, setMainTab]         = useState('ai');
  const [bankQs, setBankQs]           = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankRole, setBankRole]       = useState('All');
  const [bankSubject, setBankSubject] = useState('All');
  const [bankSearch, setBankSearch]   = useState('');
  const [bankOpen, setBankOpen]       = useState(null);
  const [userAnswer, setUserAnswer]   = useState({});
  const [aiAnswer, setAiAnswer]       = useState({});
  const [aiLoading, setAiLoading]     = useState({});

  const BANK_ROLES    = ['All','Frontend Developer','Backend Developer','Full Stack','Data Science','Machine Learning','DevOps','Android','System Design'];
  const BANK_SUBJECTS = ['All','DBMS','Operating Systems','Computer Networks','DSA','OOPs','System Design','Web Development','Machine Learning','Cloud','SQL'];

  useEffect(() => {
    if (mainTab !== 'bank') return;
    setBankLoading(true);
    const p = new URLSearchParams();
    if (bankRole !== 'All')    p.set('role', bankRole);
    if (bankSubject !== 'All') p.set('subject', bankSubject);
    fetch(`${API}/interview?${p}`, { headers: tk() })
      .then(r => r.json()).then(d => setBankQs(d.questions || []))
      .catch(() => setBankQs([])).finally(() => setBankLoading(false));
  }, [mainTab, bankRole, bankSubject]);

  async function getAiAnswer(qId, questionText) {
    setAiLoading(l => ({ ...l, [qId]: true }));
    try {
      const d = await fetch(`${API}/interview/ai-answer`, {
        method: 'POST', headers: { ...tk(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText, role: bankRole !== 'All' ? bankRole : '', subject: bankSubject !== 'All' ? bankSubject : '' })
      }).then(r => r.json());
      setAiAnswer(a => ({ ...a, [qId]: d.answer || 'No answer available.' }));
    } catch {
      setAiAnswer(a => ({ ...a, [qId]: 'Could not fetch AI answer. Try again.' }));
    } finally {
      setAiLoading(l => ({ ...l, [qId]: false }));
    }
  }

  useEffect(() => {
    fetch(`${API}/skillpath/latest`, { headers: tk() })
      .then(r => r.json())
      .then(d => { if (d?.result) { setLatestResult(d.result); setTargetRole(d.result.jobTitle || 'Software Engineer'); } })
      .catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function runFullPrep() {
    setPrepLoading(true); setPrepError(''); setPrepResult(null);
    try {
      const payload = { candidateName: user?.name, targetRole, skillGaps: (latestResult?.skillGapAnalysis?.missingSkills || []).map(s => ({ skill: s, importance: 'important' })), strengths: latestResult?.skillGapAnalysis?.matchedSkills || [], readinessScore: latestResult?.atsScore || 0 };
      const res = await fetch(`${API}/skillpath/interview-prep`, { method: 'POST', headers: { ...tk(), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPrepResult(data);
    } catch (e) { setPrepError(e.message || 'Failed to generate prep guide.'); }
    finally { setPrepLoading(false); }
  }

  async function initMockInterview() {
    setChatLoading(true);
    try {
      const payload = { candidateName: user?.name, targetRole, skillGaps: (latestResult?.skillGapAnalysis?.missingSkills || []).slice(0, 5).map(s => ({ skill: s, importance: 'important' })), strengths: latestResult?.skillGapAnalysis?.matchedSkills || [], readinessScore: latestResult?.atsScore || 0 };
      const res = await fetch(`${API}/skillpath/interview-prep`, { method: 'POST', headers: { ...tk(), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      const qs = [...(data.technical_questions || []).slice(0, 3), ...(data.behavioral_questions || []).slice(0, 2)];
      setMockQuestions(qs);
      const firstQ = qs[0]?.question || 'Tell me about yourself.';
      setMessages([{ role: 'assistant', content: `👋 Hello ${user?.name?.split(' ')[0]}! I'm your AI interview coach for a ${targetRole} role.\n\nYou can answer by speaking 🎙️ (tap the mic) or by typing your answer.\n\n❓ ${firstQ}\n\nTake your time — answer as you would in a real interview.` }]);
      setQuestionIndex(0); setChatInitialized(true);
    } catch (e) {
      setMessages([{ role: 'assistant', content: `Hi ${user?.name?.split(' ')[0]}! Let's do a mock interview for ${targetRole}.\n\nTap 🎙️ to speak or type below.\n\n❓ Tell me about yourself and your key technical skills.` }]);
      setChatInitialized(true);
    }
    finally { setChatLoading(false); }
  }

  async function sendMessage(textOverride) {
    const text = (textOverride !== undefined ? textOverride : input).trim();
    if (!text || chatLoading) return;
    setMessages(m => [...m, { role: 'user', content: text }]);
    setInput(''); setIsRecording(false); setChatLoading(true);
    setMessages(m => [...m, { role: 'assistant', content: '', loading: true }]);
    try {
      const nextQ = mockQuestions[questionIndex + 1];
      const res = await fetch(`${API}/skillpath/mock-feedback`, { method: 'POST', headers: { ...tk(), 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateName: user?.name, targetRole, question: mockQuestions[questionIndex]?.question || 'Tell me about yourself', answer: text, nextQuestion: nextQ?.question, isLast: !nextQ }) });
      const data = await res.json();
      const feedback = data.feedback || generateLocalFeedback(text, nextQ);
      setMessages(m => m.map((msg, i) => i === m.length - 1 ? { role: 'assistant', content: feedback, loading: false } : msg));
      if (nextQ) setQuestionIndex(i => i + 1);
    } catch (e) {
      const nextQ = mockQuestions[questionIndex + 1];
      setMessages(m => m.map((msg, i) => i === m.length - 1 ? { role: 'assistant', content: generateLocalFeedback(text, nextQ), loading: false } : msg));
      if (nextQ) setQuestionIndex(i => i + 1);
    }
    finally { setChatLoading(false); }
  }

  function generateLocalFeedback(answer, nextQ) {
    const words = answer.trim().split(/\s+/).length;
    const quality = words >= 50 ? '✅ Good detail' : words >= 20 ? '⚠️ Could be more specific' : '❌ Too brief — expand with examples';
    const star = 'Use the STAR format (Situation → Task → Action → Result) for stronger answers.';
    if (!nextQ) return `**Feedback:** ${quality}\n\n${words < 50 ? star + '\n\n' : ''}Great job completing the mock interview!`;
    return `**Feedback:** ${quality}\n\n${words < 50 ? star + '\n\n' : ''}➡️ **Next Question:**\n\n❓ ${nextQ.question}`;
  }

  async function runDeepDive() {
    if (!deepDiveTopic.trim()) return;
    setDeepDiveLoading(true); setDeepDiveResult(null);
    try {
      const res = await fetch(`${API}/skillpath/deep-dive`, { method: 'POST', headers: { ...tk(), 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: deepDiveTopic, targetRole, candidateName: user?.name }) });
      setDeepDiveResult(await res.json());
    } catch (e) {
      setDeepDiveResult({ explanation: `${deepDiveTopic} is a key skill for ${targetRole} roles. Focus on fundamentals and practical projects.`, practice_questions: [`Explain ${deepDiveTopic} simply.`, `Give a real-world use case for ${deepDiveTopic}.`, `Common mistakes with ${deepDiveTopic}?`], resources: [`Search "${deepDiveTopic} tutorial" on freeCodeCamp or YouTube.`], quick_prep: `Explain the concept, give an example, describe when NOT to use it.` });
    }
    finally { setDeepDiveLoading(false); }
  }

  const skillGaps = latestResult?.skillGapAnalysis?.missingSkills || [];

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#0f1a2e', display: 'flex', alignItems: 'center', gap: 10 }}>
          🎤 AI Interview Prep
          <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(83,22,151,0.08)', color: '#531697', fontSize: '.72rem', fontWeight: 700 }}>Powered by Gemini 2.0 Flash</span>
        </h1>
        <p style={{ color: '#7a8ba8', marginTop: 4 }}>Personalised coaching based on your SkillPath analysis. Speak your answers in the mock interview — no typing needed!</p>
      </div>

      {/* ── Main Tab Switcher ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 20, borderBottom: '1px solid #e8edf5' }}>
        {[['ai','🤖 AI Prep & Mock'],['bank','📚 Questions Bank']].map(([id, label]) => (
          <button key={id} onClick={() => setMainTab(id)}
            style={{ padding: '9px 18px', borderRadius: '9px 9px 0 0', border: 'none', borderBottom: mainTab === id ? '2px solid #531697' : '2px solid transparent', background: mainTab === id ? 'rgba(83,22,151,.06)' : 'transparent', color: mainTab === id ? '#531697' : '#7a8ba8', fontWeight: 700, cursor: 'pointer', fontSize: '.85rem', fontFamily: "'Nunito',sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Questions Bank Tab ─────────────────────────────────────── */}
      {mainTab === 'bank' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
            <input value={bankSearch} onChange={e => setBankSearch(e.target.value)} placeholder="🔍 Search questions…"
              style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #d0d7e8', fontFamily: "'Nunito',sans-serif", fontSize: '.82rem', flex: 1, minWidth: 160, outline: 'none' }} />
            {[['Role', BANK_ROLES, bankRole, setBankRole],['Subject', BANK_SUBJECTS, bankSubject, setBankSubject]].map(([label, opts, val, setter]) => (
              <select key={label} value={val} onChange={e => setter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #d0d7e8', fontFamily: "'Nunito',sans-serif", fontSize: '.78rem', fontWeight: 700, color: '#3d4e6b', background: '#fff', cursor: 'pointer' }}>
                {opts.map(o => <option key={o} value={o}>{label}: {o}</option>)}
              </select>
            ))}
          </div>

          {bankLoading && <div style={{ textAlign: 'center', padding: 30, color: '#b0bec9' }}>Loading questions…</div>}

          {!bankLoading && bankQs
            .filter(q => !bankSearch || q.question?.toLowerCase().includes(bankSearch.toLowerCase()))
            .map(q => {
              const isOpen = bankOpen === q._id;
              const diffColor = { Hard:'#ef4444', Medium:'#f59e0b', Easy:'#47d372' }[q.difficulty] || '#531697';
              return (
                <div key={q._id} className="card" style={{ padding: '14px 18px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
                        {q.role    && <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(83,22,151,0.08)', color: '#531697', fontSize: '.67rem', fontWeight: 700 }}>👤 {q.role}</span>}
                        {q.subject && <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(19,161,165,0.08)', color: '#13a1a5', fontSize: '.67rem', fontWeight: 700 }}>📘 {q.subject}</span>}
                        {q.difficulty && <span style={{ padding: '2px 8px', borderRadius: 999, background: `${diffColor}12`, color: diffColor, fontSize: '.67rem', fontWeight: 700 }}>{q.difficulty}</span>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#0f1a2e', lineHeight: 1.55 }}>{q.question}</div>
                    </div>
                    <button onClick={() => setBankOpen(isOpen ? null : q._id)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #d0d7e8', background: isOpen ? 'rgba(83,22,151,0.06)' : 'transparent', color: '#531697', fontWeight: 700, cursor: 'pointer', fontSize: '.75rem', flexShrink: 0, fontFamily: "'Nunito',sans-serif" }}>
                      {isOpen ? '▲ Hide' : '▼ Answer'}
                    </button>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0f3fa' }}>
                      {/* Write your own answer */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#7a8ba8', marginBottom: 5, letterSpacing: '.04em' }}>✏️ YOUR ANSWER</div>
                        <textarea value={userAnswer[q._id] || ''} onChange={e => setUserAnswer(a => ({ ...a, [q._id]: e.target.value }))}
                          placeholder="Write your answer here to practise…" rows={3}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d0d7e8', fontFamily: "'Nunito',sans-serif", fontSize: '.83rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      {/* DB answer */}
                      {q.answer && (
                        <div style={{ padding: '10px 14px', background: 'rgba(71,211,114,0.07)', border: '1px solid rgba(71,211,114,0.25)', borderRadius: 9, fontSize: '.82rem', color: '#166534', lineHeight: 1.65, marginBottom: 10 }}>
                          <strong>📖 Suggested Answer:</strong> {q.answer}
                        </div>
                      )}
                      {/* AI answer */}
                      {aiAnswer[q._id] && (
                        <div style={{ padding: '10px 14px', background: 'rgba(83,22,151,0.05)', border: '1px solid rgba(83,22,151,0.12)', borderRadius: 9, fontSize: '.82rem', color: '#3d4e6b', lineHeight: 1.65, marginBottom: 10 }}>
                          <strong style={{ color: '#531697' }}>🤖 AI Answer:</strong> {aiAnswer[q._id]}
                        </div>
                      )}
                      <button onClick={() => getAiAnswer(q._id, q.question)} disabled={aiLoading[q._id]}
                        style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: aiLoading[q._id] ? '#d0d7e8' : 'linear-gradient(135deg,#531697,#13a1a5)', color: '#fff', fontWeight: 700, cursor: aiLoading[q._id] ? 'not-allowed' : 'pointer', fontSize: '.78rem', fontFamily: "'Nunito',sans-serif" }}>
                        {aiLoading[q._id] ? '⏳ Loading…' : '🤖 Get AI Answer'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          }

          {!bankLoading && bankQs.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#b0bec9' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
              No interview questions yet. Ask admin to add questions via bulk upload.
            </div>
          )}
        </div>
      )}

      {/* ── AI Prep Tab (existing content) ────────────────────────── */}
      {mainTab === 'ai' && (<>
      <div style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#3d4e6b', flexShrink: 0 }}>🎯 Target Role:</div>
        <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Software Engineer, Data Scientist" style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d0d7e8', fontFamily: "'Nunito',sans-serif", fontSize: '.88rem', outline: 'none', color: '#0f1a2e' }} />
        {latestResult && <div style={{ fontSize: '.72rem', color: '#7a8ba8' }}>ATS: <strong style={{ color: '#531697' }}>{latestResult.atsScore}/100</strong> · Gaps: <strong style={{ color: '#991b1b' }}>{skillGaps.length}</strong></div>}
        {!latestResult && <div style={{ fontSize: '.72rem', color: '#f59e0b', fontWeight: 600 }}>⚠️ Run SkillPath AI first for personalised questions</div>}
      </div>

      {!mode && (
        <div>
          <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#7a8ba8', marginBottom: 12 }}>Choose your prep mode:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
            {MODES.map(m => (
              <div key={m.id} onClick={() => { setMode(m.id); if (m.id === 'prep') runFullPrep(); if (m.id === 'mock') initMockInterview(); }}
                style={{ background: '#fff', border: '1.5px solid #e8edf5', borderRadius: 14, padding: '20px 18px', cursor: 'pointer', transition: 'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#531697'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(83,22,151,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e8edf5'; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{m.icon}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '.95rem', color: '#0f1a2e', marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: '.8rem', color: '#7a8ba8', lineHeight: 1.55 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode && (
        <button onClick={() => { setMode(null); setPrepResult(null); setMessages([]); setDeepDiveResult(null); setChatInitialized(false); setInput(''); setIsRecording(false); }}
          style={{ marginBottom: 18, padding: '7px 16px', borderRadius: 8, border: '1.5px solid #d0d7e8', background: 'transparent', color: '#7a8ba8', fontWeight: 700, cursor: 'pointer', fontSize: '.82rem', fontFamily: "'Nunito',sans-serif" }}>
          ← Back to modes
        </button>
      )}

      {/* Full Prep */}
      {mode === 'prep' && (
        <div>
          {prepLoading && <div style={{ textAlign: 'center', padding: '40px 0' }}><div style={{ width: 40, height: 40, border: '3px solid #e8edf5', borderTopColor: '#531697', borderRadius: '50%', animation: '_ipspin .7s linear infinite', margin: '0 auto 14px' }} /><div style={{ color: '#7a8ba8', fontSize: '.88rem' }}>Gemini is generating your personalised interview guide…</div></div>}
          {prepError && <div style={{ padding: '14px 18px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, color: '#991b1b', fontSize: '.85rem', fontWeight: 600, marginBottom: 14 }}>⚠️ {prepError}<button onClick={runFullPrep} style={{ marginLeft: 10, padding: '4px 12px', borderRadius: 7, border: 'none', background: '#991b1b', color: '#fff', cursor: 'pointer', fontSize: '.78rem', fontFamily: "'Nunito',sans-serif" }}>Retry</button></div>}
          {prepResult && !prepLoading && <PrepResult data={prepResult} targetRole={targetRole} />}
        </div>
      )}

      {/* Mock Interview Chat */}
      {mode === 'mock' && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 16, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#042c5d,#531697)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '.9rem', color: '#fff' }}>AI Interview Coach</div>
                <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.6)' }}>Mock interview for {targetRole} · {mockQuestions.length} questions</div>
              </div>
              <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '.68rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                🎙️ Voice enabled
              </div>
            </div>

            {/* Messages */}
            <div style={{ height: 400, overflowY: 'auto', padding: '18px 18px 10px', background: '#f8f9fc' }}>
              {!chatInitialized && chatLoading && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#7a8ba8' }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #e8edf5', borderTopColor: '#531697', borderRadius: '50%', animation: '_ipspin .7s linear infinite', margin: '0 auto 10px' }} />
                  Preparing your mock interview…
                </div>
              )}
              {messages.map((m, i) => <Bubble key={i} msg={m} />)}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #e8edf5', background: '#fff' }}>
              {/* Live transcript preview */}
              {isRecording && input && (
                <div style={{ marginBottom: 8, padding: '6px 12px', background: 'rgba(83,22,151,0.05)', borderRadius: 8, fontSize: '.78rem', color: '#531697', fontStyle: 'italic', border: '1px dashed rgba(83,22,151,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'voicepulse 1s ease-in-out infinite', display: 'inline-block' }} />
                  {input}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="🎙️ Tap mic to speak, or type here… (Enter to send)"
                  rows={2} disabled={chatLoading || !chatInitialized}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #d0d7e8', fontFamily: "'Nunito',sans-serif", fontSize: '.88rem', resize: 'none', outline: 'none', lineHeight: 1.5, color: '#0f1a2e' }} />
                
                <VoiceButton
                  disabled={chatLoading || !chatInitialized}
                  onTranscript={(t) => { setInput(t); setIsRecording(true); }}
                  onStop={(final) => { setIsRecording(false); if (final.trim()) sendMessage(final.trim()); }}
                />

                <button onClick={() => sendMessage()} disabled={chatLoading || !input.trim() || !chatInitialized}
                  style={{ padding: '0 18px', height: 44, borderRadius: 10, border: 'none', background: chatLoading || !input.trim() ? '#d0d7e8' : 'linear-gradient(135deg,#531697,#13a1a5)', color: '#fff', fontWeight: 800, cursor: chatLoading || !input.trim() ? 'not-allowed' : 'pointer', fontFamily: "'Nunito',sans-serif", fontSize: '.88rem', flexShrink: 0 }}>
                  {chatLoading ? '…' : 'Send ↑'}
                </button>
              </div>
              <div style={{ marginTop: 7, fontSize: '.69rem', color: '#b0bec9', display: 'flex', gap: 14 }}>
                <span>🎙️ Tap mic → speak → tap again to auto-send</span>
                <span>⌨️ Enter to send · Shift+Enter new line</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: '.73rem', color: '#b0bec9', textAlign: 'center' }}>Your answers are not stored. This is a safe practice space.</div>
        </div>
      )}

      {/* Deep Dive */}
      {mode === 'tips' && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '.95rem', marginBottom: 12, color: '#0f1a2e' }}>💡 Choose a topic to deep dive</div>
            {skillGaps.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>YOUR SKILL GAPS — click to explore</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {skillGaps.slice(0, 10).map(s => <button key={s} onClick={() => setDeepDiveTopic(s)} style={{ padding: '5px 12px', borderRadius: 999, border: `1.5px solid ${deepDiveTopic === s ? '#531697' : 'rgba(239,68,68,0.3)'}`, background: deepDiveTopic === s ? 'rgba(83,22,151,0.08)' : 'rgba(239,68,68,0.06)', color: deepDiveTopic === s ? '#531697' : '#991b1b', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>{s}</button>)}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={deepDiveTopic} onChange={e => setDeepDiveTopic(e.target.value)} placeholder="Or type any skill e.g. Docker, System Design, SQL…" style={{ flex: 1, padding: '10px 14px', borderRadius: 9, border: '1.5px solid #d0d7e8', fontFamily: "'Nunito',sans-serif", fontSize: '.88rem', outline: 'none' }} />
              <button onClick={runDeepDive} disabled={!deepDiveTopic.trim() || deepDiveLoading} style={{ padding: '10px 22px', borderRadius: 9, border: 'none', background: !deepDiveTopic.trim() || deepDiveLoading ? '#d0d7e8' : 'linear-gradient(135deg,#531697,#13a1a5)', color: '#fff', fontWeight: 800, cursor: !deepDiveTopic.trim() ? 'not-allowed' : 'pointer', fontFamily: "'Nunito',sans-serif" }}>{deepDiveLoading ? '…' : 'Deep Dive →'}</button>
            </div>
          </div>
          {deepDiveResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 12, padding: '16px 18px' }}><div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '.9rem', marginBottom: 10, color: '#0f1a2e' }}>📖 About {deepDiveTopic}</div><div style={{ fontSize: '.85rem', color: '#3d4e6b', lineHeight: 1.7 }}>{deepDiveResult.explanation}</div></div>
              {deepDiveResult.practice_questions?.length > 0 && <div style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 12, padding: '16px 18px' }}><div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '.9rem', marginBottom: 10, color: '#0f1a2e' }}>❓ Practice Questions</div>{deepDiveResult.practice_questions.map((q, i) => <div key={i} style={{ padding: '9px 12px', background: '#f8f9fc', borderRadius: 8, marginBottom: 7, fontSize: '.83rem', color: '#3d4e6b' }}>Q{i + 1}. {q}</div>)}</div>}
              {deepDiveResult.quick_prep && <div style={{ background: 'rgba(83,22,151,0.05)', border: '1px solid rgba(83,22,151,0.12)', borderRadius: 12, padding: '14px 16px', fontSize: '.83rem', color: '#3d4e6b', lineHeight: 1.65 }}><strong style={{ color: '#531697' }}>⚡ Quick Interview Prep: </strong>{deepDiveResult.quick_prep}</div>}
            </div>
          )}
        </div>
      )}

      </>)}

      <style>{`
        @keyframes _ipspin { to { transform: rotate(360deg) } }
        @keyframes voicepulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(239,68,68,0.25); }
          50%      { box-shadow: 0 0 0 9px rgba(239,68,68,0.08); }
        }
      `}</style>
    </div>
  );
}
