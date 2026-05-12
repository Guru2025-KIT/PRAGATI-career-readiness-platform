import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API  = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tk   = () => ({ Authorization:`Bearer ${localStorage.getItem('pragati_token')}`, 'Content-Type':'application/json' });

const COMPANIES = ['Any','TCS','Infosys','Wipro','Cognizant','Capgemini','Accenture'];
const GRAD = 'linear-gradient(135deg,#531697,#13a1a5)';

export default function GDLobbyPage() {
  const { user }    = useAuth();
  const nav         = useNavigate();
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [form, setForm]   = useState({
    company:'Any', difficulty:'Medium', minParticipants:3, maxParticipants:5,
    durationSeconds:600, language:'English', isPrivate:false,
  });
  const [msg, setMsg] = useState('');

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetch(`${API}/gd/rooms`, { headers:tk() }).then(r=>r.json());
      setRooms(d.rooms || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadRooms(); const t = setInterval(loadRooms, 8000); return ()=>clearInterval(t); }, [loadRooms]);

  async function createRoom(e) {
    e.preventDefault(); setMsg('');
    try {
      const d = await fetch(`${API}/gd/rooms`, { method:'POST', headers:tk(), body:JSON.stringify({ ...form, company: form.company==='Any'?'':form.company }) }).then(r=>r.json());
      if (d.room) nav(`/dashboard/gd/${d.room.roomCode}`);
      else setMsg(d.error || 'Failed to create room');
    } catch { setMsg('Network error'); }
  }

  async function joinRoom(code) {
    const c = (code || joinCode).toUpperCase().trim();
    if (!c) { setMsg('Enter a room code'); return; }
    const d = await fetch(`${API}/gd/rooms/${c}`, { headers:tk() }).then(r=>r.json());
    if (d.room) nav(`/dashboard/gd/${c}`);
    else setMsg('Room not found or no longer available');
  }

  const INP = { style:{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #d0d7e8', fontFamily:"'Nunito',sans-serif", fontSize:'.875rem', outline:'none', background:'#fafbff', boxSizing:'border-box' } };
  const LBL = s => <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#3d4e6b', marginBottom:4, fontFamily:"'Syne',sans-serif" }}>{s}</label>;
  const stateColor = { waiting:'#47d372', locked:'#ef4444', active:'#f59e0b', completed:'#b0bec9' };

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", maxWidth:1100, margin:'0 auto', padding:'0 4px' }}>
      {/* Header */}
      <div style={{ background:GRAD, borderRadius:16, padding:'24px 28px', marginBottom:20, color:'#fff' }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', marginBottom:6 }}>🎤 Group Discussion — Placement Round</div>
        <p style={{ color:'rgba(255,255,255,.8)', fontSize:'.88rem', margin:0 }}>
          Simulate real company GD rounds. AI moderator • Live analytics • Placement score
        </p>
        <div style={{ display:'flex', gap:16, marginTop:14, flexWrap:'wrap' }}>
          {[['🔒','Room locks at min participants'],['🤖','AI participants fill empty slots'],['📊','Individual AI evaluation report'],['🌐','English / Hindi / Hinglish']].map(([ic,t])=>(
            <div key={t} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.78rem', color:'rgba(255,255,255,.85)' }}>
              <span>{ic}</span><span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:14 }}>
        {/* LEFT — Create + Join */}
        <div>
          {/* Quick Join */}
          <div className="card" style={{ padding:'18px 20px', marginBottom:12 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', marginBottom:12 }}>🔑 Join with Code</div>
            <div style={{ display:'flex', gap:8 }}>
              <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code…" maxLength={8}
                style={{ flex:1, padding:'10px 14px', borderRadius:9, border:'1.5px solid #d0d7e8', fontFamily:'monospace', fontSize:'1rem', outline:'none', letterSpacing:'0.1em', textTransform:'uppercase' }} />
              <button onClick={()=>joinRoom()} style={{ padding:'10px 18px', borderRadius:9, border:'none', background:GRAD, color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Join →</button>
            </div>
          </div>

          {/* Create Room */}
          <div className="card" style={{ padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem' }}>➕ Create New Room</div>
            </div>
            <form onSubmit={createRoom}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  {LBL('Company Context')}
                  <select {...INP} value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))}>
                    {COMPANIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  {LBL('Difficulty')}
                  <select {...INP} value={form.difficulty} onChange={e=>setForm(f=>({...f,difficulty:e.target.value}))}>
                    {['Easy','Medium','Hard'].map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  {LBL(`Min Participants (${form.minParticipants})`)}
                  <input type="range" min={2} max={8} value={form.minParticipants}
                    onChange={e=>setForm(f=>({...f,minParticipants:+e.target.value, maxParticipants:Math.max(+e.target.value,f.maxParticipants)}))}
                    style={{ width:'100%', accentColor:'#531697' }} />
                </div>
                <div>
                  {LBL(`Max Participants (${form.maxParticipants})`)}
                  <input type="range" min={form.minParticipants} max={8} value={form.maxParticipants}
                    onChange={e=>setForm(f=>({...f,maxParticipants:+e.target.value}))}
                    style={{ width:'100%', accentColor:'#13a1a5' }} />
                </div>
                <div>
                  {LBL(`Duration (${form.durationSeconds/60} min)`)}
                  <input type="range" min={180} max={1200} step={60} value={form.durationSeconds}
                    onChange={e=>setForm(f=>({...f,durationSeconds:+e.target.value}))}
                    style={{ width:'100%', accentColor:'#531697' }} />
                </div>
                <div>
                  {LBL('Language')}
                  <select {...INP} value={form.language} onChange={e=>setForm(f=>({...f,language:e.target.value}))}>
                    {['English','Hindi','Hinglish'].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.8rem', fontWeight:700, color:'#3d4e6b', marginBottom:12, cursor:'pointer' }}>
                <input type="checkbox" checked={form.isPrivate} onChange={e=>setForm(f=>({...f,isPrivate:e.target.checked}))} style={{ accentColor:'#531697' }} />
                Private Room (invite-only)
              </label>
              {msg && <div style={{ marginBottom:10, padding:'8px 12px', borderRadius:8, fontSize:'.82rem', fontWeight:600, background:msg.includes('✅')?'#dcfce7':'#fee2e2', color:msg.includes('✅')?'#166534':'#991b1b' }}>{msg}</div>}
              <button type="submit" style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', background:GRAD, color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.9rem' }}>
                🎤 Create & Host Room
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT — Open Rooms */}
        <div className="card" style={{ padding:'18px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem' }}>🌐 Live Rooms</div>
            <button onClick={loadRooms} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #d0d7e8', background:'transparent', color:'#531697', fontWeight:700, fontSize:'.75rem', cursor:'pointer' }}>↻ Refresh</button>
          </div>
          {loading && <div style={{ textAlign:'center', padding:20, color:'#b0bec9' }}>Loading rooms…</div>}
          {!loading && rooms.length === 0 && (
            <div style={{ textAlign:'center', padding:'30px 0', color:'#b0bec9' }}>
              <div style={{ fontSize:'2rem', marginBottom:8 }}>🎤</div>
              <div style={{ fontSize:'.85rem' }}>No open rooms. Create one and invite classmates!</div>
            </div>
          )}
          {rooms.map(r => {
            const count = r.participants?.length || 0;
            const sc    = stateColor[r.state] || '#531697';
            return (
              <div key={r.roomCode} style={{ padding:'12px 14px', borderRadius:10, border:'1px solid #e8edf5', marginBottom:8, background:'#fafbff' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <div style={{ fontFamily:'monospace', fontWeight:800, fontSize:'1rem', color:'#531697', background:'rgba(83,22,151,0.08)', padding:'3px 10px', borderRadius:6 }}>{r.roomCode}</div>
                  <div style={{ flex:1 }}>
                    <span style={{ fontWeight:700, fontSize:'.82rem', color:'#0f1a2e' }}>{r.companyContext || 'General'}</span>
                    <span style={{ marginLeft:8, fontSize:'.72rem', color:'#7a8ba8' }}>{r.language} · {r.difficulty}</span>
                  </div>
                  <span style={{ padding:'2px 8px', borderRadius:999, background:`${sc}15`, color:sc, fontSize:'.68rem', fontWeight:700 }}>{r.state}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:'.75rem', color:'#7a8ba8' }}>
                    👥 {count}/{r.maxParticipants} · needs {r.minParticipants} to start
                    <div style={{ marginTop:4, height:5, background:'#f0f3fa', borderRadius:999, width:120 }}>
                      <div style={{ height:'100%', width:`${(count/r.maxParticipants)*100}%`, background:GRAD, borderRadius:999 }} />
                    </div>
                  </div>
                  {r.state === 'waiting' && count < r.maxParticipants
                    ? <button onClick={()=>joinRoom(r.roomCode)} style={{ padding:'6px 16px', borderRadius:8, border:'none', background:GRAD, color:'#fff', fontWeight:800, cursor:'pointer', fontSize:'.78rem' }}>Join →</button>
                    : <span style={{ fontSize:'.72rem', color:'#b0bec9', fontWeight:600 }}>Locked</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
