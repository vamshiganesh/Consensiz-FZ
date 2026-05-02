import React from 'react';
import { FileText, Shield, Bell, DollarSign, Upload, Search, Download, ExternalLink, Clock } from 'lucide-react';

export function Dashboard() {
  const stats = [
    { label: 'Contracts Scanned', value: '1,284', trend: '+12% this week', trendColor: 'var(--success)', icon: <FileText size={20} /> },
    { label: 'Vulnerabilities Found', value: '47', trend: '3 Critical Pending', trendColor: 'var(--warning)', icon: <Shield size={20} /> },
    { label: 'Active Alerts', value: '12', trend: 'Requires attention', trendColor: 'var(--text-muted)', icon: <Bell size={20} /> },
    { label: 'Funds Tracked (USD)', value: '$4.2B', trend: 'Secure in protocols', trendColor: 'var(--success)', icon: <DollarSign size={20} /> },
  ];

  const pipeline = [
    { time: '10 mins ago', title: 'Fuzz test completed on', target: 'VaultProxy.sol', desc: '100,000 sequences generated. 0 critical vulnerabilities found.', color: 'var(--success)' },
    { time: '2 hours ago', title: 'Static analysis flagged warning in', target: 'TokenBridge.sol', desc: 'Potential reentrancy pattern detected. Review recommended.', color: 'var(--warning)' },
    { time: '5 hours ago', title: 'New audit scope defined for', target: 'Project Alpha', desc: 'Scope includes 15 smart contracts across 3 repositories.', color: 'var(--primary)' },
  ];

  const findings = [
    { severity: 'Critical', type: 'Reentrancy Attack Vector', contract: 'Exchange.sol', status: 'Open', statusColor: 'var(--warning)' },
    { severity: 'High', type: 'Integer Overflow Risk', contract: 'StakingPool.sol', status: 'Investigating', statusColor: 'var(--warning)' },
    { severity: 'Medium', type: 'Unauthorized Access', contract: 'AdminProxy.sol', status: 'Resolved', statusColor: 'var(--success)' },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>System status and auditing pipeline activity.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontWeight: 700, borderRadius: '12px' }}>+ New Scan</button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-6" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</h3>
              <div style={{ color: 'var(--text-muted)', opacity: 0.4 }}>{stat.icon}</div>
            </div>
            <div style={{ fontSize: '2.75rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>{stat.value}</div>
            <div style={{ fontSize: '0.9rem', color: stat.trendColor, fontWeight: 700 }}>{stat.trend}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', marginBottom: '3rem' }}>
        {/* Activity Pipeline */}
        <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Activity Pipeline</h2>
            <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>View All</button>
          </div>
          <div className="flex-col gap-10">
            {pipeline.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: item.color, boxShadow: `0 0 10px ${item.color}44` }}></div>
                  {i !== pipeline.length - 1 && <div style={{ flex: 1, width: '2px', background: 'rgba(255,255,255,0.08)', marginTop: '0.5rem', marginBottom: '-2rem' }}></div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={12} /> {item.time}
                  </div>
                  <p style={{ fontSize: '1.05rem', color: 'white', fontWeight: 500, lineHeight: 1.4 }}>
                    {item.title} <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{item.target}</span>
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Quick Actions</h2>
          <ActionCard icon={<Upload size={20} />} title="Upload New Contract" desc="Add .sol or .vy files" />
          <ActionCard icon={<Search size={20} />} title="Run Global Scan" desc="Execute full test suite" />
          <ActionCard icon={<Download size={20} />} title="Generate Report" desc="Export current findings" />
        </div>
      </div>

      {/* Recent Critical Findings */}
      <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Recent Critical Findings</h2>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
             <Activity size={16} /> FILTER
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>
                <th style={{ padding: '1rem 0.5rem' }}>Severity</th>
                <th style={{ padding: '1rem 0.5rem' }}>Vulnerability Type</th>
                <th style={{ padding: '1rem 0.5rem' }}>Contract</th>
                <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((finding, i) => (
                <tr key={i} style={{ borderBottom: i === findings.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.5rem 0.5rem' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: 800,
                      background: finding.severity === 'Critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: finding.severity === 'Critical' ? '#ff4d4d' : '#ffa500'
                    }}>{finding.severity}</span>
                  </td>
                  <td style={{ padding: '1.5rem 0.5rem', fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>{finding.type}</td>
                  <td style={{ padding: '1.5rem 0.5rem', color: 'var(--primary)', fontWeight: 600 }}>{finding.contract}</td>
                  <td style={{ padding: '1.5rem 0.5rem' }}>
                    <span style={{ color: finding.statusColor, fontSize: '0.85rem', fontWeight: 700 }}>{finding.status}</span>
                  </td>
                  <td style={{ padding: '1.5rem 0.5rem', textAlign: 'right' }}>
                    <button style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, padding: '0.5rem 1rem', borderRadius: '6px', transition: 'all 0.2s' }}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc }: any) {
  return (
    <div className="glass-panel" style={{ 
      padding: '1.25rem', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1.25rem', 
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '10px' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>{title}</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <ExternalLink size={16} color="var(--text-muted)" opacity={0.5} />
    </div>
  );
}

function Activity({ size }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
