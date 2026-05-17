import React, { useState, useEffect } from 'react';
import { RoundHeader, Card, SectionTitle, AnswerBox, Timer } from './PracticeComponents';
import { ROUND_RESOURCES } from './RESOURCES';

const DOS_DONTS = [
  { type: 'do', text: 'Listen actively when others speak' },
  { type: 'do', text: 'Maintain eye contact with all participants' },
  { type: 'do', text: 'Use data and examples to support your points' },
  { type: 'do', text: 'Acknowledge good points made by others' },
  { type: 'do', text: 'Be the one to summarize or conclude if possible' },
  { type: 'do', text: 'Speak clearly and at a moderate pace' },
  { type: 'dont', text: "Don't interrupt others while they're speaking" },
  { type: 'dont', text: "Don't shout or become aggressive" },
  { type: 'dont', text: "Don't repeat the same point multiple times" },
  { type: 'dont', text: "Don't stay silent throughout the discussion" },
  { type: 'dont', text: "Don't use jargon without explaining it" },
  { type: 'dont', text: "Don't deviate from the topic" },
];

const GD_TOPICS = [
  { topic: 'Should AI replace human jobs?', category: 'Technology', difficulty: 'Medium', keyPoints: ['Automation benefits', 'Job displacement', 'New job creation', 'Reskilling', 'Human creativity'] },
  { topic: 'Work from home vs. office — which is better for productivity?', category: 'Corporate', difficulty: 'Easy', keyPoints: ['Flexibility', 'Collaboration', 'Mental health', 'Infrastructure', 'Work-life balance'] },
  { topic: 'Is social media doing more harm than good?', category: 'Society', difficulty: 'Easy', keyPoints: ['Mental health impact', 'Misinformation', 'Connectivity', 'Business opportunities', 'Addiction'] },
  { topic: 'Electric vehicles: Are they truly the future of transport?', category: 'Environment', difficulty: 'Medium', keyPoints: ['Battery technology', 'Charging infrastructure', 'Carbon emissions', 'Cost', 'Range anxiety'] },
  { topic: 'Brain drain from India — a problem or opportunity?', category: 'Economics', difficulty: 'Hard', keyPoints: ['Talent emigration', 'Remittances', 'Startup ecosystem', 'Policy reforms', 'Global exposure'] },
  { topic: 'Should the voting age be reduced to 16?', category: 'Politics', difficulty: 'Medium', keyPoints: ['Maturity', 'Civic responsibility', 'Youth representation', 'International examples', 'Education'] },
  { topic: 'Cryptocurrency — boon or bane for the global economy?', category: 'Finance', difficulty: 'Hard', keyPoints: ['Decentralization', 'Volatility', 'Regulation', 'Financial inclusion', 'Fraud'] },
  { topic: 'Online education vs. traditional classroom learning', category: 'Education', difficulty: 'Easy', keyPoints: ['Accessibility', 'Engagement', 'Practical skills', 'Cost', 'Infrastructure'] },
];

const MODEL_ANSWERS = {
  'Should AI replace human jobs?': `AI is transforming industries at an unprecedented pace. While it's true that AI will automate repetitive tasks — like data entry, basic customer service, and assembly line work — this doesn't necessarily mean mass unemployment. History shows that every technological revolution creates more jobs than it destroys. The Industrial Revolution moved people from farms to factories; AI will move us from routine tasks to higher cognitive work. The key lies in reskilling. Governments and corporations must invest in retraining workforces for AI-adjacent roles: prompt engineering, AI ethics, data labeling, and creative problem-solving — areas where human judgment remains irreplaceable. The real question isn't whether AI will replace jobs, but whether we'll adapt fast enough.`,
};

