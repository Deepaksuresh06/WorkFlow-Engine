import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/',           icon: '▦', label: 'Dashboard'  },
  { to: '/workflows',  icon: '⚡', label: 'Workflows'  },
  { to: '/executions', icon: '▶', label: 'Executions' },
  { to: '/logs',       icon: '≡', label: 'Logs'       },
  { to: '/rules',      icon: '◈', label: 'Rules'      },
];

const s = {
  wrap:    { display: 'flex', minHeight: '100vh' },
  sidebar: { width: 220, background: '#0f172a', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 },
  logo:    { padding: '20px 20px 16px', borderBottom: '1px solid #1e293b' },
  logoTop: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon:{ fontSize: 22 },
  logoText:{ color: '#f1f5f9', fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' },
  subtext: { color: '#475569', fontSize: 11, marginTop: 2 },
  nav:     { padding: '12px 10px', flex: 1 },
  link:    (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
    borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500,
    color: active ? '#f1f5f9' : '#64748b',
    background: active ? '#1e40af' : 'transparent',
    marginBottom: 2, transition: 'all 0.15s',
  }),
  linkIcon:{ fontSize: 15, width: 18, textAlign: 'center' },
  dot:     { width: 8, height: 8, borderRadius: '50%', background: '#22c55e', marginRight: 6 },
  status:  { padding: '12px 20px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', fontSize: 12, color: '#475569' },
  main:    { marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  topbar:  { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 },
  content: { padding: '28px', flex: 1 },
};

export default function Layout({ children, title }) {
  return (
    <div style={s.wrap}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoTop}>
            <span style={s.logoIcon}>⚙️</span>
            <span style={s.logoText}>WorkflowOS</span>
          </div>
          <div style={s.subtext}>Automation Platform</div>
        </div>
        <nav style={s.nav}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => s.link(isActive)}>
              <span style={s.linkIcon}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={s.status}>
          <div style={s.dot} />
          System online
        </div>
      </aside>

      <div style={s.main}>
        <div style={s.topbar}>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{title}</span>
          <span style={{ fontSize: 12, color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>
            localhost:5000
          </span>
        </div>
        <div style={s.content}>{children}</div>
      </div>
    </div>
  );
}
