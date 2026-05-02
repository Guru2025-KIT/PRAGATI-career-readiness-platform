import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tk = () => ({ Authorization: `Bearer ${localStorage.getItem('pragati_token')}` });
const apiFetch = p => fetch(`${API}${p}`, { headers: tk() }).then(r => r.json()).catch(() => null);

function Stat({ icon, label, value, sub, grad, onClick }) {
  return (
    <div onClick={onClick} className="card" style={{ padding:'18px 16px', cursor:onClick?'pointer':'default', position:'relative', overflow:'hidden', transition:'transform .2s' }}
      onMouseOver={e=>onClick&&(e.currentTarget.style.transform='translateY(-3px)')}
      onMouseOut={e=>(e.currentTarget.style.transform='none')}>
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:grad, opacity:.1 }}/>
      <div style={{ fontSize:'1.3rem', marginBottom:6 }}>{icon}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', background:grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', lineHeight:1 }}>{value??'—'}</div>
      <div style={{ fontSize:'.78rem', fontWeight:700, color:'#3d4e6b', marginTop:4 }}>{label}</div>
      {sub&&<div style={{ fontSize:'.68rem', color:'#b0bec9', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

/* ── Edit Profile Modal ─────────────────────────────────────────────────── */
function EditProfileModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user?.name||'', department: user?.department||'', year: user?.year||'',
    rollNumber: user?.rollNumber||'', phone: user?.phone||'', bio: user?.bio||'',
    linkedinUrl: user?.linkedinUrl||'', githubUrl: user?.githubUrl||'', portfolioUrl: user?.portfolioUrl||'',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const INP = { style:{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.875rem', outline:'none', background:'#fafbff', boxSizing:'border-box' } };
  const LBL = ({ children }) => <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#3d4e6b', marginBottom:4, fontFamily:"'Syne',sans-serif" }}>{children}</label>;

  async function save(e) {
    e.preventDefault(); setLoading(true); setMsg('');
    try {
      const res = await fetch(`${API}/users/profile`, { method:'PUT', headers:{ ...tk(), 'Content-Type':'application/json' }, body:JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error||'Failed');
      setMsg('✅ Profile updated!');
      if (onSaved) onSaved(d.user);
      setTimeout(onClose, 1200);
    } catch(err){ setMsg(`❌ ${err.message}`); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(4,44,93,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:'24px 28px', maxWidth:560, width:'100%', maxHeight:'88vh', overflowY:'auto', boxShadow:'0 20px 80px rgba(4,44,93,0.25)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.1rem', color:'#0f1a2e' }}>✏️ Edit Profile</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'1px solid #e8edf5', background:'#f8f9fc', cursor:'pointer', fontWeight:800, color:'#7a8ba8', fontSize:'1rem' }}>×</button>
        </div>

        {/* Avatar */}
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#531697,#13a1a5)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', color:'#fff', fontFamily:"'Syne',sans-serif", fontWeight:800 }}>
            {user?.name?.[0]?.toUpperCase()||'U'}
          </div>
          <div style={{ marginTop:6, fontSize:'.78rem', color:'#7a8ba8' }}>{user?.email}</div>
          <div style={{ marginTop:2 }}>
            <span style={{ padding:'2px 10px', borderRadius:999, background:'rgba(83,22,151,.08)', color:'#531697', fontSize:'.7rem', fontWeight:700 }}>{user?.role?.toUpperCase()}</span>
          </div>
        </div>

        <form onSubmit={save}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div style={{ gridColumn:'1/-1' }}><LBL>Full Name</LBL><input {...INP} value={form.name} onChange={set('name')} placeholder="Your full name" /></div>
            <div><LBL>Department</LBL>
              <select {...INP} value={form.department} onChange={set('department')}>
                {['CSE','CSAIML','IT','ECE','Mechanical','Civil','Other'].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            {user?.role === 'student' && (
              <div><LBL>Year</LBL>
                <select {...INP} value={form.year} onChange={set('year')}>
                  {[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            )}
            {user?.role === 'student' && (
              <div><LBL>Roll Number</LBL><input {...INP} value={form.rollNumber} onChange={set('rollNumber')} placeholder="e.g. 22CS101" /></div>
            )}
            <div><LBL>Phone</LBL><input {...INP} value={form.phone} onChange={set('phone')} placeholder="+91 XXXXXXXXXX" /></div>
            <div style={{ gridColumn:'1/-1' }}><LBL>Bio</LBL><textarea {...INP} style={{ ...INP.style, resize:'vertical', height:64 }} value={form.bio} onChange={set('bio')} placeholder="A short bio about yourself…" /></div>
            <div style={{ gridColumn:'1/-1' }}><LBL>LinkedIn URL</LBL><input {...INP} type="url" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/username" /></div>
            <div><LBL>GitHub URL</LBL><input {...INP} type="url" value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/username" /></div>
            <div><LBL>Portfolio URL</LBL><input {...INP} type="url" value={form.portfolioUrl} onChange={set('portfolioUrl')} placeholder="https://yourportfolio.com" /></div>
          </div>
          {msg && <div style={{ marginBottom:12, padding:'9px 14px', borderRadius:8, fontSize:'.83rem', fontWeight:600, background:msg.startsWith('✅')?'#dcfce7':'#fee2e2', color:msg.startsWith('✅')?'#166534':'#991b1b' }}>{msg}</div>}
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', background:loading?'#d0d7e8':'linear-gradient(135deg,#531697,#13a1a5)', color:'#fff', fontWeight:800, fontSize:'.9rem', cursor:loading?'not-allowed':'pointer', fontFamily:"'Nunito',sans-serif" }}>
            {loading?'Saving…':'💾 Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Full Leaderboard Modal (with branch/year/roll filters + My Rank) ─────── */
function LeaderboardModal({ onClose, myId }) {
  const [all, setAll]           = useState([]);
  const [search, setSearch]     = useState('');
  const [filterBranch, setFBranch] = useState('All');
  const [filterYear, setFYear]  = useState('All');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading]   = useState(true);
  const lc = { Beginner:'#f59e0b', Intermediate:'#531697', Expert:'#47d372' };

  useEffect(() => {
    apiFetch('/analytics/leaderboard?limit=200').then(d => { setAll(d?.leaderboard||[]); setLoading(false); });
  }, []);

  async function viewProfile(s) {
    setSelectedProfile(s); setProfileData(null);
    const d = await apiFetch(`/analytics/student-profile/${s._id}`);
    setProfileData(d);
  }

  // All unique branches and years
  const branches = ['All', ...new Set(all.map(s=>s.department).filter(Boolean))].sort();
  const years    = ['All','1','2','3','4'];

  // Apply filters
  const filtered = all.filter(s => {
    const matchSearch = !search.trim() || s.name?.toLowerCase().includes(search.toLowerCase()) || s.rollNumber?.toLowerCase().includes(search.toLowerCase());
    const matchBranch = filterBranch === 'All' || s.department === filterBranch;
    const matchYear   = filterYear === 'All' || String(s.year) === filterYear;
    return matchSearch && matchBranch && matchYear;
  });

  // My rank in filtered list
  const myRankFiltered = filtered.findIndex(s => s._id === myId);
  const myData = all.find(s => s._id === myId);
  const myRankGlobal = all.findIndex(s => s._id === myId);

  const medals = ['🥇','🥈','🥉'];

  const SS = { padding:'7px 10px', borderRadius:8, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.78rem', fontWeight:700, color:'#3d4e6b', background:'#fff', cursor:'pointer' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(4,44,93,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, padding:'24px 28px', maxWidth:720, width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 80px rgba(4,44,93,0.25)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.1rem', color:'#0f1a2e' }}>🏆 Leaderboard</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'1px solid #e8edf5', background:'#f8f9fc', cursor:'pointer', fontWeight:800, color:'#7a8ba8', fontSize:'1rem' }}>×</button>
        </div>

        {selectedProfile ? (
          <div>
            <button onClick={()=>{setSelectedProfile(null);setProfileData(null);}} style={{ marginBottom:12, padding:'6px 14px', borderRadius:8, border:'1px solid #d0d7e8', background:'transparent', color:'#7a8ba8', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.8rem' }}>← Back to Leaderboard</button>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
              {[['ATS',selectedProfile.atsScore||0,'#531697'],['Streak',`${selectedProfile.streak||0}d`,'#f59e0b'],['Solved',selectedProfile.totalProblemsSolved||0,'#13a1a5'],['Level',selectedProfile.skillLevel||'—','#47d372']].map(([l,v,c])=>(
                <div key={l} style={{ textAlign:'center', padding:'10px 6px', background:'#f8f9fc', borderRadius:10 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', color:c }}>{v}</div>
                  <div style={{ fontSize:'.65rem', color:'#b0bec9', fontWeight:700 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1rem', color:'#0f1a2e', marginBottom:4 }}>{selectedProfile.name}</div>
            <div style={{ fontSize:'.78rem', color:'#7a8ba8', marginBottom:12 }}>{selectedProfile.department} · Year {selectedProfile.year} · {selectedProfile.rollNumber||'No roll no.'}</div>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              {selectedProfile.linkedinUrl && <a href={selectedProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ padding:'5px 12px', borderRadius:8, background:'rgba(83,22,151,.08)', color:'#531697', fontWeight:700, fontSize:'.75rem', textDecoration:'none' }}>💼 LinkedIn</a>}
              {selectedProfile.githubUrl && <a href={selectedProfile.githubUrl} target="_blank" rel="noopener noreferrer" style={{ padding:'5px 12px', borderRadius:8, background:'rgba(83,22,151,.08)', color:'#531697', fontWeight:700, fontSize:'.75rem', textDecoration:'none' }}>🐙 GitHub</a>}
              {selectedProfile.portfolioUrl && <a href={selectedProfile.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ padding:'5px 12px', borderRadius:8, background:'rgba(83,22,151,.08)', color:'#531697', fontWeight:700, fontSize:'.75rem', textDecoration:'none' }}>🌐 Portfolio</a>}
            </div>
            {!profileData && <div style={{ textAlign:'center', padding:20, color:'#b0bec9' }}>Loading profile…</div>}
            {profileData?.aptStats?.map(s => {
              const pct = Math.round(s.accuracy||0);
              const c = pct>=70?'#47d372':pct>=45?'#f59e0b':'#ef4444';
              return <div key={s.topic} style={{ marginBottom:7 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.73rem', fontWeight:700, color:'#3d4e6b', marginBottom:2 }}><span>{s.topic}</span><span style={{ color:c }}>{pct}%</span></div>
                <div style={{ height:5, background:'#f0f3fa', borderRadius:999 }}><div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${c},#13a1a5)`, borderRadius:999 }}/></div>
              </div>;
            })}
          </div>
        ) : (
          <>
            {/* My Rank Banner */}
            {myData && (
              <div style={{ padding:'12px 16px', background:'linear-gradient(135deg,rgba(83,22,151,0.07),rgba(19,161,165,0.07))', border:'1.5px solid rgba(83,22,151,0.15)', borderRadius:12, marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ fontSize:'1.6rem' }}>{myRankGlobal<3?medals[myRankGlobal]:'🎯'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:'.88rem', color:'#0f1a2e' }}>Your Rank: <span style={{ color:'#531697' }}>#{myRankGlobal+1}</span> globally</div>
                  <div style={{ fontSize:'.72rem', color:'#7a8ba8', marginTop:2 }}>{myData.department} · Year {myData.year} · Score: <span style={{ color:'#531697', fontWeight:800 }}>{myData.totalScore}</span> · 🔥{myData.streak}d streak</div>
                </div>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.4rem', background:'linear-gradient(135deg,#531697,#13a1a5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{myData.totalScore}</div>
                  <div style={{ fontSize:'.6rem', color:'#b0bec9', textAlign:'center' }}>pts</div>
                </div>
              </div>
            )}

            {/* Search + Filters */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by name or roll number…"
                style={{ flex:1, minWidth:160, padding:'8px 12px', borderRadius:9, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.82rem', outline:'none' }} />
              <select style={SS} value={filterBranch} onChange={e=>setFBranch(e.target.value)}>
                {branches.map(b => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
              </select>
              <select style={SS} value={filterYear} onChange={e=>setFYear(e.target.value)}>
                {years.map(y => <option key={y} value={y}>{y === 'All' ? 'All Years' : `Year ${y}`}</option>)}
              </select>
            </div>

            {/* Filter summary */}
            <div style={{ fontSize:'.7rem', color:'#b0bec9', marginBottom:10 }}>
              Showing {filtered.length} of {all.length} students
              {myRankFiltered >= 0 && filterBranch !== 'All' || filterYear !== 'All' ? ` · Your rank in this filter: #${myRankFiltered+1}` : ''}
            </div>

            {loading ? <div style={{ textAlign:'center', padding:24, color:'#b0bec9' }}>Loading leaderboard…</div> :
              filtered.map((s,i) => {
                const globalIdx = all.indexOf(s);
                const isMe = s._id === myId;
                return (
                  <div key={s._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, marginBottom:6, background:isMe?'rgba(83,22,151,0.06)':'#fafbff', border:isMe?'1.5px solid rgba(83,22,151,0.2)':'1px solid #f0f3fa' }}>
                    <div style={{ width:28, textAlign:'center', fontSize:globalIdx<3?'1.1rem':'.82rem', fontWeight:800, color:'#7a8ba8', flexShrink:0 }}>{medals[globalIdx]||`#${globalIdx+1}`}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:'.85rem', color:'#0f1a2e' }}>{s.name} {isMe&&<span style={{ color:'#531697', fontSize:'.7rem' }}>(you)</span>}</div>
                      <div style={{ fontSize:'.68rem', color:'#b0bec9' }}>{s.department} · Y{s.year} {s.rollNumber?`· ${s.rollNumber}`:''} · <span style={{ color:lc[s.skillLevel]||'#531697' }}>{s.skillLevel}</span> · 🔥{s.streak}d</div>
                    </div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', background:'linear-gradient(135deg,#531697,#13a1a5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', flexShrink:0, marginRight:8 }}>{s.totalScore}</div>
                    <button onClick={()=>viewProfile(s)} style={{ padding:'4px 10px', borderRadius:7, border:'1px solid rgba(83,22,151,.2)', background:'rgba(83,22,151,.06)', color:'#531697', fontWeight:700, cursor:'pointer', fontSize:'.7rem', fontFamily:"'Nunito',sans-serif", whiteSpace:'nowrap' }}>View →</button>
                  </div>
                );
              })
            }
            {!loading && filtered.length === 0 && <div style={{ textAlign:'center', padding:30, color:'#b0bec9' }}>No students match this filter.</div>}
          </>
        )}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function StudentDash() {
  const { user:ctxUser, setUser } = useAuth();
  const nav = useNavigate();

  // ALL hooks declared at top unconditionally
  const [data, setData]         = useState(null);
  const [companies, setCompanies] = useState([]);
  const [history, setHistory]   = useState([]);
  const [batchData, setBatch]   = useState(null);
  const [compReadiness, setCompReadiness] = useState([]);
  const [ipResult, setIpResult] = useState(null);
  const [ipLoading, setIpLoading] = useState(false);
  const [ipError, setIpError]   = useState('');
  const [ipAnswer, setIpAnswer] = useState('');
  const [ipQIdx, setIpQIdx]     = useState(0);
  const [showIP, setShowIP]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(null);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [lbSearch, setLbSearch] = useState('');
  const [showFullLb, setShowFullLb] = useState(false);
  const [fullLeaderboard, setFullLeaderboard] = useState([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const load = useCallback(async () => {
    const [dash, me, co, hist, batch, cr, lb, ann] = await Promise.all([
      apiFetch('/analytics/dashboard'),
      apiFetch('/auth/me'),
      apiFetch('/companies'),
      apiFetch('/skillpath/history'),
      apiFetch('/analytics/batch-percentile'),
      apiFetch('/analytics/company-readiness'),
      apiFetch('/analytics/leaderboard?limit=10'),
      apiFetch('/announcements'),
    ]);
    setData(dash || {});
    if (me?.user && setUser) setUser(me.user);
    setCompanies(co?.companies || []);
    setHistory(hist?.results || []);
    if (batch) setBatch(batch);
    if (cr?.results) setCompReadiness(cr.results);
    if (lb?.leaderboard) setLeaderboard(lb.leaderboard);
    if (ann?.announcements) setAnnouncements(ann.announcements);
    setLoading(false);
  }, [setUser]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh company readiness when the browser tab regains focus
  // (catches cases where user did a SkillPath analysis and switched back)
  useEffect(() => {
    async function refreshOnFocus() {
      try {
        const cr = await apiFetch('/analytics/company-readiness');
        if (cr?.results) setCompReadiness(cr.results);
      } catch {}
    }
    window.addEventListener('focus', refreshOnFocus);
    return () => window.removeEventListener('focus', refreshOnFocus);
  }, []);

  const user   = data?.user || ctxUser || {};
  const ats    = user?.atsScore || 0;
  const lvl    = user?.skillLevel || 'Beginner';
  const streak = user?.streak || 0;
  const solved = user?.totalProblemsSolved || data?.problems?.solved || 0;
  const result = data?.latestAnalysis;
  const lc     = { Beginner:'#f59e0b', Intermediate:'#531697', Expert:'#47d372' };

  // Consistency fix: ATS-based confidence label
  const confidenceLabel = ats >= 70 ? 'Apply with confidence! ✅' : ats >= 50 ? 'Needs improvement ⚠️' : 'Build skills first 📚';
  const confidenceColor = ats >= 70 ? '#166534' : ats >= 50 ? '#92400e' : '#991b1b';

  async function loadFullLeaderboard() {
    const d = await apiFetch('/analytics/leaderboard?limit=100');
    if (d?.leaderboard) setFullLeaderboard(d.leaderboard);
    setShowFullLb(true);
  }

  function openProfile() {
    const u = data?.user || ctxUser || {};
    setProfileForm({
      name: u.name || '',
      email: u.email || '',
      department: u.department || '',
      year: u.year || '',
      rollNumber: u.rollNumber || '',
      linkedinUrl: u.linkedinUrl || '',
      githubUrl: u.githubUrl || '',
      portfolioUrl: u.portfolioUrl || '',
      bio: u.bio || '',
    });
    setProfileMsg('');
    setShowProfile(true);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setProfileSaving(true); setProfileMsg('');
    try {
      const res = await fetch(`${API}/users/profile`, {
        method: 'PUT',
        headers: { ...tk(), 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Save failed');
      if (d.user && setUser) setUser(d.user);
      setProfileMsg('✅ Profile updated!');
      setTimeout(() => setShowProfile(false), 1200);
    } catch(err) { setProfileMsg(`❌ ${err.message}`); }
    finally { setProfileSaving(false); }
  }

  async function runInterviewPrep() {
    setIpLoading(true); setIpError(''); setIpQIdx(0);
    try {
      const payload = {
        candidateName: user?.name,
        targetRole: result?.jobTitle || 'Software Engineer',
        skillGaps: result?.skillGapAnalysis?.missingSkills?.map(s=>({ skill:s, importance:'important' })) || [],
        strengths: result?.skillGapAnalysis?.matchedSkills || [],
        readinessScore: ats,
      };
      const res = await fetch(`${API}/skillpath/interview-prep`, {
        method:'POST', headers:{ ...tk(), 'Content-Type':'application/json' }, body:JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('API error');
      const d = await res.json();
      setIpResult(d);
    } catch(e){ setIpError('Could not connect to AI service. Check that GEMINI_API_KEY is set and the backend is running.'); }
    finally { setIpLoading(false); }
  }

  async function submitAnswer() {
    if (!ipAnswer.trim()) return;
    const allQs = [
      ...(ipResult?.technical_questions||[]).map(q=>({ ...q, type:'technical' })),
      ...(ipResult?.behavioral_questions||[]).map(q=>({ ...q, type:'behavioral' })),
    ];
    const next = allQs[ipQIdx + 1];
    try {
      const res = await fetch(`${API}/skillpath/interview-feedback`, {
        method:'POST', headers:{ ...tk(), 'Content-Type':'application/json' },
        body:JSON.stringify({ question: allQs[ipQIdx]?.question, answer: ipAnswer,
          nextQuestion: next?.question, candidateName: user?.name, targetRole: result?.jobTitle })
      });
      const d = await res.json();
      setIpResult(r => ({ ...r, _feedback: d.feedback }));
      setIpAnswer('');
      if (next) setIpQIdx(i => i+1);
    } catch(e){}
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
      <div style={{ width:36, height:36, border:'3px solid #e8edf5', borderTopColor:'#531697', borderRadius:'50%', animation:'_s .7s linear infinite' }}/>
      <style>{`@keyframes _s{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const allIpQs = ipResult ? [
    ...(ipResult.technical_questions||[]).map(q=>({ ...q, type:'💻 Technical' })),
    ...(ipResult.behavioral_questions||[]).map(q=>({ ...q, type:'🤝 Behavioural' })),
    ...(ipResult.gap_questions||[]).map(q=>({ ...q, type:'⚠️ Gap Question' })),
  ] : [];
  const currentQ = allIpQs[ipQIdx];

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif" }}>
      {showEditProfile && <EditProfileModal user={user} onClose={()=>setShowEditProfile(false)} onSaved={u=>{ if(setUser) setUser(u); load(); }} />}
      {showLeaderboard && <LeaderboardModal onClose={()=>setShowLeaderboard(false)} myId={data?.user?._id||ctxUser?._id} />}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', color:'#0f1a2e' }}>Hello, {user?.name?.split(' ')[0]||'Student'} 👋</h1>
          <p style={{ color:'#7a8ba8', marginTop:3 }}>Your placement readiness at a glance.</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setShowLeaderboard(true)} style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid rgba(83,22,151,.25)', background:'rgba(83,22,151,.06)', color:'#531697', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.82rem', display:'flex', alignItems:'center', gap:6 }}>
            🏆 My Leaderboard
          </button>
          <button onClick={()=>setShowEditProfile(true)} style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid rgba(83,22,151,.25)', background:'rgba(83,22,151,.06)', color:'#531697', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.82rem', display:'flex', alignItems:'center', gap:6 }}>
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* ── TOP: Announcements + Leaderboard Top 3 ─────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        {/* Announcements */}
        {announcements.length > 0 ? (
          <div className="card" style={{ padding:'16px 18px' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', color:'#0f1a2e', marginBottom:10 }}>📢 Announcements</div>
            {announcements.slice(0,3).map(a => {
              const pc = { urgent:'#ef4444', high:'#f59e0b', normal:'#531697' };
              const bg = { urgent:'rgba(239,68,68,0.06)', high:'rgba(245,158,11,0.06)', normal:'rgba(83,22,151,0.04)' };
              return (
                <div key={a._id} style={{ padding:'9px 12px', borderRadius:8, marginBottom:6, border:`1px solid ${(pc[a.priority||'normal'])}25`, background:bg[a.priority||'normal'] }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                    <span style={{ fontWeight:800, fontSize:'.83rem', color:'#0f1a2e' }}>{a.title}</span>
                    {a.priority && a.priority!=='normal' && <span style={{ padding:'1px 5px', borderRadius:999, background:`${pc[a.priority]}15`, color:pc[a.priority], fontSize:'.6rem', fontWeight:700 }}>{a.priority.toUpperCase()}</span>}
                  </div>
                  <div style={{ fontSize:'.77rem', color:'#3d4e6b', lineHeight:1.5 }}>{a.message}</div>
                  {a.link && <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ fontSize:'.72rem', color:'#531697', fontWeight:700, marginTop:3, display:'inline-block' }}>🔗 View Link →</a>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ textAlign:'center', color:'#b0bec9', fontSize:'.82rem' }}>📢 No announcements yet</div>
          </div>
        )}

        {/* Leaderboard Top 3 */}
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', color:'#0f1a2e' }}>🏆 Top 3 Leaderboard</div>
            <button onClick={()=>setShowLeaderboard(true)} style={{ padding:'4px 10px', borderRadius:7, border:'1px solid rgba(83,22,151,.2)', background:'rgba(83,22,151,.06)', color:'#531697', fontWeight:700, fontSize:'.7rem', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>View All →</button>
          </div>
          {leaderboard.slice(0,3).map((s,i) => {
            const medals = ['🥇','🥈','🥉'];
            const isMe = s._id === (data?.user?._id || ctxUser?._id);
            return (
              <div key={s._id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:9, marginBottom:5, background:isMe?'rgba(83,22,151,0.06)':'#fafbff', border:isMe?'1.5px solid rgba(83,22,151,0.2)':'1px solid #f0f3fa' }}>
                <div style={{ fontSize:'1.2rem', flexShrink:0 }}>{medals[i]}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'.83rem', color:'#0f1a2e' }}>{s.name} {isMe&&<span style={{ color:'#531697', fontSize:'.68rem' }}>(you)</span>}</div>
                  <div style={{ fontSize:'.67rem', color:'#b0bec9' }}>{s.department} · 🔥{s.streak}d</div>
                </div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.9rem', background:'linear-gradient(135deg,#531697,#13a1a5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{s.totalScore}</div>
              </div>
            );
          })}
          {leaderboard.length === 0 && <div style={{ textAlign:'center', padding:'12px 0', color:'#b0bec9', fontSize:'.8rem' }}>No data yet</div>}
        </div>
      </div>

      {!user?.resumeUrl && (
        <div onClick={()=>nav('/dashboard/skillpath')} style={{ background:'rgba(83,22,151,0.05)', border:'1.5px solid rgba(83,22,151,.15)', borderRadius:12, padding:'12px 16px', marginBottom:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:800, color:'#531697', fontSize:'.88rem' }}>📄 Upload resume to unlock SkillPath AI →</div>
            <div style={{ fontSize:'.74rem', color:'#7a8ba8', marginTop:2 }}>Get ATS score, skill gaps, and personalised learning pathway</div>
          </div>
          <span style={{ color:'#531697', fontWeight:800 }}>Upload →</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        <Stat icon="🔥" label="Day Streak" value={streak} sub="Keep going!" grad="linear-gradient(135deg,#f59e0b,#ef4444)"/>
        <Stat icon="💻" label="Solved" value={solved} sub="Total problems" grad="linear-gradient(135deg,#531697,#13a1a5)" onClick={()=>nav('/dashboard/problems')}/>
        <Stat icon="📊" label="ATS Score" value={ats?`${ats}/100`:'—'} sub={ats?confidenceLabel:'Upload resume'} grad="linear-gradient(135deg,#042c5d,#531697)" onClick={()=>nav('/dashboard/skillpath')}/>
        <Stat icon="⭐" label="Skill Level" value={lvl} sub="From analysis" grad={`linear-gradient(135deg,${lc[lvl]||'#531697'},#13a1a5)`}/>
      </div>

      {/* Row 2: Quick actions + SkillPath */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:10, color:'#0f1a2e' }}>⚡ Quick Actions</div>
          {[
            { icon:'💻', label:"Today's coding problem", to:'/dashboard/problems', g:'linear-gradient(135deg,#531697,#13a1a5)' },
            { icon:'🧠', label:'SkillPath AI Analysis', to:'/dashboard/skillpath', g:'linear-gradient(135deg,#042c5d,#531697)' },
            { icon:'🏢', label:'Browse companies', to:'/dashboard/companies', g:'linear-gradient(135deg,#13a1a5,#47d372)' },
            { icon:'🎯', label:'Aptitude quiz', to:'/dashboard/aptitude', g:'linear-gradient(135deg,#3b82f6,#531697)' },
            { icon:'📚', label:'Faculty notes', to:'/dashboard/notes', g:'linear-gradient(135deg,#f59e0b,#ef4444)' },
          ].map(a=>(
            <button key={a.to} onClick={()=>nav(a.to)} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:9, border:'1px solid #e8edf5', background:'#fafbff', cursor:'pointer', marginBottom:5, textAlign:'left', transition:'all .15s' }}
              onMouseOver={e=>{e.currentTarget.style.borderColor='rgba(83,22,151,.25)'; e.currentTarget.style.background='rgba(83,22,151,.02)'}}
              onMouseOut={e=>{e.currentTarget.style.borderColor='#e8edf5'; e.currentTarget.style.background='#fafbff'}}>
              <div style={{ width:28, height:28, borderRadius:7, background:a.g, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.82rem', flexShrink:0 }}>{a.icon}</div>
              <span style={{ fontSize:'.8rem', fontWeight:700, color:'#0f1a2e', flex:1 }}>{a.label}</span>
              <span style={{ color:'#d0d7e8' }}>→</span>
            </button>
          ))}
        </div>

        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:10, color:'#0f1a2e' }}>🧠 Latest SkillPath</div>
          {result ? (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginBottom:10 }}>
                {[['ATS',`${result.atsScore}/100`,'#531697'],['Eligibility',`${result.eligibilityPercent}%`,'#13a1a5'],['Level',result.proficiencyLevel,'#042c5d'],['Skills',result.parsedSkills?.length||0,'#47d372']].map(([l,v,c])=>(
                  <div key={l} style={{ padding:'8px 10px', background:'#f8f9fc', borderRadius:8 }}>
                    <div style={{ fontSize:'.6rem', color:'#b0bec9', fontWeight:700 }}>{l}</div>
                    <div style={{ fontWeight:800, color:c, fontSize:'.9rem', marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
              {/* Consistent label — based on actual ATS */}
              <div style={{ padding:'8px 12px', borderRadius:8, background:`${ats>=70?'rgba(71,211,114,0.08)':ats>=50?'rgba(245,158,11,0.08)':'rgba(239,68,68,0.06)'}`, marginBottom:10 }}>
                <div style={{ fontSize:'.78rem', fontWeight:700, color:confidenceColor }}>{confidenceLabel}</div>
                <div style={{ fontSize:'.7rem', color:'#7a8ba8', marginTop:2 }}>ATS {ats}/100 · {result.skillGapAnalysis?.missingSkills?.length||0} skill gaps to close</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={()=>nav('/dashboard/skillpath')} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#531697,#13a1a5)', color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.78rem' }}>New Analysis →</button>
                <button onClick={()=>{setShowIP(s=>!s); if(!ipResult) runInterviewPrep();}} style={{ flex:1, padding:'8px', borderRadius:8, border:`1.5px solid ${showIP?'#531697':'#d0d7e8'}`, background:showIP?'rgba(83,22,151,.06)':'transparent', color:'#531697', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.78rem' }}>🎤 Interview Prep</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ fontSize:'2rem', marginBottom:8 }}>🧠</div>
              <div style={{ fontSize:'.8rem', color:'#b0bec9', marginBottom:10 }}>No analysis yet</div>
              <button onClick={()=>nav('/dashboard/skillpath')} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#531697,#13a1a5)', color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.82rem' }}>Start Now →</button>
            </div>
          )}
        </div>
      </div>

      {/* Interview Prep Panel */}
      {showIP && (
        <div className="card" style={{ padding:'20px 22px', marginBottom:12, border:'1.5px solid rgba(83,22,151,.15)' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', marginBottom:12, color:'#0f1a2e', display:'flex', alignItems:'center', gap:8 }}>
            🎤 AI Interview Prep
            <span style={{ padding:'2px 8px', borderRadius:999, background:'rgba(83,22,151,.08)', color:'#531697', fontSize:'.68rem', fontWeight:700 }}>Gemini 2.0 Flash</span>
          </div>
          {ipLoading && <div style={{ textAlign:'center', padding:20, color:'#7a8ba8' }}>⏳ Generating your personalised prep guide…</div>}
          {ipError && (
            <div style={{ padding:'10px 14px', background:'#fee2e2', borderRadius:8, fontSize:'.82rem', color:'#991b1b', fontWeight:600, marginBottom:12 }}>
              {ipError}
              <div style={{ marginTop:6, fontSize:'.72rem', color:'#7a8ba8' }}>
                Check: Open <code>http://localhost:5000/api/skillpath/gemini-status</code> in browser to diagnose Gemini connectivity.
              </div>
            </div>
          )}
          {ipResult && !ipLoading && (
            <div>
              {/* Coaching summary */}
              <div style={{ padding:'12px 14px', background:'rgba(83,22,151,.04)', borderRadius:10, marginBottom:14, fontSize:'.83rem', color:'#3d4e6b', lineHeight:1.65 }}>
                💬 <strong>Coach:</strong> {ipResult.coaching_summary}
              </div>

              {/* Interactive Q&A */}
              {currentQ && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ padding:'2px 8px', borderRadius:999, background:'rgba(83,22,151,.08)', color:'#531697', fontSize:'.7rem', fontWeight:700 }}>{currentQ.type}</span>
                    <span style={{ fontSize:'.73rem', color:'#b0bec9' }}>Q {ipQIdx+1} of {allIpQs.length}</span>
                  </div>
                  <div style={{ fontWeight:700, fontSize:'.9rem', color:'#0f1a2e', marginBottom:10, lineHeight:1.5 }}>{currentQ.question}</div>
                  {currentQ.tip && <div style={{ fontSize:'.75rem', color:'#7a8ba8', marginBottom:10, fontStyle:'italic' }}>💡 Tip: {currentQ.tip}</div>}

                  {/* Voice + text answer */}
                  <div style={{ position:'relative' }}>
                    <textarea value={ipAnswer} onChange={e=>setIpAnswer(e.target.value)} rows={4}
                      placeholder="Type your answer here, or use the 🎙️ voice button…"
                      style={{ width:'100%', padding:'10px 50px 10px 12px', borderRadius:10, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.875rem', resize:'vertical', outline:'none' }}/>
                    <button type="button" onClick={()=>{
                      if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){alert('Voice requires Chrome');return;}
                      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
                      const rec=new SR(); rec.lang='en-IN'; rec.interimResults=false;
                      rec.onresult=e=>setIpAnswer(a=>a+' '+e.results[0][0].transcript);
                      rec.start();
                    }} style={{ position:'absolute', right:10, top:10, width:32, height:32, borderRadius:'50%', border:'none', background:'linear-gradient(135deg,#531697,#13a1a5)', color:'#fff', cursor:'pointer', fontSize:'.85rem', display:'flex', alignItems:'center', justifyContent:'center' }}>🎙️</button>
                  </div>

                  {ipResult._feedback && (
                    <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(71,211,114,.06)', border:'1px solid rgba(71,211,114,.2)', borderRadius:8, fontSize:'.82rem', color:'#166534', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{ipResult._feedback}</div>
                  )}
                  <button onClick={submitAnswer} disabled={!ipAnswer.trim()}
                    style={{ marginTop:10, padding:'9px 20px', borderRadius:9, border:'none', background:ipAnswer.trim()?'linear-gradient(135deg,#531697,#13a1a5)':'#d0d7e8', color:'#fff', fontWeight:800, cursor:ipAnswer.trim()?'pointer':'not-allowed', fontFamily:"'Nunito',sans-serif", fontSize:'.82rem' }}>
                    Submit & Get Feedback →
                  </button>
                </div>
              )}

              {/* Quick wins */}
              {ipResult.quick_wins?.length > 0 && (
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.8rem', color:'#3d4e6b', marginBottom:8 }}>⚡ QUICK WINS</div>
                  {ipResult.quick_wins.map((w,i)=>(
                    <div key={i} style={{ display:'flex', gap:6, alignItems:'flex-start', marginBottom:5 }}>
                      <span style={{ color:'#47d372', fontWeight:800, flexShrink:0 }}>✓</span>
                      <span style={{ fontSize:'.78rem', color:'#3d4e6b' }}>{w}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={runInterviewPrep} style={{ marginTop:12, padding:'7px 16px', borderRadius:8, border:'1.5px solid #d0d7e8', background:'transparent', color:'#531697', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.78rem' }}>🔄 Regenerate</button>
            </div>
          )}
        </div>
      )}

      {/* ATS + Batch row */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12, marginBottom:12 }}>
        {/* ATS history */}
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:10, color:'#0f1a2e' }}>📈 ATS Score History</div>
          {history.length > 0 ? (() => {
            const sorted = [...history].sort((a,b)=>new Date(a.analyzedAt||a.createdAt)-new Date(b.analyzedAt||b.createdAt));
            const vals = sorted.map(h=>h.atsScore||0);
            const maxV = Math.max(...vals, 1);
            const W=280, H=60, pad=8;
            const pts = vals.map((v,i)=>({ x:pad+(vals.length===1?W-pad*2:(i/(vals.length-1))*(W-pad*2)), y:H-pad-((v/maxV)*(H-pad*2)) }));
            const path = pts.map((p,i)=>`${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
            const latest = vals[vals.length-1];
            const prev   = vals.length>1?vals[vals.length-2]:null;
            return (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:'.72rem', color:'#7a8ba8' }}>{vals.length} {vals.length===1?'analysis':'analyses'}</span>
                  {prev!==null&&<span style={{ fontSize:'.78rem', fontWeight:700, color:latest>prev?'#47d372':latest<prev?'#ef4444':'#7a8ba8' }}>{latest>prev?'↑':latest<prev?'↓':'→'} Latest: {latest}/100</span>}
                </div>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:60 }}>
                  <defs><linearGradient id="atsg" x1="0" x2="1"><stop offset="0%" stopColor="#531697"/><stop offset="100%" stopColor="#13a1a5"/></linearGradient></defs>
                  {vals.length>1&&<path d={`${path} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`} fill="url(#atsg)" opacity={0.1}/>}
                  {vals.length>1&&<path d={path} fill="none" stroke="url(#atsg)" strokeWidth={2} strokeLinecap="round"/>}
                  {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={3} fill="url(#atsg)"><title>{vals[i]}/100</title></circle>)}
                </svg>
              </div>
            );
          })() : <div style={{ textAlign:'center', padding:'16px 0', color:'#b0bec9', fontSize:'.8rem' }}>Run SkillPath AI to track your ATS growth</div>}
        </div>
        {/* Batch percentile */}
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:10, color:'#0f1a2e' }}>🏆 Batch Rank</div>
          {batchData?.batchSize > 1 ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'2rem', color:batchData.topPct<=25?'#47d372':batchData.topPct<=50?'#f59e0b':'#ef4444', lineHeight:1 }}>Top {batchData.topPct}%</div>
              <div style={{ fontSize:'.72rem', color:'#7a8ba8', marginTop:4 }}>of your dept & year</div>
              <div style={{ marginTop:10, height:7, background:'#f0f3fa', borderRadius:999 }}>
                <div style={{ height:'100%', width:`${batchData.percentile}%`, background:'linear-gradient(90deg,#531697,#13a1a5)', borderRadius:999 }}/>
              </div>
              <div style={{ fontSize:'.68rem', color:'#b0bec9', marginTop:4 }}>{batchData.batchSize} students compared</div>
            </div>
          ) : <div style={{ textAlign:'center', padding:'14px 0', color:'#b0bec9', fontSize:'.8rem' }}>More students needed for batch ranking</div>}
        </div>
      </div>

      {/* Company Readiness */}
      {(compReadiness.length > 0 || true) && (
        <div className="card" style={{ padding:'16px 18px', marginBottom:12 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:6, color:'#0f1a2e', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>🏢 Company Readiness Score</span>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={async()=>{ const cr=await apiFetch('/analytics/company-readiness'); if(cr?.results) setCompReadiness(cr.results); }}
                style={{ padding:'4px 10px', borderRadius:7, border:'1px solid #d0d7e8', background:'transparent', color:'#13a1a5', fontWeight:700, fontSize:'.72rem', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>↻ Refresh</button>
              <button onClick={()=>nav('/dashboard/companies')} style={{ padding:'4px 10px', borderRadius:7, border:'1px solid #d0d7e8', background:'transparent', color:'#531697', fontWeight:700, fontSize:'.72rem', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>View all →</button>
            </div>
          </div>
          <div style={{ fontSize:'.72rem', color:'#7a8ba8', marginBottom:10 }}>
            Based on your skills ({user?.resumeParsedSkills?.length||0}), ATS {ats}/100, and company JD requirements.
            {!(user?.resumeParsedSkills?.length) && <span style={{ color:'#f59e0b', fontWeight:700 }}> Upload your resume in SkillPath AI to personalise scores.</span>}
          </div>
          {compReadiness.slice(0,6).map(c=>{
            const mc = c.matchScore>=75?'#47d372':c.matchScore>=50?'#f59e0b':'#ef4444';
            return (
              <div key={c.name} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3 }}>
                  <div style={{ width:90, fontSize:'.78rem', fontWeight:700, color:'#0f1a2e', flexShrink:0 }}>{c.name}</div>
                  <div style={{ flex:1, height:7, background:'#f0f3fa', borderRadius:999 }}>
                    <div style={{ height:'100%', width:`${c.matchScore}%`, background:`linear-gradient(90deg,${mc},#13a1a5)`, borderRadius:999, transition:'width .8s' }}/>
                  </div>
                  <div style={{ width:38, textAlign:'right', fontWeight:800, fontSize:'.82rem', color:mc, flexShrink:0 }}>{c.matchScore}%</div>
                </div>
                <div style={{ fontSize:'.68rem', color:'#b0bec9', paddingLeft:100 }}>
                  {c.breakdown.skillMatch} · {c.breakdown.branchStatus}
                  {c.missingSkills.length>0 && <span style={{ color:'#991b1b' }}> · Gap: {c.missingSkills.slice(0,3).join(', ')}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Placement Calendar */}
      {companies.filter(c=>c.campusVisitDate&&new Date(c.campusVisitDate)>new Date()).length>0 && (
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:12, color:'#0f1a2e' }}>🗓️ Upcoming Drives</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
            {companies.filter(c=>c.campusVisitDate&&new Date(c.campusVisitDate)>new Date())
              .sort((a,b)=>new Date(a.campusVisitDate)-new Date(b.campusVisitDate)).slice(0,4).map(c=>{
              const days = Math.ceil((new Date(c.campusVisitDate)-new Date())/(1000*60*60*24));
              const urg = days<=14?'#ef4444':days<=30?'#f59e0b':'#47d372';
              return (
                <div key={c.name} style={{ padding:'12px 14px', borderRadius:10, border:`1.5px solid ${urg}30`, background:`${urg}06` }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.4rem', color:urg, lineHeight:1 }}>{days}</div>
                  <div style={{ fontSize:'.65rem', color:urg, fontWeight:700, marginBottom:4 }}>days</div>
                  <div style={{ fontWeight:700, fontSize:'.82rem', color:'#0f1a2e' }}>{c.name}</div>
                  <div style={{ fontSize:'.7rem', color:'#7a8ba8' }}>{c.difficulty}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FACULTY DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function FacultyDash() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats]         = useState({ notesCount:0, pendingDoubts:0, companiesCount:0, recentNotes:[] });
  const [students, setStudents]   = useState([]);
  const [yearFilter, setYearFilter] = useState('');
  const [weakTopics, setWeakTopics] = useState(null);
  const [atRisk, setAtRisk]       = useState(null);
  const [deptIndex, setDeptIndex] = useState(null);
  const [compReadiness, setCompReadiness] = useState([]);
  const [pendingNotes, setPendingNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [noteMsg, setNoteMsg]     = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProfile, setStudentProfile]   = useState(null);
  const [profileLoading, setProfileLoading]   = useState(false);
  const [annForm, setAnnForm]     = useState({ title:'', message:'', link:'', priority:'normal', targetRole:'all', targetDept:'', targetYear:'' });
  const [annMsg, setAnnMsg]       = useState('');
  const [annLoading, setAnnLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbSearch, setLbSearch]   = useState('');
  const [lbProfileStudent, setLbProfileStudent] = useState(null);
  const [lbProfileData, setLbProfileData] = useState(null);
  const [previewNote, setPreviewNote] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch('/analytics/faculty'),
      apiFetch('/analytics/weak-topics'),
      apiFetch('/analytics/at-risk'),
      apiFetch('/analytics/dept-placement-index'),
      apiFetch('/analytics/company-readiness'),
      apiFetch('/notes/pending'),
      apiFetch('/analytics/leaderboard?limit=100'),
    ]).then(([fac, wt, ar, di, cr, pn, lb]) => {
      if (fac) setStats(fac);
      if (wt) setWeakTopics(wt);
      if (ar) setAtRisk(ar);
      if (di) setDeptIndex(di);
      if (cr?.results) setCompReadiness(cr.results);
      if (pn?.notes) setPendingNotes(pn.notes);
      if (lb?.leaderboard) setLeaderboard(lb.leaderboard);
    });
  }, []);

  useEffect(() => {
    setLoadingStudents(true);
    apiFetch(`/analytics/cohort${yearFilter?`?year=${yearFilter}`:''}`)
      .then(d=>setStudents(d?.students||[])).finally(()=>setLoadingStudents(false));
  }, [yearFilter]);

  async function viewProfile(student) {
    setSelectedStudent(student);
    setStudentProfile(null);
    setProfileLoading(true);
    try {
      const d = await apiFetch(`/analytics/student-profile/${student._id}`);
      if (d) setStudentProfile(d);
    } finally { setProfileLoading(false); }
  }

  async function postAnnouncement(e) {
    e.preventDefault();
    if (!annForm.title.trim() || !annForm.message.trim()) { setAnnMsg('❌ Title and message are required'); return; }
    setAnnLoading(true); setAnnMsg('');
    try {
      const target = {};
      if (annForm.targetRole && annForm.targetRole !== 'all') target.role = annForm.targetRole;
      if (annForm.targetDept) target.department = annForm.targetDept;
      if (annForm.targetYear) target.year = Number(annForm.targetYear);
      const res = await fetch(`${API}/announcements`, {
        method:'POST',
        headers:{ Authorization:`Bearer ${localStorage.getItem('pragati_token')}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ title: annForm.title, message: annForm.message, link: annForm.link, priority: annForm.priority, targetFilter: target })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setAnnMsg('✅ Announcement posted!');
      setAnnForm({ title:'', message:'', link:'', priority:'normal', targetRole:'all', targetDept:'', targetYear:'' });
    } catch(err) { setAnnMsg(`❌ ${err.message}`); }
    finally { setAnnLoading(false); }
  }

  async function actNote(id, action) {
    const res = await fetch(`${API}/notes/${id}/${action}`, { method:'PATCH', headers:{ ...tk(), 'Content-Type':'application/json' } });
    if (res.ok) {
      setPendingNotes(ns => ns.filter(n => n._id !== id));
      setNoteMsg(`Note ${action}d successfully`);
      setTimeout(() => setNoteMsg(''), 3000);
    }
  }

  const TABS = [
    { id:'overview',  label:'📊 Overview' },
    { id:'readiness', label:'📈 Dept Placement Index' },
    { id:'readiness2',label:'🏢 Company Readiness' },
    { id:'notes',     label:`📋 Review Notes (${pendingNotes.length})` },
    { id:'leaderboard',label:'🏆 Leaderboard' },
    { id:'weak',      label:'🧠 Weak Topics' },
    { id:'risk',      label:`🚨 At Risk (${atRisk?.total||0})` },
    { id:'students',  label:'👥 Students' },
    { id:'announce',   label:'📢 Announcements' },
  ];

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif" }}>
      {showEditProfile && <EditProfileModal user={user} onClose={()=>setShowEditProfile(false)} onSaved={()=>{}} />}

      {/* Note Preview Modal */}
      {previewNote && (
        <div style={{ position:'fixed', inset:0, background:'rgba(4,44,93,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={()=>setPreviewNote(null)}>
          <div style={{ background:'#fff', borderRadius:20, padding:'24px 28px', maxWidth:700, width:'100%', maxHeight:'88vh', overflowY:'auto', boxShadow:'0 20px 80px rgba(4,44,93,0.25)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1rem', color:'#0f1a2e' }}>📄 {previewNote.title}</div>
              <button onClick={()=>setPreviewNote(null)} style={{ width:32, height:32, borderRadius:'50%', border:'1px solid #e8edf5', background:'#f8f9fc', cursor:'pointer', fontWeight:800, color:'#7a8ba8', fontSize:'1rem' }}>×</button>
            </div>
            <div style={{ fontSize:'.78rem', color:'#7a8ba8', marginBottom:14 }}>{previewNote.subject} · {previewNote.department} · Year {previewNote.year} · by {previewNote.uploadedBy?.name}</div>
            {previewNote.fileUrl ? (
              previewNote.isDriveLink || previewNote.fileUrl?.includes('drive.google.com') || previewNote.fileUrl?.includes('docs.google.com') ? (
                <iframe src={previewNote.fileUrl.replace('/view','/preview')} title="Note Preview" style={{ width:'100%', height:400, border:'1px solid #e8edf5', borderRadius:10 }} />
              ) : previewNote.fileType?.includes('pdf') ? (
                <iframe src={previewNote.fileUrl} title="Note Preview" style={{ width:'100%', height:400, border:'1px solid #e8edf5', borderRadius:10 }} />
              ) : (
                <div style={{ padding:20, background:'#f8f9fc', borderRadius:10, textAlign:'center' }}>
                  <div style={{ fontSize:'2rem', marginBottom:8 }}>📁</div>
                  <div style={{ fontSize:'.83rem', color:'#7a8ba8' }}>Preview not available for this file type.</div>
                  <a href={previewNote.fileUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop:10, display:'inline-block', padding:'7px 16px', borderRadius:8, background:'rgba(83,22,151,.08)', color:'#531697', fontWeight:700, fontSize:'.8rem', textDecoration:'none' }}>Open File →</a>
                </div>
              )
            ) : <div style={{ color:'#b0bec9', textAlign:'center', padding:20 }}>No file URL available</div>}
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button onClick={()=>{ actNote(previewNote._id,'approve'); setPreviewNote(null); }} style={{ flex:1, padding:'10px', borderRadius:9, border:'none', background:'#dcfce7', color:'#166534', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.85rem' }}>✅ Approve Note</button>
              <button onClick={()=>{ actNote(previewNote._id,'reject'); setPreviewNote(null); }} style={{ flex:1, padding:'10px', borderRadius:9, border:'none', background:'#fee2e2', color:'#991b1b', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.85rem' }}>❌ Reject Note</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', color:'#0f1a2e' }}>Hello, {user?.name} 🎓</h1>
          <p style={{ color:'#7a8ba8', marginTop:3 }}>Department: {user?.department} · Manage notes, monitor students</p>
        </div>
        <button onClick={()=>setShowEditProfile(true)} style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid rgba(83,22,151,.25)', background:'rgba(83,22,151,.06)', color:'#531697', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.82rem' }}>✏️ Edit Profile</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        <Stat icon="📚" label="Notes Uploaded" value={stats.notesCount} grad="linear-gradient(135deg,#042c5d,#531697)" onClick={()=>nav('/dashboard/notes')}/>
        <Stat icon="💬" label="Doubts Pending" value={stats.pendingDoubts} grad="linear-gradient(135deg,#531697,#13a1a5)" onClick={()=>nav('/dashboard/discussions')}/>
        <Stat icon="⏳" label="Notes to Review" value={pendingNotes.length} grad="linear-gradient(135deg,#f59e0b,#ef4444)" onClick={()=>setActiveTab('notes')}/>
        <Stat icon="🚨" label="At-Risk Students" value={atRisk?.total||0} grad="linear-gradient(135deg,#ef4444,#f59e0b)" onClick={()=>setActiveTab('risk')}/>
      </div>

      <div style={{ display:'flex', gap:5, marginBottom:14, borderBottom:'1px solid #e8edf5', flexWrap:'wrap' }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ padding:'7px 12px', borderRadius:'8px 8px 0 0', border:'none', borderBottom:activeTab===t.id?'2px solid #531697':'2px solid transparent', background:activeTab===t.id?'rgba(83,22,151,.06)':'transparent', color:activeTab===t.id?'#531697':'#7a8ba8', fontWeight:700, cursor:'pointer', fontSize:'.78rem', fontFamily:"'Nunito',sans-serif", whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {noteMsg && <div style={{ marginBottom:12, padding:'10px 14px', background:'#dcfce7', borderRadius:8, color:'#166534', fontWeight:700, fontSize:'.83rem' }}>✅ {noteMsg}</div>}

      {/* Overview */}
      {activeTab==='overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="card" style={{ padding:'16px 18px' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:12 }}>📋 Faculty Actions</div>
            {[
              { icon:'📤', label:'Upload Notes', sub:'File or Drive link', to:'/dashboard/notes', c:'#531697' },
              { icon:'💬', label:'Answer Doubts', sub:`${stats.pendingDoubts} unanswered`, to:'/dashboard/discussions', c:'#13a1a5' },
              { icon:'🏢', label:'View Companies', sub:'Placement info', to:'/dashboard/companies', c:'#042c5d' },
            ].map(a=>(
              <button key={a.to} onClick={()=>nav(a.to)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:9, border:`1px solid ${a.c}25`, background:`${a.c}06`, cursor:'pointer', marginBottom:7, textAlign:'left' }}
                onMouseOver={e=>e.currentTarget.style.background=`${a.c}10`}
                onMouseOut={e=>e.currentTarget.style.background=`${a.c}06`}>
                <div style={{ width:32, height:32, borderRadius:8, background:`${a.c}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.95rem', flexShrink:0 }}>{a.icon}</div>
                <div><div style={{ fontWeight:700, fontSize:'.82rem', color:'#0f1a2e' }}>{a.label}</div><div style={{ fontSize:'.7rem', color:'#7a8ba8' }}>{a.sub}</div></div>
                <span style={{ marginLeft:'auto', color:a.c }}>→</span>
              </button>
            ))}
          </div>
          <div className="card" style={{ padding:'16px 18px' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:10 }}>📝 Recent Uploads</div>
            {stats.recentNotes?.length>0 ? stats.recentNotes.map(n=>(
              <div key={n._id} style={{ padding:'7px 0', borderBottom:'1px solid #f0f3fa' }}>
                <div style={{ fontWeight:700, fontSize:'.8rem', color:'#0f1a2e' }}>{n.title}</div>
                <div style={{ fontSize:'.68rem', color:'#b0bec9', marginTop:1 }}>
                  {n.subject} · {new Date(n.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · <span style={{ color:n.status==='approved'?'#166534':'#92400e', fontWeight:700 }}>{n.status}</span>
                </div>
              </div>
            )) : <div style={{ color:'#b0bec9', fontSize:'.8rem', padding:'10px 0' }}>No notes yet.</div>}
          </div>
        </div>
      )}

      {/* Dept Placement Index */}
      {activeTab==='readiness' && (
        <div className="card" style={{ padding:'20px 22px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', marginBottom:14 }}>📈 {user?.department} Department — Placement Readiness Index</div>
          {deptIndex ? (
            <>
              <div style={{ background:'linear-gradient(135deg,#042c5d,#531697)', borderRadius:12, padding:'16px 22px', marginBottom:16, color:'#fff' }}>
                <div style={{ color:'rgba(255,255,255,.6)', fontSize:'.72rem', marginBottom:4 }}>OVERALL READINESS INDEX</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'2.5rem', lineHeight:1 }}>{deptIndex.readiness}%</div>
                <div style={{ fontSize:'.8rem', color:'rgba(255,255,255,.7)', marginTop:4 }}>
                  {deptIndex.readiness>=70?'✅ Good — most students on track':deptIndex.readiness>=50?'⚠️ Moderate — targeted intervention needed':'🔴 Needs immediate attention'}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:14 }}>
                  {[['Students',deptIndex.total],['Avg ATS',`${deptIndex.avgAts}/100`],['Have Resume',`${Math.round((deptIndex.withResume/deptIndex.total)*100)}%`],['Active Streak',`${deptIndex.activeStreaks}`]].map(([l,v])=>(
                    <div key={l}><div style={{ color:'rgba(255,255,255,.5)', fontSize:'.62rem' }}>{l}</div><div style={{ color:'#fff', fontWeight:800 }}>{v}</div></div>
                  ))}
                </div>
              </div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.85rem', marginBottom:10 }}>Year-wise Breakdown</div>
              {deptIndex.yearBreakdown.map(y=>(
                <div key={y.year} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', fontWeight:700, color:'#3d4e6b', marginBottom:3 }}>
                    <span>Year {y.year} — {y.count} students</span><span style={{ color:'#531697' }}>Avg ATS: {y.avgAts}/100</span>
                  </div>
                  <div style={{ height:7, background:'#f0f3fa', borderRadius:999 }}>
                    <div style={{ height:'100%', width:`${y.avgAts}%`, background:'linear-gradient(90deg,#531697,#13a1a5)', borderRadius:999 }}/>
                  </div>
                </div>
              ))}
            </>
          ) : <div style={{ color:'#b0bec9', textAlign:'center', padding:30 }}>Loading department data…</div>}
        </div>
      )}

      {/* Company Readiness for faculty */}
      {activeTab==='readiness2' && (
        <div className="card" style={{ padding:'20px 22px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', marginBottom:6 }}>🏢 Your Company Readiness Score</div>
          <div style={{ fontSize:'.75rem', color:'#7a8ba8', marginBottom:14 }}>Scores calculated from your skills, ATS score, and each company's JD requirements</div>
          {compReadiness.length>0 ? compReadiness.slice(0,8).map(c=>{
            const mc = c.matchScore>=75?'#47d372':c.matchScore>=50?'#f59e0b':'#ef4444';
            return (
              <div key={c.name} style={{ marginBottom:12, padding:'10px 12px', borderRadius:9, border:'1px solid #e8edf5', background:'#fafbff' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
                  <div style={{ width:80, fontWeight:700, fontSize:'.82rem', color:'#0f1a2e', flexShrink:0 }}>{c.name}</div>
                  <div style={{ flex:1, height:7, background:'#f0f3fa', borderRadius:999 }}>
                    <div style={{ height:'100%', width:`${c.matchScore}%`, background:`linear-gradient(90deg,${mc},#13a1a5)`, borderRadius:999, transition:'width .8s' }}/>
                  </div>
                  <div style={{ fontWeight:800, fontSize:'.85rem', color:mc, flexShrink:0 }}>{c.matchScore}%</div>
                </div>
                <div style={{ fontSize:'.68rem', color:'#7a8ba8' }}>
                  {c.breakdown.skillMatch} · {c.breakdown.atsContrib} · {c.breakdown.branchStatus}
                </div>
                {c.missingSkills.length>0 && <div style={{ fontSize:'.67rem', color:'#991b1b', marginTop:3 }}>Missing: {c.missingSkills.join(', ')}</div>}
              </div>
            );
          }) : <div style={{ color:'#b0bec9', textAlign:'center', padding:30 }}>No company data available</div>}
        </div>
      )}

      {/* Note review tab for faculty */}
      {activeTab==='notes' && (
        <div className="card" style={{ padding:'20px 22px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', marginBottom:14 }}>📋 Notes Awaiting Review</div>
          {pendingNotes.length===0 ? <div style={{ color:'#7a8ba8', fontSize:'.85rem' }}>✅ No notes pending review!</div> :
            pendingNotes.map(n=>(
              <div key={n._id} style={{ padding:'14px 16px', borderRadius:10, border:'1px solid #e8edf5', marginBottom:10, background:'#fafbff' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:'.87rem', color:'#0f1a2e' }}>{n.title}</div>
                    <div style={{ fontSize:'.73rem', color:'#7a8ba8', marginTop:2 }}>{n.subject} · {n.department} · Year {n.year} · by {n.uploadedBy?.name}</div>
                    {n.description && <div style={{ fontSize:'.75rem', color:'#3d4e6b', marginTop:4, lineHeight:1.5 }}>{n.description}</div>}
                  </div>
                  <span style={{ padding:'2px 8px', borderRadius:999, background:'rgba(245,158,11,.1)', color:'#92400e', fontSize:'.68rem', fontWeight:700, flexShrink:0 }}>Pending</span>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>setPreviewNote(n)} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid rgba(83,22,151,.25)', background:'rgba(83,22,151,.06)', color:'#531697', fontWeight:700, cursor:'pointer', fontSize:'.78rem', fontFamily:"'Nunito',sans-serif" }}>👁️ Preview</button>
                  <button onClick={()=>actNote(n._id,'approve')} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'#dcfce7', color:'#166534', fontWeight:700, cursor:'pointer', fontSize:'.78rem', fontFamily:"'Nunito',sans-serif" }}>✅ Approve</button>
                  <button onClick={()=>actNote(n._id,'reject')}  style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'#fee2e2', color:'#991b1b', fontWeight:700, cursor:'pointer', fontSize:'.78rem', fontFamily:"'Nunito',sans-serif" }}>❌ Reject</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Leaderboard tab for faculty */}
      {activeTab==='leaderboard' && (() => {
        const lc2 = { Beginner:'#f59e0b', Intermediate:'#531697', Expert:'#47d372' };
        const medals = ['🥇','🥈','🥉'];
        const filtered = leaderboard.filter(s => s.name?.toLowerCase().includes(lbSearch.toLowerCase()) || s.rollNumber?.toLowerCase().includes(lbSearch.toLowerCase()));
        return (
          <div className="card" style={{ padding:'20px 22px' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', marginBottom:14 }}>🏆 Student Leaderboard</div>
            {lbProfileStudent ? (
              <div>
                <button onClick={()=>{setLbProfileStudent(null);setLbProfileData(null);}} style={{ marginBottom:12, padding:'6px 14px', borderRadius:8, border:'1px solid #d0d7e8', background:'transparent', color:'#7a8ba8', fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.8rem' }}>← Back to Leaderboard</button>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1rem', color:'#0f1a2e', marginBottom:4 }}>{lbProfileStudent.name}</div>
                <div style={{ fontSize:'.78rem', color:'#7a8ba8', marginBottom:12 }}>{lbProfileStudent.department} · Year {lbProfileStudent.year} · {lbProfileStudent.rollNumber||'—'}</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
                  {[['ATS',lbProfileStudent.atsScore||0,'#531697'],['Streak',`${lbProfileStudent.streak||0}d`,'#f59e0b'],['Solved',lbProfileStudent.totalProblemsSolved||0,'#13a1a5'],['Level',lbProfileStudent.skillLevel||'—','#47d372']].map(([l,v,c])=>(
                    <div key={l} style={{ textAlign:'center', padding:'10px 6px', background:'#f8f9fc', borderRadius:10 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', color:c }}>{v}</div>
                      <div style={{ fontSize:'.65rem', color:'#b0bec9', fontWeight:700 }}>{l}</div>
                    </div>
                  ))}
                </div>
                {!lbProfileData && <div style={{ textAlign:'center', padding:20, color:'#b0bec9' }}>Loading profile…</div>}
                {lbProfileData?.aptStats?.map(s => {
                  const pct = Math.round(s.accuracy||0);
                  const c = pct>=70?'#47d372':pct>=45?'#f59e0b':'#ef4444';
                  return <div key={s.topic} style={{ marginBottom:7 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.73rem', fontWeight:700, color:'#3d4e6b', marginBottom:2 }}><span>{s.topic}</span><span style={{ color:c }}>{pct}%</span></div>
                    <div style={{ height:5, background:'#f0f3fa', borderRadius:999 }}><div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${c},#13a1a5)`, borderRadius:999 }}/></div>
                  </div>;
                })}
              </div>
            ) : (
              <>
                <input value={lbSearch} onChange={e=>setLbSearch(e.target.value)} placeholder="🔍 Search student by name or roll…"
                  style={{ width:'100%', padding:'9px 14px', borderRadius:10, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.875rem', outline:'none', marginBottom:14, boxSizing:'border-box' }} />
                {filtered.map((s,i) => {
                  const globalIdx = leaderboard.indexOf(s);
                  return (
                    <div key={s._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, marginBottom:6, background:'#fafbff', border:'1px solid #f0f3fa' }}>
                      <div style={{ width:28, textAlign:'center', fontSize:globalIdx<3?'1.1rem':'.82rem', fontWeight:800, color:'#7a8ba8', flexShrink:0 }}>{medals[globalIdx]||`#${globalIdx+1}`}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'.85rem', color:'#0f1a2e' }}>{s.name}</div>
                        <div style={{ fontSize:'.68rem', color:'#b0bec9' }}>{s.department} · Y{s.year} · <span style={{ color:lc2[s.skillLevel]||'#531697' }}>{s.skillLevel}</span> · 🔥{s.streak}d</div>
                      </div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.9rem', background:'linear-gradient(135deg,#531697,#13a1a5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', flexShrink:0, marginRight:8 }}>{s.totalScore}</div>
                      <button onClick={async()=>{ setLbProfileStudent(s); const d=await apiFetch(`/analytics/student-profile/${s._id}`); setLbProfileData(d); }}
                        style={{ padding:'4px 10px', borderRadius:7, border:'1px solid rgba(83,22,151,.2)', background:'rgba(83,22,151,.06)', color:'#531697', fontWeight:700, cursor:'pointer', fontSize:'.7rem', fontFamily:"'Nunito',sans-serif" }}>View Profile</button>
                    </div>
                  );
                })}
                {filtered.length===0 && <div style={{ textAlign:'center', padding:24, color:'#b0bec9' }}>No matching students</div>}
              </>
            )}
          </div>
        );
      })()}

      {/* Weak topics */}
      {activeTab==='weak' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="card" style={{ padding:'16px 18px' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:10 }}>🔍 Skill Gaps Across Batch</div>
            <div style={{ fontSize:'.72rem', color:'#7a8ba8', marginBottom:10 }}>{weakTopics?.studentsAnalyzed||0} of {weakTopics?.totalStudents||0} students analysed</div>
            {(weakTopics?.weakTopics||[]).map(t=>(
              <div key={t.skill} style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.75rem', fontWeight:700, color:'#3d4e6b', marginBottom:3 }}>
                  <span style={{ textTransform:'capitalize' }}>{t.skill}</span>
                  <span style={{ color:t.pct>=60?'#ef4444':t.pct>=40?'#f59e0b':'#531697' }}>{t.pct}% have gap</span>
                </div>
                <div style={{ height:6, background:'#f0f3fa', borderRadius:999 }}>
                  <div style={{ height:'100%', width:`${t.pct}%`, background:t.pct>=60?'#ef4444':t.pct>=40?'#f59e0b':'#531697', borderRadius:999 }}/>
                </div>
              </div>
            ))}
            {(!weakTopics?.weakTopics?.length) && <div style={{ color:'#b0bec9', fontSize:'.82rem' }}>Run SkillPath analyses to see batch gaps</div>}
          </div>
          <div className="card" style={{ padding:'16px 18px' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:10 }}>💻 Problem-Solving Weak Areas</div>
            {(weakTopics?.problemWeakAreas||[]).map(t=>(
              <div key={t.topic} style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #e8edf5', marginBottom:7, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:700, fontSize:'.8rem', color:'#0f1a2e' }}>{t.topic||'—'}</span>
                <span style={{ fontSize:'.72rem', color:'#7a8ba8' }}>{t.solved}/{t.total} solved</span>
              </div>
            ))}
            {(!weakTopics?.problemWeakAreas?.length)&&<div style={{ color:'#b0bec9', fontSize:'.82rem' }}>No problem data yet</div>}
          </div>
        </div>
      )}

      {/* At risk */}
      {activeTab==='risk' && atRisk && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
            {[['🔴','High Risk',atRisk.summary?.high,'#ef4444'],['🟡','Medium Risk',atRisk.summary?.medium,'#f59e0b'],['🟢','Low Risk',atRisk.summary?.low,'#47d372']].map(([ic,l,v,c])=>(
              <div key={l} className="card" style={{ padding:'14px 16px', borderLeft:`3px solid ${c}` }}>
                <div>{ic}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', color:c, lineHeight:1 }}>{v||0}</div>
                <div style={{ fontSize:'.75rem', color:'#7a8ba8', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:'16px 20px' }}>
            {atRisk.atRisk?.map(s=>(
              <div key={s._id} style={{ padding:'10px 12px', borderRadius:9, border:'1px solid #e8edf5', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:700, fontSize:'.85rem', color:'#0f1a2e' }}>{s.name}</span>
                  <span style={{ padding:'1px 7px', borderRadius:999, background:s.riskLevel==='high'?'#fee2e2':'rgba(245,158,11,.1)', color:s.riskLevel==='high'?'#991b1b':'#92400e', fontSize:'.65rem', fontWeight:700 }}>{s.riskLevel}</span>
                </div>
                <div style={{ fontSize:'.72rem', color:'#7a8ba8', marginTop:2 }}>{s.rollNumber} · Year {s.year}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:5 }}>
                  {s.risks?.map(r=><span key={r} style={{ padding:'2px 7px', borderRadius:999, background:'rgba(239,68,68,.06)', color:'#991b1b', fontSize:'.67rem', fontWeight:600, border:'1px solid rgba(239,68,68,.15)' }}>⚠ {r}</span>)}
                </div>
              </div>
            ))}
            {!atRisk.atRisk?.length && <div style={{ textAlign:'center', padding:'24px 0', color:'#47d372', fontWeight:700 }}>✅ No at-risk students!</div>}
          </div>
        </>
      )}

      {/* Students table */}
      {activeTab==='students' && (
        <div className="card" style={{ padding:'16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', color:'#0f1a2e' }}>👥 Student Records</div>
            <div style={{ display:'flex', gap:5 }}>
              {['','1','2','3','4'].map(y=>(
                <button key={y} onClick={()=>setYearFilter(y)} style={{ padding:'4px 10px', borderRadius:999, border:`1px solid ${yearFilter===y?'#531697':'#d0d7e8'}`, background:yearFilter===y?'rgba(83,22,151,.08)':'transparent', color:yearFilter===y?'#531697':'#7a8ba8', fontWeight:700, cursor:'pointer', fontSize:'.72rem', fontFamily:"'Nunito',sans-serif" }}>
                  {y===''?'All':`Y${y}`}
                </button>
              ))}
            </div>
          </div>
          {loadingStudents ? <div style={{ textAlign:'center', padding:20, color:'#b0bec9' }}>Loading…</div> : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.77rem' }}>
                <thead><tr style={{ borderBottom:'2px solid #e8edf5' }}>
                  {['Name','Roll','Year','Dept','Level','Streak','ATS',''].map(h=><th key={h} style={{ padding:'6px 8px', textAlign:'left', color:'#3d4e6b', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'.69rem' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {students.map(s=>{
                    const lc2={Beginner:'#f59e0b',Intermediate:'#531697',Expert:'#47d372'};
                    return (
                      <tr key={s._id} style={{ borderBottom:'1px solid #f0f3fa' }}>
                        <td style={{ padding:'7px 8px', fontWeight:700, color:'#0f1a2e' }}>{s.name}</td>
                        <td style={{ padding:'7px 8px', color:'#7a8ba8' }}>{s.rollNumber||'—'}</td>
                        <td style={{ padding:'7px 8px', color:'#7a8ba8' }}>Y{s.year||'—'}</td>
                        <td style={{ padding:'7px 8px', color:'#7a8ba8' }}>{s.department}</td>
                        <td style={{ padding:'7px 8px' }}><span style={{ padding:'1px 6px', borderRadius:999, background:`${lc2[s.skillLevel]||'#531697'}15`, color:lc2[s.skillLevel]||'#531697', fontWeight:700, fontSize:'.67rem' }}>{s.skillLevel||'Beginner'}</span></td>
                        <td style={{ padding:'7px 8px', color:'#3d4e6b' }}>🔥{s.streak||0}</td>
                        <td style={{ padding:'7px 8px', fontWeight:800, color:'#531697' }}>{s.atsScore||'—'}</td>
                        <td style={{ padding:'7px 8px' }}>
                          <button onClick={()=>viewProfile(s)} style={{ padding:'3px 10px', borderRadius:7, border:'1px solid #531697', background:'rgba(83,22,151,0.06)', color:'#531697', fontWeight:700, cursor:'pointer', fontSize:'.68rem', fontFamily:"'Nunito',sans-serif", whiteSpace:'nowrap' }}>View Profile</button>
                        </td>
                      </tr>
                    );
                  })}
                  {!students.length&&<tr><td colSpan={7} style={{ padding:14, textAlign:'center', color:'#b0bec9' }}>No students found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Announcements tab */}
      {activeTab==='announce' && (
        <div className="card" style={{ padding:'20px 22px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', marginBottom:16 }}>📢 Create Announcement</div>
          <form onSubmit={postAnnouncement}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#3d4e6b', marginBottom:4, fontFamily:"'Syne',sans-serif" }}>Title *</label>
                <input value={annForm.title} onChange={e=>setAnnForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Placement Drive on 15th Jan"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.875rem', outline:'none', background:'#fafbff', boxSizing:'border-box' }} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#3d4e6b', marginBottom:4, fontFamily:"'Syne',sans-serif" }}>Message *</label>
                <textarea value={annForm.message} onChange={e=>setAnnForm(f=>({...f,message:e.target.value}))} rows={3} placeholder="Announcement details…"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.875rem', outline:'none', background:'#fafbff', resize:'vertical', boxSizing:'border-box' }} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#3d4e6b', marginBottom:4, fontFamily:"'Syne',sans-serif" }}>Link (optional)</label>
                <input value={annForm.link} onChange={e=>setAnnForm(f=>({...f,link:e.target.value}))} placeholder="https://…"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.875rem', outline:'none', background:'#fafbff', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#3d4e6b', marginBottom:4, fontFamily:"'Syne',sans-serif" }}>Priority</label>
                <select value={annForm.priority} onChange={e=>setAnnForm(f=>({...f,priority:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.875rem', outline:'none', background:'#fafbff' }}>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#3d4e6b', marginBottom:4, fontFamily:"'Syne',sans-serif" }}>Target</label>
                <select value={annForm.targetRole} onChange={e=>setAnnForm(f=>({...f,targetRole:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.875rem', outline:'none', background:'#fafbff' }}>
                  <option value="all">All Students</option>
                  <option value="student">Students Only</option>
                  <option value="faculty">Faculty Only</option>
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#3d4e6b', marginBottom:4, fontFamily:"'Syne',sans-serif" }}>Department (optional)</label>
                <select value={annForm.targetDept} onChange={e=>setAnnForm(f=>({...f,targetDept:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.875rem', outline:'none', background:'#fafbff' }}>
                  <option value="">All Departments</option>
                  {['CSE','CSAIML','IT','ECE','Mechanical','Civil','Other'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#3d4e6b', marginBottom:4, fontFamily:"'Syne',sans-serif" }}>Year (optional)</label>
                <select value={annForm.targetYear} onChange={e=>setAnnForm(f=>({...f,targetYear:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.875rem', outline:'none', background:'#fafbff' }}>
                  <option value="">All Years</option>
                  {[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>
            {annMsg && <div style={{ marginBottom:12, padding:'9px 14px', borderRadius:8, fontSize:'.83rem', fontWeight:600, background:annMsg.startsWith('✅')?'#dcfce7':'#fee2e2', color:annMsg.startsWith('✅')?'#166534':'#991b1b' }}>{annMsg}</div>}
            <button type="submit" disabled={annLoading}
              style={{ padding:'11px 24px', borderRadius:10, border:'none', background:annLoading?'#d0d7e8':'linear-gradient(135deg,#531697,#13a1a5)', color:'#fff', fontWeight:800, cursor:annLoading?'not-allowed':'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.88rem' }}>
              {annLoading ? 'Posting…' : '📢 Post Announcement'}
            </button>
          </form>
        </div>
      )}

      {/* Student Profile Modal */}
      {selectedStudent && (
        <div style={{ position:'fixed', inset:0, background:'rgba(4,44,93,0.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={()=>{setSelectedStudent(null);setStudentProfile(null);}}>
          <div style={{ background:'#fff', borderRadius:20, padding:'24px 28px', maxWidth:620, width:'100%', maxHeight:'85vh', overflowY:'auto', boxShadow:'0 20px 80px rgba(4,44,93,0.25)' }} onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.15rem', color:'#0f1a2e' }}>{selectedStudent.name}</div>
                <div style={{ fontSize:'.78rem', color:'#7a8ba8', marginTop:2 }}>{selectedStudent.department} · Year {selectedStudent.year} · {selectedStudent.rollNumber||'No roll no.'}</div>
              </div>
              <button onClick={()=>{setSelectedStudent(null);setStudentProfile(null);}} style={{ width:32, height:32, borderRadius:'50%', border:'1px solid #e8edf5', background:'#f8f9fc', cursor:'pointer', fontWeight:800, color:'#7a8ba8', fontSize:'1rem' }}>×</button>
            </div>

            {/* Quick stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
              {[['ATS',selectedStudent.atsScore||0,'#531697'],['Streak',`${selectedStudent.streak||0}d`,'#f59e0b'],['Solved',selectedStudent.totalProblemsSolved||0,'#13a1a5'],['Level',selectedStudent.skillLevel||'—','#47d372']].map(([l,v,c])=>(
                <div key={l} style={{ textAlign:'center', padding:'10px 6px', background:'#f8f9fc', borderRadius:10 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', color:c }}>{v}</div>
                  <div style={{ fontSize:'.65rem', color:'#b0bec9', fontWeight:700 }}>{l}</div>
                </div>
              ))}
            </div>

            {profileLoading && <div style={{ textAlign:'center', padding:30, color:'#b0bec9' }}>Loading profile data…</div>}

            {studentProfile && !profileLoading && (
              <>
                {/* Aptitude chart */}
                {studentProfile.aptStats?.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.82rem', color:'#0f1a2e', marginBottom:8 }}>🎯 Aptitude Performance (by topic)</div>
                    <div style={{ fontSize:'.72rem', color:'#7a8ba8', marginBottom:8 }}>
                      {studentProfile.summary.correctApt}/{studentProfile.summary.totalApt} correct · {studentProfile.summary.accuracy}% accuracy
                    </div>
                    {studentProfile.aptStats.map(s=>{
                      const pct = Math.round(s.accuracy||0);
                      const c = pct>=70?'#47d372':pct>=45?'#f59e0b':'#ef4444';
                      return (
                        <div key={s.topic} style={{ marginBottom:7 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.72rem', fontWeight:700, color:'#3d4e6b', marginBottom:2 }}>
                            <span>{s.topic}</span>
                            <span style={{ color:c }}>{pct}% ({s.correct}/{s.total})</span>
                          </div>
                          <div style={{ height:6, background:'#f0f3fa', borderRadius:999 }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${c},#13a1a5)`, borderRadius:999, transition:'width 0.8s' }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Coding chart */}
                {studentProfile.codingStats?.filter(s=>s.topic).length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.82rem', color:'#0f1a2e', marginBottom:8 }}>💻 Coding Performance (by topic)</div>
                    {studentProfile.codingStats.filter(s=>s.topic).map(s=>{
                      const pct = s.total > 0 ? Math.round((s.solved/s.total)*100) : 0;
                      return (
                        <div key={s.topic} style={{ marginBottom:7 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.72rem', fontWeight:700, color:'#3d4e6b', marginBottom:2 }}>
                            <span>{s.topic}</span>
                            <span style={{ color:'#531697' }}>{s.solved}/{s.total} solved</span>
                          </div>
                          <div style={{ height:6, background:'#f0f3fa', borderRadius:999 }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#531697,#13a1a5)', borderRadius:999, transition:'width 0.8s' }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Recent activity */}
                {studentProfile.recentActivity?.length > 0 && (
                  <div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.82rem', color:'#0f1a2e', marginBottom:8 }}>🕐 Recent Aptitude Activity</div>
                    {studentProfile.recentActivity.slice(0,5).map((a,i)=>(
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid #f0f3fa' }}>
                        <span>{a.correct?'✅':'❌'}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'.78rem', fontWeight:600, color:'#0f1a2e' }}>{a.questionId?.question?.slice(0,60)||'Question'}…</div>
                          <div style={{ fontSize:'.67rem', color:'#b0bec9' }}>{a.questionId?.topic} · {a.questionId?.difficulty} · {new Date(a.attemptedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!studentProfile.aptStats?.length && !studentProfile.codingStats?.length && (
                  <div style={{ textAlign:'center', padding:20, color:'#b0bec9', fontSize:'.82rem' }}>No activity data yet for this student.</div>
                )}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function AdminDash() {
  const nav = useNavigate();
  const [cohort, setCohort]     = useState(null);
  const [pending, setPending]   = useState([]);
  const [placement, setPlacement] = useState(null);
  const [demand, setDemand]     = useState(null);
  const [yearFilter, setYearFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const qs = [yearFilter&&`year=${yearFilter}`, deptFilter&&`department=${deptFilter}`].filter(Boolean).join('&');
    Promise.all([
      apiFetch(`/analytics/cohort${qs?'?'+qs:''}`),
      apiFetch('/notes/pending'),
      apiFetch('/analytics/placement-index'),
      apiFetch('/analytics/company-demand'),
    ]).then(([c,n,pi,cd])=>{
      if(c) setCohort(c);
      if(n?.notes) setPending(n.notes);
      if(pi) setPlacement(pi);
      if(cd) setDemand(cd);
    }).finally(()=>setLoading(false));
  }, [yearFilter, deptFilter]);

  const lc = { Beginner:'#f59e0b', Intermediate:'#531697', Expert:'#47d372' };
  const DEPTS = ['','CSE','CSAIML','IT','ECE','Mechanical','Civil'];
  const TABS=[{id:'overview',label:'📊 Overview'},{id:'readiness',label:'📈 Placement Index'},{id:'demand',label:'🏢 Demand Analyzer'},{id:'cohort',label:'👥 Cohort'}];

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ marginBottom:18 }}>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', color:'#0f1a2e' }}>⚙️ Admin Overview</h1>
        <p style={{ color:'#7a8ba8', marginTop:3 }}>Full system visibility — students, faculty, and placement readiness.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        <Stat icon="🎓" label="Total Students" value={loading?'…':cohort?.total} grad="linear-gradient(135deg,#042c5d,#531697)"/>
        <Stat icon="👨‍🏫" label="Total Faculty" value={loading?'…':cohort?.totalFaculty} grad="linear-gradient(135deg,#531697,#13a1a5)"/>
        <Stat icon="📈" label="Placement Index" value={loading?'…':(placement?.readinessScore?`${placement.readinessScore}%`:'—')} sub="Overall readiness" grad="linear-gradient(135deg,#13a1a5,#47d372)"/>
        <Stat icon="⏳" label="Pending Notes" value={pending.length} sub="Need approval" grad="linear-gradient(135deg,#f59e0b,#ef4444)" onClick={()=>nav('/dashboard/admin')}/>
      </div>

      <div style={{ display:'flex', gap:5, marginBottom:14, borderBottom:'1px solid #e8edf5' }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ padding:'8px 14px', borderRadius:'9px 9px 0 0', border:'none', borderBottom:activeTab===t.id?'2px solid #531697':'2px solid transparent', background:activeTab===t.id?'rgba(83,22,151,.06)':'transparent', color:activeTab===t.id?'#531697':'#7a8ba8', fontWeight:700, cursor:'pointer', fontSize:'.82rem', fontFamily:"'Nunito',sans-serif" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab==='overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="card" style={{ padding:'16px 18px' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:12 }}>🛠️ Admin Actions</div>
            {[{icon:'✅',label:'Approve Notes',sub:`${pending.length} pending`,to:'/dashboard/admin',c:'#47d372'},{icon:'🏢',label:'Add Company',sub:'Profile + prep guide',to:'/dashboard/admin',c:'#531697'},{icon:'🎯',label:'Bulk Aptitude',sub:'JSON batch upload',to:'/dashboard/admin',c:'#13a1a5'},{icon:'👥',label:'Manage Users',sub:'All accounts',to:'/dashboard/admin',c:'#042c5d'}].map(a=>(
              <button key={a.label} onClick={()=>nav(a.to)} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'9px 11px', borderRadius:9, border:`1px solid ${a.c}25`, background:`${a.c}06`, cursor:'pointer', marginBottom:7, textAlign:'left' }}
                onMouseOver={e=>e.currentTarget.style.background=`${a.c}12`} onMouseOut={e=>e.currentTarget.style.background=`${a.c}06`}>
                <div style={{ width:30, height:30, borderRadius:7, background:`${a.c}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.9rem', flexShrink:0 }}>{a.icon}</div>
                <div><div style={{ fontWeight:700, fontSize:'.82rem', color:'#0f1a2e' }}>{a.label}</div><div style={{ fontSize:'.68rem', color:'#7a8ba8' }}>{a.sub}</div></div>
                <span style={{ marginLeft:'auto', color:a.c, fontSize:'.8rem' }}>→</span>
              </button>
            ))}
          </div>
          <div className="card" style={{ padding:'16px 18px' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:12 }}>📊 Skill Distribution</div>
            {cohort?.byLevel ? Object.entries(cohort.byLevel).map(([level,count])=>{
              const pct=cohort.total?Math.round((count/cohort.total)*100):0;
              return (
                <div key={level} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontWeight:700, fontSize:'.8rem', color:'#3d4e6b' }}>{level}</span>
                    <span style={{ fontSize:'.72rem', color:'#b0bec9' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height:7, background:'#f0f3fa', borderRadius:999 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:lc[level]||'#531697', borderRadius:999, transition:'width .8s' }}/>
                  </div>
                </div>
              );
            }) : <div style={{ color:'#b0bec9' }}>Loading…</div>}
          </div>
        </div>
      )}

      {/* Placement Index */}
      {activeTab==='readiness' && placement && (
        <>
          <div className="card" style={{ padding:'20px 24px', marginBottom:14, background:'linear-gradient(135deg,#042c5d,#531697)', border:'none' }}>
            <div style={{ color:'rgba(255,255,255,.65)', fontSize:'.72rem', fontWeight:700, marginBottom:6 }}>OVERALL PLACEMENT READINESS INDEX</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'3rem', color:'#fff', lineHeight:1 }}>{placement.readinessScore}%</div>
              <div style={{ color:'rgba(255,255,255,.65)', fontSize:'.85rem' }}>
                {placement.readinessScore>=70?'✅ Strong — well on track':placement.readinessScore>=50?'⚠️ Moderate — improvement needed':'🔴 Needs urgent action'}
              </div>
            </div>
            <div style={{ marginTop:6, fontSize:'.75rem', color:'rgba(255,255,255,.55)' }}>
              Formula: ATS Score (40%) + Resume Uploaded % (30%) + Skill Level (30%)
            </div>
            <div style={{ display:'flex', gap:20, marginTop:14 }}>
              {[['Avg ATS',`${placement.overall?.avgAts||0}/100`],['With Resume',`${Math.round(((placement.overall?.withResume||0)/Math.max(placement.overall?.total||1,1))*100)}%`],['Experts',`${placement.overall?.expert||0}`],['Active',`${placement.overall?.activeStreaks||0} students`]].map(([l,v])=>(
                <div key={l}><div style={{ color:'rgba(255,255,255,.5)', fontSize:'.62rem' }}>{l}</div><div style={{ color:'#fff', fontWeight:800, fontSize:'.9rem' }}>{v}</div></div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding:'16px 18px' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', marginBottom:12 }}>🏆 Department Leaderboard</div>
            {(placement.deptLeaderboard||[]).map((d,i)=>(
              <div key={d.dept} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid #f0f3fa' }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:i===0?'linear-gradient(135deg,#f59e0b,#ef4444)':i===1?'linear-gradient(135deg,#9ca3af,#6b7280)':i===2?'linear-gradient(135deg,#92400e,#b45309)':'#f0f3fa', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.72rem', color:i<=2?'#fff':'#7a8ba8', flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:'.82rem', color:'#0f1a2e' }}>{d.dept}</div>
                  <div style={{ fontSize:'.68rem', color:'#b0bec9' }}>{d.count} students · avg ATS {d.avgAts}</div>
                </div>
                <div style={{ fontWeight:800, fontSize:'.9rem', color:d.readiness>=70?'#47d372':d.readiness>=50?'#f59e0b':'#ef4444' }}>{d.readiness}%</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Company Demand */}
      {activeTab==='demand' && demand && (
        <div className="card" style={{ padding:'18px 22px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', marginBottom:6 }}>📊 Industry Demand vs Student Supply</div>
          <div style={{ fontSize:'.73rem', color:'#7a8ba8', marginBottom:14 }}>Based on {demand.totalCompanies} companies · {demand.totalStudents} students · Gap = demand − supply</div>
          {(demand.demandGap||[]).map(d=>(
            <div key={d.skill} style={{ padding:'10px 0', borderBottom:'1px solid #f0f3fa' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontWeight:700, fontSize:'.82rem', color:'#0f1a2e', textTransform:'capitalize' }}>{d.skill}</span>
                <span style={{ fontSize:'.72rem', fontWeight:700, color:d.gap>30?'#ef4444':d.gap>10?'#f59e0b':'#47d372' }}>Gap: {d.gap>0?'+':''}+{d.gap}%</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <div><div style={{ fontSize:'.65rem', color:'#7a8ba8', marginBottom:2 }}>Companies demand {d.demand}%</div><div style={{ height:5, background:'#f0f3fa', borderRadius:999 }}><div style={{ height:'100%', width:`${d.demand}%`, background:'#531697', borderRadius:999 }}/></div></div>
                <div><div style={{ fontSize:'.65rem', color:'#7a8ba8', marginBottom:2 }}>Students have {d.supply}%</div><div style={{ height:5, background:'#f0f3fa', borderRadius:999 }}><div style={{ height:'100%', width:`${d.supply}%`, background:'#47d372', borderRadius:999 }}/></div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cohort */}
      {activeTab==='cohort' && (
        <div className="card" style={{ padding:'16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.88rem', color:'#0f1a2e' }}>👥 Full Cohort</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {DEPTS.map(d=>(
                <button key={d} onClick={()=>setDeptFilter(d)} style={{ padding:'4px 10px', borderRadius:999, border:`1px solid ${deptFilter===d?'#531697':'#d0d7e8'}`, background:deptFilter===d?'rgba(83,22,151,.08)':'transparent', color:deptFilter===d?'#531697':'#7a8ba8', fontWeight:700, cursor:'pointer', fontSize:'.7rem', fontFamily:"'Nunito',sans-serif" }}>
                  {d||'All Depts'}
                </button>
              ))}
              {['','1','2','3','4'].map(y=>(
                <button key={y} onClick={()=>setYearFilter(y)} style={{ padding:'4px 10px', borderRadius:999, border:`1px solid ${yearFilter===y?'#531697':'#d0d7e8'}`, background:yearFilter===y?'rgba(83,22,151,.08)':'transparent', color:yearFilter===y?'#531697':'#7a8ba8', fontWeight:700, cursor:'pointer', fontSize:'.7rem', fontFamily:"'Nunito',sans-serif" }}>
                  {y?`Y${y}`:'All Yrs'}
                </button>
              ))}
            </div>
          </div>

          {/* Students */}
          <div style={{ fontSize:'.72rem', fontWeight:800, color:'#531697', marginBottom:7, letterSpacing:'.05em' }}>🎓 STUDENTS ({cohort?.total||0})</div>
          <div style={{ overflowX:'auto', marginBottom:18 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.77rem' }}>
              <thead><tr style={{ borderBottom:'2px solid #e8edf5' }}>
                {['Name','Roll','Year','Dept','Level','Streak','ATS'].map(h=><th key={h} style={{ padding:'6px 8px', textAlign:'left', color:'#3d4e6b', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'.69rem' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {(cohort?.students||[]).map(s=>(
                  <tr key={s._id} style={{ borderBottom:'1px solid #f0f3fa' }}>
                    <td style={{ padding:'7px 8px', fontWeight:700, color:'#0f1a2e' }}>{s.name}</td>
                    <td style={{ padding:'7px 8px', color:'#7a8ba8' }}>{s.rollNumber||'—'}</td>
                    <td style={{ padding:'7px 8px', color:'#7a8ba8' }}>Y{s.year||'—'}</td>
                    <td style={{ padding:'7px 8px', color:'#7a8ba8' }}>{s.department}</td>
                    <td style={{ padding:'7px 8px' }}><span style={{ padding:'1px 6px', borderRadius:999, background:`${lc[s.skillLevel]||'#531697'}15`, color:lc[s.skillLevel]||'#531697', fontWeight:700, fontSize:'.67rem' }}>{s.skillLevel||'Beginner'}</span></td>
                    <td style={{ padding:'7px 8px', color:'#3d4e6b' }}>🔥{s.streak||0}</td>
                    <td style={{ padding:'7px 8px', fontWeight:800, color:'#531697' }}>{s.atsScore||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Faculty */}
          {cohort?.faculty?.length>0 && (
            <>
              <div style={{ fontSize:'.72rem', fontWeight:800, color:'#042c5d', marginBottom:7, letterSpacing:'.05em' }}>👨‍🏫 FACULTY ({cohort.totalFaculty||0})</div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.77rem' }}>
                  <thead><tr style={{ borderBottom:'2px solid #e8edf5' }}>
                    {['Name','Department','Joined'].map(h=><th key={h} style={{ padding:'6px 8px', textAlign:'left', color:'#3d4e6b', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'.69rem' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {cohort.faculty.map(f=>(
                      <tr key={f._id} style={{ borderBottom:'1px solid #f0f3fa' }}>
                        <td style={{ padding:'7px 8px', fontWeight:700, color:'#042c5d' }}>{f.name}</td>
                        <td style={{ padding:'7px 8px', color:'#7a8ba8' }}>{f.department}</td>
                        <td style={{ padding:'7px 8px', color:'#b0bec9', fontSize:'.7rem' }}>{f.createdAt?new Date(f.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role==='admin')   return <AdminDash/>;
  if (user.role==='faculty') return <FacultyDash/>;
  return <StudentDash/>;
}