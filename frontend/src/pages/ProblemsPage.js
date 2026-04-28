import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tk  = () => ({ Authorization:`Bearer ${localStorage.getItem('pragati_token')}` });
const tks = () => ({ Authorization:`Bearer ${localStorage.getItem('pragati_token')}`, 'Content-Type':'application/json' });

const DIFF = {
  Easy:   { bg:'rgba(71,211,114,0.1)',  color:'#166534', border:'rgba(71,211,114,0.3)' },
  Medium: { bg:'rgba(245,158,11,0.1)',  color:'#92400e', border:'rgba(245,158,11,0.3)' },
  Hard:   { bg:'rgba(239,68,68,0.1)',   color:'#991b1b', border:'rgba(239,68,68,0.3)' },
};
const SRC_COLOR = { LeetCode:'#f59e0b', HackerRank:'#22c55e', CodeChef:'#531697', GFG:'#2ea854', HackerEarth:'#3b82f6', Custom:'#13a1a5' };
const PROB_CATS = ['All','Arrays','Strings','Linked List','Trees','Graphs','Dynamic Programming','Sorting','Binary Search','Stack & Queue','Recursion','Backtracking','Bit Manipulation','Math','Greedy'];
const PROB_SRCS = ['All','LeetCode','HackerRank','CodeChef','GFG','HackerEarth','Custom'];
const LANGUAGES = ['javascript','python','java','c++','c','go','rust'];

const PLATFORMS = [
  { id:'LeetCode',    name:'LeetCode',    emoji:'⚡', color:'#f59e0b', desc:'DSA & interview prep', url:'https://leetcode.com/problemset/', tagline:'#1 for FAANG prep' },
  { id:'CodeChef',    name:'CodeChef',    emoji:'👨‍🍳', color:'#531697', desc:'Competitive programming', url:'https://www.codechef.com/practice', tagline:'Great for contests' },
  { id:'HackerRank',  name:'HackerRank',  emoji:'💻', color:'#22c55e', desc:'Company-specific problems', url:'https://www.hackerrank.com/domains/algorithms', tagline:'Used by TCS, Wipro' },
  { id:'GFG',         name:'GeeksForGeeks', emoji:'🌐', color:'#2ea854', desc:'Concept + practice combo', url:'https://practice.geeksforgeeks.org/', tagline:'Best for theory+coding' },
  { id:'HackerEarth', name:'HackerEarth', emoji:'🌍', color:'#3b82f6', desc:'Hiring contests & practice', url:'https://www.hackerearth.com/practice/', tagline:'Used in campus hiring' },
  { id:'Custom',      name:'PRAGATI Bank',emoji:'🎯', color:'#13a1a5', desc:'Curated by your faculty', url:null, tagline:'Faculty-curated problems' },
];

/* ── Platform Selection Popup ────────────────────────────────────── */
function PlatformPopup({ onSelect }) {
  const today = new Date().toDateString();
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(4,44,93,0.6)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'28px', maxWidth:520, width:'100%', boxShadow:'0 24px 80px rgba(4,44,93,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:22 }}>
          <div style={{ fontSize:'2rem', marginBottom:8 }}>💻</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.2rem', color:'#0f1a2e' }}>Where do you want to practice today?</div>
          <div style={{ fontSize:'.78rem', color:'#7a8ba8', marginTop:4 }}>{today} · Choose your platform for today's session</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => onSelect(p)}
              style={{ padding:'14px 16px', borderRadius:12, border:`1.5px solid ${p.color}30`, background:`${p.color}06`, cursor:'pointer', textAlign:'left', transition:'all .15s', fontFamily:"'Nunito',sans-serif" }}
              onMouseOver={e=>{e.currentTarget.style.borderColor=`${p.color}80`; e.currentTarget.style.background=`${p.color}12`;}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=`${p.color}30`; e.currentTarget.style.background=`${p.color}06`;}}>
              <div style={{ fontSize:'1.4rem', marginBottom:4 }}>{p.emoji}</div>
              <div style={{ fontWeight:800, fontSize:'.88rem', color:p.color }}>{p.name}</div>
              <div style={{ fontSize:'.7rem', color:'#7a8ba8', marginTop:2 }}>{p.desc}</div>
              <div style={{ fontSize:'.65rem', color:p.color, marginTop:3, fontWeight:700 }}>{p.tagline}</div>
            </button>
          ))}
        </div>
        <button onClick={() => onSelect(null)}
          style={{ width:'100%', marginTop:14, padding:'9px', borderRadius:10, border:'1px solid #e8edf5', background:'transparent', color:'#7a8ba8', fontWeight:600, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.82rem' }}>
          Skip — Show all problems
        </button>
      </div>
    </div>
  );
}