export default function GDRoundPage() {
  const [tab, setTab] = useState('rules');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [answer, setAnswer] = useState('');
  const [timerActive, setTimerActive] = useState(false);
  const [timeDone, setTimeDone] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const [showRes, setShowRes]     = useState(false);

  const cats = ['All', ...new Set(GD_TOPICS.map(t => t.category))];
  const filtered = filterCat === 'All' ? GD_TOPICS : GD_TOPICS.filter(t => t.category === filterCat);

  function startPractice(topic) {
    setSelectedTopic(topic);
    setAnswer('');
    setTimerActive(false);
    setTimeDone(false);
    setShowModel(false);
    setTab('practice');
  }

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif" }}>
      <RoundHeader icon="🔵" title="Group Discussion Practice" subtitle="Learn GD strategies, explore topics, and practice structured responses" />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap:'wrap', alignItems:'center' }}>
        {[['rules', '📋 Do\'s & Don\'ts'], ['topics', '📝 GD Topics'], ['practice', '⏱️ Practice Mode']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '8px 18px', borderRadius: 9, border: `1.5px solid ${tab === id ? '#531697' : '#d0d7e8'}`, background: tab === id ? 'linear-gradient(135deg,#531697,#13a1a5)' : '#fff', color: tab === id ? '#fff' : '#7a8ba8', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontSize: '.82rem', transition: 'all .15s' }}>
            {label}
          </button>
        ))}
        <div style={{flex:1}}/>
        <button onClick={()=>setShowRes(r=>!r)}
          style={{ padding:'7px 14px', borderRadius:9, border:`1.5px solid ${showRes?'#531697':'#d0d7e8'}`, background:showRes?'rgba(83,22,151,0.07)':'#fff', color:showRes?'#531697':'#7a8ba8', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontSize:'.78rem' }}>
          📚 {showRes?'Hide':'Resources'}
        </button>
      </div>

      {/* Resources panel */}
      {showRes && (
        <div style={{ background:'rgba(83,22,151,0.03)', border:'1px solid rgba(83,22,151,0.12)', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
          <div style={{ fontSize:'.7rem', fontWeight:800, color:'#b0bec9', marginBottom:10 }}>BEST GD RESOURCES ONLINE</div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {ROUND_RESOURCES.GD.map((r,i)=>(
              <a key={i} href={r.url} target="_blank" rel="noreferrer"
                style={{ padding:'5px 11px', borderRadius:7, background:r.color+'18', color:r.color, fontSize:'.72rem', fontWeight:800, textDecoration:'none', border:`1px solid ${r.color}30` }}>
                {r.tag} — {r.name} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Do's and Don'ts */}
      {tab === 'rules' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <SectionTitle>✅ Do's</SectionTitle>
            {DOS_DONTS.filter(d => d.type === 'do').map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(71,211,114,0.15)', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: '.83rem', color: '#3d4e6b', lineHeight: 1.5 }}>{d.text}</span>
              </div>
            ))}
          </Card>
          <Card>
            <SectionTitle>❌ Don'ts</SectionTitle>
            {DOS_DONTS.filter(d => d.type === 'dont').map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', flexShrink: 0, marginTop: 1 }}>✗</span>
                <span style={{ fontSize: '.83rem', color: '#3d4e6b', lineHeight: 1.5 }}>{d.text}</span>
              </div>
            ))}
          </Card>
          <Card style={{ gridColumn: '1/-1', background: 'rgba(83,22,151,0.03)', border: '1px solid rgba(83,22,151,0.12)' }}>
            <SectionTitle>🏆 GD Scoring Criteria</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
              {[['Communication', 'Clarity, fluency, vocabulary'], ['Content', 'Relevance, depth, examples'], ['Leadership', 'Initiating, summarizing'], ['Teamwork', 'Listening, acknowledging others'], ['Confidence', 'Body language, assertiveness'], ['Logic', 'Structured, data-backed arguments']].map(([title, desc]) => (
                <div key={title} style={{ padding: '10px 12px', borderRadius: 10, background: '#fff', border: '1px solid #e8edf5' }}>
                  <div style={{ fontWeight: 800, fontSize: '.78rem', color: '#531697', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: '.72rem', color: '#7a8ba8' }}>{desc}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Topics */}
      {tab === 'topics' && (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {cats.map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                style={{ padding: '5px 12px', borderRadius: 999, border: `1px solid ${filterCat === c ? '#531697' : '#d0d7e8'}`, background: filterCat === c ? 'rgba(83,22,151,0.08)' : '#fff', color: filterCat === c ? '#531697' : '#7a8ba8', fontWeight: 700, fontSize: '.75rem', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                {c}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((t, i) => (
              <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#0f1a2e', marginBottom: 5 }}>{t.topic}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(83,22,151,0.07)', color: '#531697', fontSize: '.68rem', fontWeight: 700 }}>{t.category}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 999, background: t.difficulty === 'Easy' ? 'rgba(71,211,114,0.1)' : t.difficulty === 'Hard' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: t.difficulty === 'Easy' ? '#166534' : t.difficulty === 'Hard' ? '#991b1b' : '#92400e', fontSize: '.68rem', fontWeight: 700 }}>{t.difficulty}</span>
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {t.keyPoints.map(kp => <span key={kp} style={{ padding: '1px 6px', borderRadius: 5, background: '#f0f3fa', color: '#7a8ba8', fontSize: '.65rem' }}>{kp}</span>)}
                  </div>
                </div>
                <button onClick={() => startPractice(t)}
                  style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#531697,#13a1a5)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontSize: '.78rem', flexShrink: 0 }}>
                  Practice →
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Practice Mode */}
      {tab === 'practice' && (
        <div>
          {!selectedTopic ? (
            <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💬</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1rem', color: '#0f1a2e', marginBottom: 6 }}>No topic selected</div>
              <div style={{ color: '#7a8ba8', fontSize: '.84rem', marginBottom: 16 }}>Go to GD Topics tab and click "Practice" on any topic</div>
              <button onClick={() => setTab('topics')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#531697,#13a1a5)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>Browse Topics →</button>
            </Card>
          ) : (
            <div>
              <Card style={{ marginBottom: 16, background: 'linear-gradient(135deg,rgba(83,22,151,0.04),rgba(19,161,165,0.04))', border: '1.5px solid rgba(83,22,151,0.15)' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1rem', color: '#0f1a2e', marginBottom: 6 }}>📌 Topic</div>
                <div style={{ fontSize: '.95rem', color: '#531697', fontWeight: 700, marginBottom: 12 }}>{selectedTopic.topic}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {!timerActive && !timeDone && (
                    <button onClick={() => setTimerActive(true)}
                      style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: '#13a1a5', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontSize: '.82rem' }}>
                      ⏱️ Start 2-min Timer
                    </button>
                  )}
                  {timeDone && <span style={{ padding: '8px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.1)', color: '#991b1b', fontWeight: 800, fontSize: '.82rem' }}>⏰ Time's up!</span>}
                  <button onClick={() => { setSelectedTopic(null); setTimerActive(false); }}
                    style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid #d0d7e8', background: '#fff', color: '#7a8ba8', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontSize: '.78rem' }}>
                    Change Topic
                  </button>
                </div>
                {timerActive && !timeDone && <Timer seconds={120} onDone={() => setTimeDone(true)} />}
              </Card>
              <Card style={{ marginBottom: 16 }}>
                <SectionTitle>✍️ Your Response</SectionTitle>
                <AnswerBox value={answer} onChange={setAnswer} placeholder="Structure your GD response: Introduction → Your stance → Supporting arguments → Counter-argument → Conclusion…" rows={8} />
              </Card>
              <Card style={{ marginBottom: 16, background: 'rgba(83,22,151,0.03)', border: '1px solid rgba(83,22,151,0.1)' }}>
                <SectionTitle>💡 Key Points to Cover</SectionTitle>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedTopic.keyPoints.map(kp => {
                    const covered = answer.toLowerCase().includes(kp.toLowerCase());
                    return (
                      <span key={kp} style={{ padding: '4px 10px', borderRadius: 999, fontSize: '.75rem', fontWeight: 700, background: covered ? 'rgba(71,211,114,0.12)' : '#f0f3fa', color: covered ? '#166534' : '#7a8ba8', border: `1px solid ${covered ? 'rgba(71,211,114,0.3)' : '#e8edf5'}`, transition: 'all .3s' }}>
                        {covered ? '✅ ' : ''}{kp}
                      </span>
                    );
                  })}
                </div>
              </Card>
              {MODEL_ANSWERS[selectedTopic.topic] && (
                <Card>
                  <button onClick={() => setShowModel(s => !s)}
                    style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: showModel ? '#f0f3fa' : 'linear-gradient(135deg,#531697,#13a1a5)', color: showModel ? '#531697' : '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontSize: '.85rem' }}>
                    {showModel ? '🙈 Hide Model Answer' : '📖 Show Model Answer'}
                  </button>
                  {showModel && (
                    <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 10, background: 'rgba(83,22,151,0.04)', border: '1px solid rgba(83,22,151,0.12)', fontSize: '.85rem', color: '#3d4e6b', lineHeight: 1.8 }}>
                      {MODEL_ANSWERS[selectedTopic.topic]}
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
