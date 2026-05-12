import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
         BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const API  = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tk   = () => ({ Authorization:`Bearer ${localStorage.getItem('pragati_token')}` });
const GRAD = 'linear-gradient(135deg,#531697,#13a1a5)';

function ScoreRing({ score, label, color, size = 90 }) {
  const r   = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ textAlign:'center' }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0f3fa" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${circ}`} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition:'stroke-dashoffset 1.2s ease' }} />
      </svg>
      <div style={{ marginTop:-size/2-4, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize: size>80?'1.3rem':'.95rem', color:'#0f1a2e' }}>{score}</div>
      <div style={{ marginTop: size/2-8, fontSize:'.7rem', fontWeight:700, color:'#7a8ba8', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
    </div>
  );
}

export default function GDReportPage() {
  const { code, userId } = useParams();
  const location         = useLocation();
  const nav              = useNavigate();
  const [data, setData]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try passed state first, then API
    const passedEval = location.state?.evalData;
    if (passedEval) {
      const me = passedEval.participants?.find(p => p.userId === userId);
      if (me) {
        setData({
          participant: me, topic: location.state?.topic,
          roomCode: code, myStats: location.state?.myStats,
        });
        setLoading(false); return;
      }
    }
    fetch(`${API}/gd/rooms/${code}/report/${userId}`, { headers:tk() })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [code, userId, location.state]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'50vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:40,height:40,border:'3px solid #e8edf5',borderTopColor:'#531697',borderRadius:'50%',animation:'_s .7s linear infinite' }}/>
      <style>{`@keyframes _s{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color:'#b0bec9' }}>Generating AI evaluation…</div>
    </div>
  );

  if (!data?.participant) return (
    <div style={{ textAlign:'center', padding:60 }}>
      <div style={{ fontSize:'2rem', marginBottom:12 }}>📋</div>
      <div style={{ color:'#7a8ba8' }}>Report not available yet. Please wait for evaluation to complete.</div>
      <button onClick={()=>nav('/dashboard/gd')} style={{ marginTop:16, padding:'9px 20px', borderRadius:10, border:'none', background:GRAD, color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>← Back to Lobby</button>
    </div>
  );

  const { participant, topic, myStats } = data;
  const scores = participant.aiScore || {};
  const overall = scores.overall || 0;
  const overallColor = overall >= 75 ? '#47d372' : overall >= 55 ? '#f59e0b' : '#ef4444';
  const overallLabel = overall >= 75 ? 'Excellent — Ready for Placement GD!' : overall >= 55 ? 'Good — Minor improvements needed' : 'Developing — Practice more GDs';

  const radarData = [
    { subject:'Communication', score: scores.communication || 0 },
    { subject:'Confidence',    score: scores.confidence    || 0 },
    { subject:'Leadership',    score: scores.leadership    || 0 },
    { subject:'Participation', score: scores.participation || 0 },
  ];

  const barData = [
    { name:'Speaking\nTime', val: participant.speakingTime || 0, unit:'s', color:'#531697' },
    { name:'Words\nSpoken',  val: participant.wordCount    || 0, unit:'',  color:'#13a1a5' },
    { name:'Filler\nWords',  val: participant.fillerWords  || 0, unit:'',  color:'#f59e0b' },
    { name:'Interruptions',  val: participant.interruptions|| 0, unit:'',  color:'#ef4444' },
  ];

  const placementReadiness = [
    { area:'Communication Readiness', score: scores.communication || 0 },
    { area:'Leadership Readiness',    score: scores.leadership    || 0 },
    { area:'GD Readiness',            score: Math.round(((scores.communication||0)+(scores.confidence||0)+(scores.leadership||0)+(scores.participation||0))/4) },
    { area:'Overall Placement',       score: overall },
  ];

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", maxWidth:1000, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ background:GRAD, borderRadius:16, padding:'24px 28px', marginBottom:20, color:'#fff' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.4rem', marginBottom:4 }}>📊 AI Evaluation Report</div>
            <div style={{ color:'rgba(255,255,255,.8)', fontSize:'.85rem' }}>{participant.name} · Room {code}</div>
            {topic && <div style={{ marginTop:6, padding:'4px 12px', background:'rgba(255,255,255,.15)', borderRadius:999, fontSize:'.78rem', display:'inline-block' }}>Topic: "{topic}"</div>}
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'3rem', lineHeight:1 }}>{overall}</div>
            <div style={{ fontSize:'.75rem', opacity:.8 }}>/ 100 Overall</div>
            <div style={{ marginTop:4, fontSize:'.72rem', background:'rgba(255,255,255,.2)', padding:'3px 10px', borderRadius:999 }}>{overallLabel}</div>
          </div>
        </div>
      </div>

      {/* Score rings row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        <div className="card" style={{ padding:'16px 8px', textAlign:'center' }}>
          <ScoreRing score={overall} label="Overall" color={overallColor} size={90} />
        </div>
        {[['Communication',scores.communication||0,'#531697'],['Confidence',scores.confidence||0,'#13a1a5'],['Leadership',scores.leadership||0,'#f59e0b'],['Participation',scores.participation||0,'#47d372']].map(([l,s,c])=>(
          <div key={l} className="card" style={{ padding:'16px 8px', textAlign:'center' }}>
            <ScoreRing score={s} label={l} color={c} size={80} />
          </div>
        ))}
      </div>

      {/* Radar + Bar charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div className="card" style={{ padding:'18px 20px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.9rem', marginBottom:12 }}>🕸️ Communication Radar</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" style={{ fontSize:'.72rem' }} />
              <Radar name={participant.name} dataKey="score" stroke="#531697" fill="#531697" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding:'18px 20px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.9rem', marginBottom:12 }}>📊 Participation Analytics</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top:5, right:10, left:0, bottom:20 }}>
              <XAxis dataKey="name" style={{ fontSize:'.65rem' }} />
              <YAxis style={{ fontSize:'.65rem' }} />
              <Tooltip formatter={(v,n,p)=>[`${v}${barData.find(b=>b.name===p.payload.name)?.unit||''}`,p.payload.name]} />
              <Bar dataKey="val" radius={[6,6,0,0]}>
                {barData.map((b,i)=><Cell key={i} fill={b.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Summary */}
      <div className="card" style={{ padding:'20px 22px', marginBottom:14 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', marginBottom:12 }}>🤖 AI Behavioral Summary</div>
        <div style={{ padding:'14px 16px', background:'rgba(83,22,151,0.04)', borderRadius:10, fontSize:'.88rem', color:'#3d4e6b', lineHeight:1.7, marginBottom:14, borderLeft:'3px solid #531697' }}>
          {scores.summary || 'AI evaluation summary not available.'}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:'.82rem', color:'#166534', marginBottom:8 }}>✅ Key Strengths</div>
            {(scores.strengths || ['Active participant','Clear communication']).map((s,i)=>(
              <div key={i} style={{ display:'flex', gap:8, padding:'6px 10px', background:'rgba(71,211,114,0.07)', borderRadius:8, marginBottom:5, fontSize:'.82rem', color:'#166534' }}>
                <span>⭐</span><span>{s}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:'.82rem', color:'#991b1b', marginBottom:8 }}>🔧 Improvement Areas</div>
            {(scores.improvements || ['Reduce filler words','Speak more confidently']).map((s,i)=>(
              <div key={i} style={{ display:'flex', gap:8, padding:'6px 10px', background:'rgba(239,68,68,0.07)', borderRadius:8, marginBottom:5, fontSize:'.82rem', color:'#991b1b' }}>
                <span>📌</span><span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Placement Readiness */}
      <div className="card" style={{ padding:'20px 22px', marginBottom:20 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'.95rem', marginBottom:14 }}>🏢 Placement Readiness Indicators</div>
        {placementReadiness.map(({ area, score }) => {
          const c = score >= 75 ? '#47d372' : score >= 55 ? '#f59e0b' : '#ef4444';
          const label = score >= 75 ? 'Ready' : score >= 55 ? 'Improving' : 'Needs Work';
          return (
            <div key={area} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontWeight:700, fontSize:'.83rem', color:'#0f1a2e' }}>{area}</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ padding:'1px 8px', borderRadius:999, background:`${c}15`, color:c, fontSize:'.68rem', fontWeight:700 }}>{label}</span>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:c }}>{score}%</span>
                </div>
              </div>
              <div style={{ height:8, background:'#f0f3fa', borderRadius:999, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${score}%`, background:c, borderRadius:999, transition:'width 1s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:30 }}>
        <button onClick={()=>nav('/dashboard/gd')} style={{ padding:'11px 28px', borderRadius:10, border:'1.5px solid rgba(83,22,151,.3)', background:'rgba(83,22,151,.06)', color:'#531697', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Practice Again</button>
        <button onClick={()=>window.print()} style={{ padding:'11px 28px', borderRadius:10, border:'none', background:GRAD, color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>🖨️ Download Report</button>
      </div>
    </div>
  );
}