/* ── Voice Button ────────────────────────────────────────────────── */
function VoiceButton({ onResult }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  if (!supported) return null;
  function toggle() {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR(); rec.lang='en-IN'; rec.interimResults=false;
    rec.onresult = e => onResult(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.start(); recRef.current = rec; setListening(true);
  }
  return (
    <button type="button" onClick={toggle}
      style={{ padding:'6px 10px', borderRadius:8, border:`1.5px solid ${listening?'#ef4444':'#d0d7e8'}`, background:listening?'rgba(239,68,68,0.08)':'transparent', color:listening?'#ef4444':'#531697', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.75rem', display:'flex', alignItems:'center', gap:5 }}>
      {listening ? '⏹ Stop' : '🎙️ Voice'}
    </button>
  );
}

/* ── Debug Result Panel ──────────────────────────────────────────── */
function DebugPanel({ result, loading }) {
  const [showFix, setShowFix] = useState(false);

  if (loading) return (
    <div style={{ marginTop:14, padding:'20px 18px', background:'rgba(83,22,151,0.04)', border:'1px solid rgba(83,22,151,0.12)', borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div style={{ width:36, height:36, border:'3px solid #d0d7e8', borderTopColor:'#531697', borderRadius:'50%', animation:'_dbg .7s linear infinite' }} />
      <span style={{ fontSize:'.88rem', color:'#531697', fontWeight:700 }}>🤖 Gemini AI is analysing your code…</span>
      <span style={{ fontSize:'.75rem', color:'#b0bec9' }}>Tracing through logic, checking edge cases, running test cases mentally</span>
      <style>{`@keyframes _dbg{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!result) return null;

  const vc = { likely_correct:'#47d372', review:'#f59e0b', has_errors:'#ef4444' };
  const vb = { likely_correct:'rgba(71,211,114,0.08)', review:'rgba(245,158,11,0.08)', has_errors:'rgba(239,68,68,0.08)' };
  const ve = { likely_correct:'rgba(71,211,114,0.25)', review:'rgba(245,158,11,0.25)', has_errors:'rgba(239,68,68,0.25)' };
  const v  = result.verdict || 'review';

  return (
    <div style={{ marginTop:14, border:`1.5px solid ${ve[v]}`, borderRadius:14, overflow:'hidden', fontFamily:"'Nunito',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ padding:'14px 18px', background:vb[v], borderBottom:`1px solid ${ve[v]}`, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:'50%', border:`2px solid ${vc[v]}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 }}>
          {v==='likely_correct'?'✅':v==='has_errors'?'❌':'⚠️'}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:'.9rem', color:'#0f1a2e', fontFamily:"'Syne',sans-serif", display:'flex', alignItems:'center', gap:6 }}>
            🤖 Gemini AI Debug Report
            {result.source && (
              <span style={{ padding:'1px 8px', borderRadius:999, background: result.source==='gemini'?'rgba(66,133,244,0.1)':'rgba(83,22,151,0.08)', color: result.source==='gemini'?'#4285f4':'#531697', fontSize:'.65rem', fontWeight:700 }}>
                {result.source==='gemini'?'✨ Gemini 2.0 Flash':result.source==='ml'?'🧠 ML Model':'⚙️ Static Analysis'}
              </span>
            )}
          </div>
          <div style={{ fontSize:'.82rem', color:vc[v], fontWeight:700, marginTop:2 }}>{result.verdictMessage}</div>
        </div>
        {/* Complexity badges */}
        {(result.timeComplexity||result.spaceComplexity) && result.timeComplexity!=='N/A' && (
          <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end', flexShrink:0 }}>
            {result.timeComplexity && result.timeComplexity!=='N/A' && (
              <span style={{ padding:'2px 8px', borderRadius:6, background:'rgba(83,22,151,0.08)', color:'#531697', fontSize:'.68rem', fontWeight:800 }}>⏱ {result.timeComplexity}</span>
            )}
            {result.spaceComplexity && result.spaceComplexity!=='N/A' && (
              <span style={{ padding:'2px 8px', borderRadius:6, background:'rgba(19,161,165,0.08)', color:'#13a1a5', fontSize:'.68rem', fontWeight:800 }}>💾 {result.spaceComplexity}</span>
            )}
          </div>
        )}
      </div>

      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* ── AI Explanation ── */}
        {result.explanation && (
          <div style={{ padding:'12px 14px', background:'rgba(83,22,151,0.04)', border:'1px solid rgba(83,22,151,0.1)', borderRadius:10 }}>
            <div style={{ fontSize:'.72rem', fontWeight:800, color:'#531697', marginBottom:5, letterSpacing:'.05em' }}>🧠 AI ANALYSIS</div>
            <div style={{ fontSize:'.83rem', color:'#3d4e6b', lineHeight:1.7 }}>{result.explanation}</div>
          </div>
        )}

        {/* ── Issues ── */}
        {result.issues?.length > 0 && (
          <div>
            <div style={{ fontSize:'.72rem', fontWeight:800, color:'#3d4e6b', marginBottom:8, letterSpacing:'.05em' }}>🔍 ISSUES FOUND ({result.issues.length})</div>
            {result.issues.map((issue, i) => {
              const ic = { error:'#ef4444', warning:'#f59e0b', info:'#13a1a5' }[issue.type] || '#7a8ba8';
              return (
                <div key={i} style={{ display:'flex', gap:9, padding:'9px 12px', background:`${ic}08`, border:`1.5px solid ${ic}25`, borderRadius:9, marginBottom:6, alignItems:'flex-start' }}>
                  <span style={{ fontSize:'.85rem', flexShrink:0, marginTop:1 }}>{issue.type==='error'?'❌':issue.type==='warning'?'⚠️':'ℹ️'}</span>
                  <div>
                    {issue.line && <span style={{ fontSize:'.68rem', fontWeight:800, color:ic, marginRight:6, background:`${ic}15`, padding:'1px 6px', borderRadius:4 }}>Line {issue.line}</span>}
                    <span style={{ fontSize:'.83rem', color:'#0f1a2e', fontWeight:600 }}>{issue.msg}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Hints ── */}
        {result.hints?.length > 0 && (
          <div>
            <div style={{ fontSize:'.72rem', fontWeight:800, color:'#3d4e6b', marginBottom:8, letterSpacing:'.05em' }}>💡 ACTIONABLE HINTS</div>
            {result.hints.map((hint, i) => (
              <div key={i} style={{ display:'flex', gap:9, padding:'9px 12px', background:'rgba(83,22,151,0.04)', border:'1px solid rgba(83,22,151,0.1)', borderRadius:9, marginBottom:6, alignItems:'flex-start' }}>
                <span style={{ flexShrink:0, fontSize:'.85rem' }}>💡</span>
                <span style={{ fontSize:'.83rem', color:'#3d4e6b', lineHeight:1.6 }}>{hint}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Test Results ── */}
        {result.testResults?.length > 0 && (
          <div>
            <div style={{ fontSize:'.72rem', fontWeight:800, color:'#3d4e6b', marginBottom:8, letterSpacing:'.05em' }}>
              🧪 TEST CASE RESULTS ({result.testResults.filter(t=>t.passed===true).length}/{result.testResults.length} passed)
            </div>
            {result.testResults.map((tc, i) => (
              <div key={i} style={{ padding:'10px 12px', background:'#fafbff', border:`1.5px solid ${tc.passed===true?'rgba(71,211,114,0.3)':tc.passed===false?'rgba(239,68,68,0.25)':'#e8edf5'}`, borderRadius:10, marginBottom:7 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontWeight:800, fontSize:'.8rem', color:'#3d4e6b' }}>Test Case {i+1}</span>
                  <span style={{ padding:'2px 10px', borderRadius:999, background:tc.passed===true?'rgba(71,211,114,0.12)':tc.passed===false?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)', color:tc.passed===true?'#166534':tc.passed===false?'#991b1b':'#92400e', fontWeight:800, fontSize:'.7rem' }}>
                    {tc.passed===true?'✅ PASS':tc.passed===false?'❌ FAIL':'⚠️ UNCERTAIN'}
                  </span>
                </div>
                <div style={{ display:'grid', gap:4, fontSize:'.78rem' }}>
                  <div><span style={{ color:'#b0bec9', fontWeight:700 }}>Input:</span> <code style={{ color:'#0f1a2e', background:'rgba(4,44,93,0.05)', padding:'1px 5px', borderRadius:4 }}>{String(tc.input)}</code></div>
                  <div><span style={{ color:'#b0bec9', fontWeight:700 }}>Expected:</span> <code style={{ color:'#166534', background:'rgba(71,211,114,0.08)', padding:'1px 5px', borderRadius:4 }}>{String(tc.expected)}</code></div>
                  {tc.actualOutput && <div><span style={{ color:'#b0bec9', fontWeight:700 }}>Got:</span> <code style={{ color: tc.passed===false?'#991b1b':'#0f1a2e', background: tc.passed===false?'rgba(239,68,68,0.07)':'rgba(4,44,93,0.05)', padding:'1px 5px', borderRadius:4 }}>{String(tc.actualOutput)}</code></div>}
                  {tc.trace && <div style={{ marginTop:4, padding:'6px 8px', background:'rgba(83,22,151,0.04)', borderRadius:6, color:'#7a8ba8', fontSize:'.72rem', lineHeight:1.6 }}><span style={{ fontWeight:700, color:'#531697' }}>Trace:</span> {tc.trace}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Suggested Fix ── */}
        {result.suggestedFix && result.suggestedFix.length > 5 && (
          <div>
            <button onClick={()=>setShowFix(f=>!f)}
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid rgba(71,211,114,0.3)', background:showFix?'rgba(71,211,114,0.08)':'transparent', color:'#166534', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.83rem', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>🔧 {showFix ? 'Hide' : 'Show'} Suggested Fix</span>
              <span style={{ fontSize:'.7rem' }}>{showFix?'▲':'▼'}</span>
            </button>
            {showFix && (
              <div style={{ marginTop:6, padding:'12px 14px', background:'rgba(71,211,114,0.05)', border:'1px solid rgba(71,211,114,0.2)', borderRadius:10, fontSize:'.82rem', color:'#3d4e6b', lineHeight:1.8, whiteSpace:'pre-wrap', fontFamily:'monospace' }}>
                {result.suggestedFix}
              </div>
            )}
          </div>
        )}

        {/* ── Clean state ── */}
        {!result.issues?.length && !result.hints?.length && !result.explanation && (
          <div style={{ textAlign:'center', padding:'12px 0', color:'#b0bec9', fontSize:'.83rem' }}>✅ No issues detected — code looks clean!</div>
        )}
      </div>
    </div>
  );
}

/* ── Problem Card (with Debug Agent) ────────────────────────────── */
function ProblemCard({ problem, userProblem, onSolve, onShuffle, solving, shuffling }) {
  const [showSolve, setShowSolve] = useState(false);
  const [code, setCode]           = useState('');
  const [notes, setNotes]         = useState('');
  const [rating, setRating]       = useState(0);
  const [err, setErr]             = useState('');
  const [lang, setLang]           = useState('javascript');
  const [debugResult, setDebugResult] = useState(null);
  const [debugging, setDebugging]     = useState(false);
  const isSolved   = userProblem?.status === 'solved';
  const isShuffled = userProblem?.shuffled;
  const diff = DIFF[problem.difficulty] || DIFF.Easy;
  const srcColor = SRC_COLOR[problem.source] || '#531697';

  function handleOpen() {
    window.open(problem.url, '_blank');
    if (userProblem?.status==='assigned') fetch(`${API}/problems/${problem._id}/attempt`, { method:'POST', headers:tk() }).catch(()=>{});
  }

  function handleSubmit() {
    if (!code.trim() || code.trim().length < 10) { setErr('⚠️ Paste your solution code (minimum 10 characters) before submitting.'); return; }
    setErr(''); onSolve(problem._id, notes, code, rating);
  }

  async function handleDebug() {
    if (!code.trim() || code.trim().length < 5) { setErr('⚠️ Paste some code first to debug.'); return; }
    setErr(''); setDebugging(true); setDebugResult(null);
    try {
      const res = await fetch(`${API}/debug`, {
        method:'POST', headers:tks(),
        body: JSON.stringify({ code, language:lang, problemTitle: problem.title, testCases: problem.testCases || [] })
      });
      const d = await res.json();
      setDebugResult(d);
    } catch(e) {
      setDebugResult({ verdict:'review', verdictMessage:'Could not reach debug service. Check your connection.', issues:[], hints:[], testResults:[] });
    } finally { setDebugging(false); }
  }

  return (
    <div style={{ background:'#fff', border:`1.5px solid ${isSolved?'#47d372':'#e8edf5'}`, borderRadius:16, padding:'22px 24px', boxShadow:isSolved?'0 4px 16px rgba(71,211,114,0.1)':'0 2px 8px rgba(4,44,93,0.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            {isSolved && <span>✅</span>}
            {isShuffled && !isSolved && <span title="Shuffled">🔀</span>}
            <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.05rem', color:'#0f1a2e' }}>{problem.title}</h3>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span style={{ ...diff, padding:'3px 10px', borderRadius:999, fontSize:'.72rem', fontWeight:700, border:`1px solid ${diff.border}` }}>{problem.difficulty}</span>
            <span style={{ padding:'3px 10px', borderRadius:999, background:'rgba(83,22,151,0.07)', color:'#531697', fontSize:'.72rem', fontWeight:700 }}>{problem.topic||'General'}</span>
            <span style={{ padding:'3px 10px', borderRadius:999, background:`${srcColor}15`, color:srcColor, fontSize:'.72rem', fontWeight:700 }}>{problem.source}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:7, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {problem.url && (
            <button onClick={handleOpen} style={{ padding:'8px 14px', borderRadius:9, border:`1.5px solid ${srcColor}`, background:`${srcColor}10`, color:srcColor, fontWeight:700, cursor:'pointer', fontSize:'.78rem', fontFamily:"'Nunito',sans-serif" }}>
              Solve on {problem.source} →
            </button>
          )}
          {!isSolved && !userProblem?.shuffled && (
            <button onClick={onShuffle} disabled={shuffling}
              style={{ padding:'8px 12px', borderRadius:9, border:'1.5px solid #d0d7e8', background:'rgba(245,158,11,0.06)', color:'#92400e', fontWeight:700, cursor:shuffling?'not-allowed':'pointer', fontSize:'.78rem', fontFamily:"'Nunito',sans-serif" }}>
              {shuffling?'…':'🔀 Easier'}
            </button>
          )}
          {!isSolved && (
            <button onClick={()=>setShowSolve(s=>!s)}
              style={{ padding:'8px 14px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#531697,#13a1a5)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'.78rem', fontFamily:"'Nunito',sans-serif" }}>
              {showSolve?'Cancel':'✓ Submit'}
            </button>
          )}
        </div>
      </div>

      {isSolved && (
        <div style={{ marginTop:10, fontSize:'.75rem', color:'#7a8ba8', display:'flex', gap:12 }}>
          <span>✅ Solved {new Date(userProblem.solvedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
          {userProblem.selfRating && <span>{'⭐'.repeat(userProblem.selfRating)}</span>}
        </div>
      )}

      {showSolve && !isSolved && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid #e8edf5' }}>

          {/* Language selector */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:'.75rem', fontWeight:800, color:'#3d4e6b', fontFamily:"'Syne',sans-serif", display:'block', marginBottom:5 }}>Language</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {LANGUAGES.map(l => (
                <button key={l} type="button" onClick={()=>setLang(l)}
                  style={{ padding:'4px 12px', borderRadius:999, border:`1.5px solid ${lang===l?'#531697':'#d0d7e8'}`, background:lang===l?'rgba(83,22,151,0.08)':'transparent', color:lang===l?'#531697':'#7a8ba8', fontWeight:700, cursor:'pointer', fontSize:'.72rem', fontFamily:"'Nunito',sans-serif" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Code editor */}
          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <label style={{ fontSize:'.78rem', fontWeight:800, color:'#ef4444', fontFamily:"'Syne',sans-serif" }}>
                Solution Code <span style={{ color:'#b0bec9', fontWeight:500 }}>(required)</span>
              </label>
              <VoiceButton onResult={v=>setCode(p=>p+' '+v)} />
            </div>
            <textarea value={code} onChange={e=>setCode(e.target.value)} rows={10}
              placeholder={`// Write your ${lang} solution here…\n// Example:\nfunction solution(input) {\n    // your logic\n    return result;\n}`}
              style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${err&&!code.trim()?'#ef4444':'#d0d7e8'}`, fontFamily:'JetBrains Mono, monospace', fontSize:'.82rem', resize:'vertical', outline:'none', background:'#0f172a', color:'#e2e8f0', lineHeight:1.7, boxSizing:'border-box' }} />
          </div>

          {/* Debug Agent button */}
          <div style={{ marginBottom:14 }}>
            <button onClick={handleDebug} disabled={debugging || !code.trim()}
              style={{ padding:'9px 20px', borderRadius:9, border:'none', background:debugging||!code.trim()?'#d0d7e8':'linear-gradient(135deg,#1e1b4b,#531697)', color:'#fff', fontWeight:700, cursor:debugging||!code.trim()?'not-allowed':'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.83rem', display:'flex', alignItems:'center', gap:8 }}>
              🤖 {debugging ? 'Analysing…' : 'Debug & Analyse Code'}
            </button>
            <div style={{ fontSize:'.68rem', color:'#b0bec9', marginTop:4 }}>Checks for errors, off-by-one issues, complexity hints and more</div>
          </div>

          {/* Debug Result */}
          <DebugPanel result={debugResult} loading={debugging} />

          {/* Approach notes */}
          <div style={{ marginBottom:14, marginTop: debugResult ? 14 : 0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <label style={{ fontSize:'.78rem', fontWeight:700, color:'#3d4e6b', fontFamily:"'Syne',sans-serif" }}>Approach Notes <span style={{ fontWeight:500, color:'#b0bec9' }}>(optional)</span></label>
              <VoiceButton onResult={v=>setNotes(p=>p+' '+v)} />
            </div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
              placeholder="Describe your approach, time/space complexity, what you learnt…"
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.85rem', resize:'vertical', outline:'none', boxSizing:'border-box' }} />
          </div>

          {/* Self rating */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:'.78rem', fontWeight:700, color:'#3d4e6b', marginBottom:8, fontFamily:"'Syne',sans-serif" }}>How did you do? <span style={{ fontWeight:500, color:'#b0bec9' }}>(optional)</span></label>
            <div style={{ display:'flex', gap:7 }}>
              {[1,2,3,4,5].map(r => (
                <button key={r} onClick={()=>setRating(r)} type="button"
                  style={{ padding:'6px 14px', borderRadius:8, border:`1.5px solid ${rating>=r?'#f59e0b':'#d0d7e8'}`, background:rating>=r?'rgba(245,158,11,0.1)':'transparent', color:rating>=r?'#92400e':'#b0bec9', fontWeight:700, cursor:'pointer', fontSize:'.85rem' }}>
                  {'⭐'.repeat(r)}
                </button>
              ))}
            </div>
          </div>

          {err && <div style={{ padding:'9px 12px', background:'#fee2e2', color:'#991b1b', borderRadius:8, fontSize:'.82rem', fontWeight:600, marginBottom:12 }}>{err}</div>}

          <button onClick={handleSubmit} disabled={solving}
            style={{ padding:'12px 28px', borderRadius:10, border:'none', background:solving?'#d0d7e8':'linear-gradient(135deg,#531697,#13a1a5)', color:'#fff', fontWeight:800, cursor:solving?'not-allowed':'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.9rem' }}>
            {solving ? '⏳ Saving…' : '🎉 Submit Solution & Earn Streak'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── History Card ────────────────────────────────────────────────── */
function HistoryCard({ item }) {
  const [show, setShow] = useState(false);
  const diff = DIFF[item.problemId?.difficulty] || DIFF.Easy;
  return (
    <div style={{ padding:'12px 0', borderBottom:'1px solid #f0f3fa' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span>✅</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:'.86rem', color:'#0f1a2e' }}>{item.problemId?.title}</div>
          <div style={{ fontSize:'.72rem', color:'#b0bec9', marginTop:1 }}>
            {new Date(item.solvedAt||item.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} · {item.problemId?.topic}
            {item.selfRating && ` · ${'⭐'.repeat(item.selfRating)}`}
          </div>
        </div>
        <span style={{ ...diff, padding:'2px 8px', borderRadius:999, fontSize:'.7rem', fontWeight:700, border:`1px solid ${diff.border}` }}>{item.problemId?.difficulty}</span>
        {item.solutionCode && (
          <button onClick={()=>setShow(s=>!s)} style={{ padding:'4px 10px', borderRadius:7, border:'1px solid #d0d7e8', background:'transparent', color:'#531697', fontSize:'.72rem', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
            {show?'Hide':'View Code'}
          </button>
        )}
      </div>
      {show && item.solutionCode && (
        <pre style={{ marginTop:8, background:'#0f172a', borderRadius:8, padding:'10px 12px', overflow:'auto', color:'#e2e8f0', fontSize:'.78rem', fontFamily:'JetBrains Mono, monospace', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{item.solutionCode}</pre>
      )}
      {show && item.approachNotes && (
        <div style={{ marginTop:6, padding:'8px 12px', background:'rgba(83,22,151,0.05)', borderRadius:8, fontSize:'.78rem', color:'#7a8ba8' }}>{item.approachNotes}</div>
      )}
    </div>
  );
}

/* ── All Problems Tab ────────────────────────────────────────────── */
function AllProblemsTab() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cat, setCat]     = useState('All');
  const [diff, setDiff]   = useState('All');
  const [src, setSrc]     = useState('All');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [debugResult, setDebugResult] = useState({});
  const [debugging, setDebugging]     = useState({});
  const [userCode, setUserCode]       = useState({});
  const [lang, setLang]               = useState({});

  useEffect(() => {
    const p = new URLSearchParams();
    if (cat !== 'All')  p.set('topic', cat);
    if (diff !== 'All') p.set('difficulty', diff);
    setLoading(true);
    fetch(`${API}/problems?${p}`, { headers:tk() })
      .then(r=>r.json()).then(d=>setProblems(d.problems||[])).finally(()=>setLoading(false));
  }, [cat, diff]);

  const filtered = problems.filter(p => {
    if (src !== 'All' && p.source !== src) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleDebug(problem) {
    const code = userCode[problem._id] || '';
    const language = lang[problem._id] || 'javascript';
    if (!code.trim() || code.length < 5) return;
    setDebugging(d => ({...d, [problem._id]:true}));
    try {
      const res = await fetch(`${API}/debug`, { method:'POST', headers:tks(), body:JSON.stringify({ code, language, problemTitle:problem.title, testCases:problem.testCases||[] }) });
      const d = await res.json();
      setDebugResult(r => ({...r, [problem._id]:d}));
    } catch { setDebugResult(r => ({...r, [problem._id]:{ verdict:'review', verdictMessage:'Debug service unavailable.', issues:[], hints:[], testResults:[] }})); }
    finally { setDebugging(d => ({...d, [problem._id]:false})); }
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search problem title…"
          style={{ padding:'7px 12px', borderRadius:8, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.82rem', flex:1, minWidth:160, outline:'none' }} />
        {[['Category',PROB_CATS,cat,setCat],['Difficulty',['All','Easy','Medium','Hard'],diff,setDiff],['Source',PROB_SRCS,src,setSrc]].map(([label,opts,val,setter])=>(
          <select key={label} value={val} onChange={e=>setter(e.target.value)}
            style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.78rem', fontWeight:700, color:'#3d4e6b', background:'#fff', cursor:'pointer' }}>
            {opts.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        ))}
      </div>
      <div style={{ fontSize:'.73rem', color:'#7a8ba8', marginBottom:10 }}>{filtered.length} problems</div>

      {loading && <div style={{ textAlign:'center', padding:30, color:'#b0bec9' }}>Loading…</div>}

      {!loading && filtered.map(p => {
        const dc = DIFF[p.difficulty] || DIFF.Easy;
        const sc = SRC_COLOR[p.source] || '#531697';
        const isOpen = expanded === p._id;
        return (
          <div key={p._id} style={{ background:'#fff', border:'1.5px solid #e8edf5', borderRadius:12, marginBottom:10, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:'.88rem', color:'#0f1a2e', marginBottom:5 }}>{p.title}</div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {p.topic && <span style={{ padding:'2px 8px', borderRadius:999, background:'rgba(83,22,151,0.07)', color:'#531697', fontSize:'.68rem', fontWeight:700 }}>{p.topic}</span>}
                  <span style={{ padding:'2px 8px', borderRadius:999, background:dc.bg, color:dc.color, border:`1px solid ${dc.border}`, fontSize:'.68rem', fontWeight:700 }}>{p.difficulty}</span>
                  <span style={{ padding:'2px 8px', borderRadius:999, background:`${sc}15`, color:sc, fontSize:'.68rem', fontWeight:700 }}>{p.source}</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer"
                  style={{ padding:'6px 12px', borderRadius:8, background:`${sc}15`, color:sc, fontWeight:700, fontSize:'.75rem', textDecoration:'none', border:`1px solid ${sc}30` }}>Solve →</a>}
                <button onClick={()=>setExpanded(isOpen ? null : p._id)}
                  style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #d0d7e8', background:isOpen?'rgba(83,22,151,0.06)':'transparent', color:'#531697', fontWeight:700, cursor:'pointer', fontSize:'.75rem', fontFamily:"'Nunito',sans-serif" }}>
                  {isOpen ? '▲ Hide' : '🤖 Try & Debug'}
                </button>
              </div>
            </div>

            {/* Inline code editor + debug panel */}
            {isOpen && (
              <div style={{ padding:'14px 16px', borderTop:'1px solid #f0f3fa', background:'#fafbff' }}>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                  {LANGUAGES.map(l=>(
                    <button key={l} type="button" onClick={()=>setLang(prev=>({...prev,[p._id]:l}))}
                      style={{ padding:'3px 10px', borderRadius:999, border:`1.5px solid ${(lang[p._id]||'javascript')===l?'#531697':'#d0d7e8'}`, background:(lang[p._id]||'javascript')===l?'rgba(83,22,151,0.08)':'transparent', color:(lang[p._id]||'javascript')===l?'#531697':'#7a8ba8', fontWeight:700, cursor:'pointer', fontSize:'.7rem', fontFamily:"'Nunito',sans-serif" }}>
                      {l}
                    </button>
                  ))}
                </div>
                <textarea value={userCode[p._id]||''} onChange={e=>setUserCode(prev=>({...prev,[p._id]:e.target.value}))} rows={8}
                  placeholder={`// Write your ${lang[p._id]||'javascript'} solution here…`}
                  style={{ width:'100%', padding:'12px', borderRadius:10, border:'1.5px solid #2d3748', fontFamily:'JetBrains Mono, monospace', fontSize:'.8rem', resize:'vertical', outline:'none', background:'#0f172a', color:'#e2e8f0', lineHeight:1.7, boxSizing:'border-box', marginBottom:10 }} />
                <button onClick={()=>handleDebug(p)} disabled={debugging[p._id]||!(userCode[p._id]||'').trim()}
                  style={{ padding:'8px 18px', borderRadius:9, border:'none', background:debugging[p._id]||!(userCode[p._id]||'').trim()?'#d0d7e8':'linear-gradient(135deg,#1e1b4b,#531697)', color:'#fff', fontWeight:700, cursor:debugging[p._id]||!(userCode[p._id]||'').trim()?'not-allowed':'pointer', fontSize:'.8rem', fontFamily:"'Nunito',sans-serif" }}>
                  {debugging[p._id]?'Analysing…':'🤖 Debug & Analyse'}
                </button>
                <DebugPanel result={debugResult[p._id]} loading={debugging[p._id]} />
              </div>
            )}
          </div>
        );
      })}
      {!loading && filtered.length===0 && <div style={{ textAlign:'center', padding:40, color:'#b0bec9' }}>No problems found. Adjust filters.</div>}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function ProblemsPage() {
  const { user } = useAuth();
  const [daily, setDaily]     = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('today');
  const [solving, setSolving] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [msg, setMsg]         = useState('');

  // Platform selection popup — show once per day
  const todayKey = `pragati_platform_${new Date().toDateString()}`;
  const [showPlatformPopup, setShowPlatformPopup] = useState(() => !localStorage.getItem(todayKey));
  const [selectedPlatform, setSelectedPlatform] = useState(() => {
    const saved = localStorage.getItem(todayKey);
    return saved ? PLATFORMS.find(p => p.id === saved) || null : null;
  });

  function handlePlatformSelect(platform) {
    if (platform) {
      localStorage.setItem(todayKey, platform.id);
      setSelectedPlatform(platform);
      // If external platform chosen, open it in a new tab
      if (platform.url) window.open(platform.url, '_blank');
    } else {
      localStorage.setItem(todayKey, 'Custom');
      setSelectedPlatform(PLATFORMS.find(p => p.id === 'Custom'));
    }
    setShowPlatformPopup(false);
  }

  async function fetchData() {
    try {
      const [d, h] = await Promise.all([
        fetch(`${API}/problems/daily`, { headers:tk() }).then(r=>r.json()),
        fetch(`${API}/problems/history`, { headers:tk() }).then(r=>r.json()),
      ]);
      setDaily(d); setHistory(h.history||[]);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSolve(problemId, notes, code, rating) {
    setSolving(true); setMsg('');
    try {
      const res = await fetch(`${API}/problems/${problemId}/solve`, {
        method:'POST', headers:tks(), body:JSON.stringify({ approachNotes:notes, solutionCode:code, selfRating:rating })
      });
      const d = await res.json();
      if (!res.ok) { setMsg(d.error||'Error'); return; }
      setMsg(`🎉 Solved! Streak: ${d.streak} days 🔥`); fetchData();
    } catch(e){ setMsg('Error submitting'); } finally { setSolving(false); }
  }

  async function handleShuffle() {
    setShuffling(true); setMsg('');
    try {
      const res = await fetch(`${API}/problems/shuffle`, { method:'POST', headers:tk() });
      const d = await res.json();
      if (!res.ok) { setMsg(d.error||'Cannot shuffle'); return; }
      setMsg(`🔀 ${d.message}`); fetchData();
    } catch(e){ setMsg('Shuffle error'); } finally { setShuffling(false); }
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
      <div style={{ width:36, height:36, border:'3px solid #e8edf5', borderTopColor:'#531697', borderRadius:'50%', animation:'_ps .7s linear infinite' }} />
      <style>{`@keyframes _ps{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif" }}>
      {showPlatformPopup && <PlatformPopup onSelect={handlePlatformSelect} />}

      <div style={{ marginBottom:18 }}>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', color:'#0f1a2e' }}>💻 Coding Practice</h1>
        <p style={{ color:'#7a8ba8', marginTop:3 }}>Daily problem · Category-wise list · 🤖 AI Debugging Agent · Platform links</p>
      </div>

      {/* Today's platform banner */}
      {selectedPlatform && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderRadius:12, background:`${selectedPlatform.color}08`, border:`1.5px solid ${selectedPlatform.color}30`, marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'1.2rem' }}>{selectedPlatform.emoji}</span>
            <div>
              <div style={{ fontWeight:800, fontSize:'.85rem', color:selectedPlatform.color }}>Today's Platform: {selectedPlatform.name}</div>
              <div style={{ fontSize:'.7rem', color:'#7a8ba8' }}>{selectedPlatform.desc}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {selectedPlatform.url && (
              <a href={selectedPlatform.url} target="_blank" rel="noreferrer"
                style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${selectedPlatform.color}40`, background:`${selectedPlatform.color}10`, color:selectedPlatform.color, fontWeight:700, fontSize:'.75rem', textDecoration:'none' }}>
                Open {selectedPlatform.name} →
              </a>
            )}
            <button onClick={() => setShowPlatformPopup(true)}
              style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #d0d7e8', background:'transparent', color:'#7a8ba8', fontWeight:600, cursor:'pointer', fontSize:'.75rem', fontFamily:"'Nunito',sans-serif" }}>
              Change
            </button>
          </div>
        </div>
      )}

      {/* Streak banner */}
      <div style={{ background:'linear-gradient(135deg,#042c5d,#531697)', borderRadius:14, padding:'16px 22px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        {[['🔥','Streak',`${user?.streak||0} days`],['💻','Solved',`${user?.totalProblemsSolved||0}`],['⭐','Level',user?.skillLevel||'Beginner']].map(([ic,l,v])=>(
          <div key={l} style={{ textAlign:'center' }}>
            <div>{ic}</div>
            <div style={{ color:'rgba(255,255,255,.6)', fontSize:'.65rem', fontWeight:700 }}>{l}</div>
            <div style={{ color:'#fff', fontWeight:800 }}>{v}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{ marginBottom:14, padding:'10px 16px', background:msg.includes('🎉')||msg.includes('🔀')?'rgba(71,211,114,0.1)':'rgba(239,68,68,0.08)', border:`1px solid ${msg.includes('🎉')||msg.includes('🔀')?'rgba(71,211,114,0.3)':'rgba(239,68,68,0.2)'}`, borderRadius:10, fontWeight:700, color:msg.includes('🎉')||msg.includes('🔀')?'#166534':'#991b1b', fontSize:'.88rem' }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:5, marginBottom:16, borderBottom:'1px solid #e8edf5' }}>
        {[['today',"📅 Today's Problem"],['all','📋 All Problems'],['history',`📜 History (${history.length})`]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ padding:'8px 16px', borderRadius:'9px 9px 0 0', border:'none', borderBottom:tab===k?'2px solid #531697':'2px solid transparent', background:tab===k?'rgba(83,22,151,.06)':'transparent', color:tab===k?'#531697':'#7a8ba8', fontWeight:700, cursor:'pointer', fontSize:'.83rem', fontFamily:"'Nunito',sans-serif" }}>
            {l}
          </button>
        ))}
      </div>

      {tab==='today' && (
        <>
          {daily?.problem ? (
            <ProblemCard problem={daily.problem} userProblem={daily.userProblem} onSolve={handleSolve} onShuffle={handleShuffle} solving={solving} shuffling={shuffling} />
          ) : (
            <div style={{ textAlign:'center', padding:'60px 0', color:'#b0bec9' }}>
              <div style={{ fontSize:'3rem', marginBottom:10 }}>💻</div>
              <div style={{ fontWeight:700 }}>{daily?.message||'No problem assigned yet'}</div>
              <div style={{ fontSize:'.8rem', marginTop:6 }}>Ask admin to add problems for your level</div>
            </div>
          )}
          <div style={{ marginTop:14, padding:'12px 16px', background:'rgba(83,22,151,0.05)', border:'1px solid rgba(83,22,151,0.1)', borderRadius:10, fontSize:'.78rem', color:'#531697', fontWeight:600 }}>
            💡 Open the problem on {daily?.problem?.source||'LeetCode'} → solve it → paste your code → click <strong>🤖 Debug &amp; Analyse</strong> to check for issues → then submit to earn streak!
          </div>
        </>
      )}

      {tab==='all' && <AllProblemsTab />}

      {tab==='history' && (
        <div className="card" style={{ padding:'16px 22px' }}>
          {history.length===0 ? (
            <div style={{ padding:'40px 0', textAlign:'center', color:'#b0bec9' }}>No solutions yet — solve today's problem!</div>
          ) : history.map(h => <HistoryCard key={h._id} item={h} />)}
        </div>
      )}
    </div>
  );
}
