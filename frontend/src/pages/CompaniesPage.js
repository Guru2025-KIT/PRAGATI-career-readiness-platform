import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const STATUS_CONFIG = {
  visited:  { label: 'Visited',  bg: '#dcfce7', color: '#166534', icon: '✅' },
  upcoming: { label: 'Upcoming', bg: '#dbeafe', color: '#1d4ed8', icon: '📅' },
  expected: { label: 'Expected', bg: '#fef3c7', color: '#92400e', icon: '🔮' },
};

const DIFFICULTY_CONFIG = {
  Easy:   { bg: '#dcfce7', color: '#166534' },
  Medium: { bg: '#fef3c7', color: '#92400e' },
  Hard:   { bg: '#fee2e2', color: '#991b1b' },
};

// ── Company detail drawer ──────────────────────────────────────────────────────
function CompanyDrawer({ company, onClose }) {
  const st = STATUS_CONFIG[company.status] || STATUS_CONFIG.expected;
  const dc = DIFFICULTY_CONFIG[company.difficulty] || DIFFICULTY_CONFIG.Medium;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}
      onClick={onClose}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,.3)' }} />
      <div className="card"
        onClick={e => e.stopPropagation()}
        style={{ width: 420, height: '100vh', borderRadius: '16px 0 0 16px', overflowY: 'auto', padding: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{company.name}</h2>
            <div style={{ fontSize: '.85rem', color: '#64748b', marginTop: 2 }}>{company.sector}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <span style={{ ...st, padding: '4px 12px', borderRadius: 999, fontSize: '.78rem', fontWeight: 700 }}>{st.icon} {st.label}</span>
          {company.difficulty && (
            <span style={{ ...dc, padding: '4px 12px', borderRadius: 999, fontSize: '.78rem', fontWeight: 700 }}>{company.difficulty}</span>
          )}
          {company.ctc && (
            <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '4px 12px', borderRadius: 999, fontSize: '.78rem', fontWeight: 700 }}>💰 {company.ctc}</span>
          )}
        </div>

        {/* Roles */}
        {company.roles?.length > 0 && (
          <Section title="🧑‍💻 Roles Offered">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {company.roles.map(r => (
                <span key={r} style={{ background: '#f1f5fb', color: '#475569', padding: '4px 12px', borderRadius: 999, fontSize: '.82rem', fontWeight: 600 }}>{r}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Recruitment rounds */}
        {company.recruitmentRounds?.length > 0 && (
          <Section title="📋 Recruitment Rounds">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {company.recruitmentRounds.map((round, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1a56db', color: '#fff', fontSize: '.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ fontSize: '.875rem', color: '#0f172a' }}>{round}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Aptitude patterns */}
        {company.aptitudePatterns && (
          <Section title="🎯 Aptitude Patterns">
            <p style={{ fontSize: '.875rem', color: '#475569', lineHeight: 1.6 }}>{company.aptitudePatterns}</p>
          </Section>
        )}

        {/* Interview patterns */}
        {company.interviewPatterns && (
          <Section title="💬 Interview Style">
            <p style={{ fontSize: '.875rem', color: '#475569', lineHeight: 1.6 }}>{company.interviewPatterns}</p>
          </Section>
        )}

        {/* Eligibility */}
        {company.eligibilityCriteria && (
          <Section title="✅ Eligibility Criteria">
            <div style={{ fontSize: '.875rem', color: '#475569', lineHeight: 2 }}>
              {company.eligibilityCriteria.minCGPA && <div>Min CGPA: <strong>{company.eligibilityCriteria.minCGPA}</strong></div>}
              {company.eligibilityCriteria.allowedBranches?.length > 0 && (
                <div>Branches: <strong>{company.eligibilityCriteria.allowedBranches.join(', ')}</strong></div>
              )}
              <div>Active backlogs allowed: <strong>{company.eligibilityCriteria.backlogs ? 'Yes' : 'No'}</strong></div>
            </div>
          </Section>
        )}

        {/* Visit date */}
        {company.campusVisitDate && (
          <Section title="📅 Campus Visit">
            <div style={{ fontSize: '.875rem', color: '#0f172a', fontWeight: 600 }}>
              {new Date(company.campusVisitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </Section>
        )}

        {/* Website */}
        {company.website && (
          <a href={company.website} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            Visit Company Website →
          </a>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

// ── Company card ──────────────────────────────────────────────────────────────
function CompanyCard({ company, onClick }) {
  const st = STATUS_CONFIG[company.status] || STATUS_CONFIG.expected;
  const dc = DIFFICULTY_CONFIG[company.difficulty];

  return (
    <div className="card" onClick={onClick} style={{ padding: '16px 20px', cursor: 'pointer', transition: 'box-shadow .15s', ':hover': { boxShadow: '0 4px 20px rgba(0,0,0,.1)' } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{company.name}</h3>
          <span style={{ fontSize: '.78rem', color: '#64748b' }}>{company.sector}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ ...st, padding: '3px 10px', borderRadius: 999, fontSize: '.72rem', fontWeight: 700 }}>{st.icon} {st.label}</span>
          {dc && <span style={{ ...dc, padding: '3px 10px', borderRadius: 999, fontSize: '.72rem', fontWeight: 700 }}>{company.difficulty}</span>}
        </div>
      </div>

      {company.roles?.length > 0 && (
        <div style={{ fontSize: '.78rem', color: '#64748b', marginBottom: 8 }}>
          Roles: {company.roles.slice(0, 2).join(', ')}{company.roles.length > 2 ? ` +${company.roles.length - 2}` : ''}
        </div>
      )}
      {company.ctc && (
        <div style={{ fontSize: '.78rem', color: '#7c3aed', fontWeight: 600 }}>💰 {company.ctc}</div>
      )}

      <div style={{ marginTop: 10, fontSize: '.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
        <span>{company.recruitmentRounds?.length || 0} rounds</span>
        <span style={{ color: '#1a56db', fontWeight: 600 }}>View details →</span>
      </div>
    </div>
  );
}

// ── Main Companies Page ───────────────────────────────────────────────────────
export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('pragati_token');
    fetch(`${API}/companies`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCompanies(d.companies || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter(c => {
    const matchTab = activeTab === 'all' || c.status === activeTab;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.sector?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    all: companies.length,
    visited: companies.filter(c => c.status === 'visited').length,
    upcoming: companies.filter(c => c.status === 'upcoming').length,
    expected: companies.filter(c => c.status === 'expected').length,
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>🏢 Companies</h1>
        <p style={{ fontSize: '.875rem', color: '#64748b', marginTop: 4 }}>Companies that have visited or are expected to recruit from campus.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Visited', count: counts.visited, color: '#10b981', icon: '✅' },
          { label: 'Upcoming', count: counts.upcoming, color: '#1a56db', icon: '📅' },
          { label: 'Expected', count: counts.expected, color: '#f59e0b', icon: '🔮' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: '.78rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'visited', 'upcoming', 'expected'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f4',
            background: activeTab === tab ? '#1a56db' : '#fff',
            color: activeTab === tab ? '#fff' : '#475569',
            fontWeight: 600, fontSize: '.82rem', cursor: 'pointer', textTransform: 'capitalize',
          }}>
            {tab === 'all' ? `All (${counts.all})` : `${STATUS_CONFIG[tab].icon} ${tab} (${counts[tab]})`}
          </button>
        ))}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search company or sector..."
          style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f4', fontFamily: 'inherit', fontSize: '.85rem', outline: 'none', flex: 1, minWidth: 180 }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(c => (
            <CompanyCard key={c._id} company={c} onClick={() => setSelected(c)} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: '#94a3b8' }}>
              No companies found.
            </div>
          )}
        </div>
      )}

      {selected && <CompanyDrawer company={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
