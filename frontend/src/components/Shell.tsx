import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileCode2, ShieldAlert, AlertTriangle, Settings, Activity, DollarSign, Bell, FileText } from 'lucide-react';

export function Shell() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Contracts', path: '/projects', icon: <FileCode2 size={20} /> },
    { name: 'Cross-Contract', path: '/cross-contract', icon: <ShieldAlert size={20} /> },
    { name: 'Fuzz Testing', path: '/runs', icon: <Activity size={20} /> },
    { name: 'Failure Vault', path: '/vault', icon: <AlertTriangle size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen w-full" style={{ overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', borderRight: '1px solid var(--panel-border)', background: 'rgba(2, 6, 23, 0.5)', zIndex: 10 }}>
        <div className="flex items-center gap-3" style={{ whiteSpace: 'nowrap' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, letterSpacing: '1px', color: 'white' }}>CONSENSIZ<span className="text-gradient">-FZ</span></h2>
        </div>

        <nav className="flex-col gap-2" style={{ display: 'flex' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `flex items-center gap-3 ${isActive ? 'active-link' : 'inactive-link'}`}
              style={({ isActive }) => ({
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'white' : 'var(--text-muted)',
                background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.2s'
              })}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>
        
        <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
          <div className="flex items-center gap-3">
            <div style={{ width: '36px', height: '36px', background: '#334155', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              A
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Auditor Role</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Level 4 Clearance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-col w-full h-full" style={{ overflowY: 'auto', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, padding: '1.5rem 2.5rem', background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(12px)', zIndex: 5, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)' }}>
          <div className="flex items-center gap-4 w-full" style={{ maxWidth: '600px' }}>
             <input type="text" placeholder="Search contracts, alerts..." className="input" style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '20px', padding: '0.5rem 1.5rem' }} />
          </div>
          <div className="flex items-center gap-4">
             <button className="btn btn-secondary" style={{ borderRadius: '20px', fontSize: '0.8rem', padding: '0.4rem 1rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}>AUDITOR ROLE</button>
          </div>
        </div>
        <div style={{ padding: '2.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
