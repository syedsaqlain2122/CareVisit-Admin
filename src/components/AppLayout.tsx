import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';

const NAV = [
  { to: '/', label: 'Overview' },
  { to: '/requests', label: 'Visit queue' },
  { to: '/verification', label: 'ID review' },
  { to: '/staff', label: 'Staff roster' },
  { to: '/patients', label: 'Patients' },
  { to: '/pharmacy', label: 'Pharmacy' },
  { to: '/payments', label: 'Payments' },
  { to: '/reports', label: 'Reports' },
  { to: '/admins', label: 'Admin users' },
];

export function AppLayout() {
  const { currentAdmin, logout, loading, error, refresh } = useStore();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden>
            <circle cx="13" cy="16" r="6" fill="#2451F0" />
            <circle cx="19" cy="16" r="6" fill="#17B897" fillOpacity="0.92" />
            <path d="M16 13v6M13 16h6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <div>
            <h1>CareVisit</h1>
            <p>Admin operations</p>
          </div>
        </div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
        <div className="sidebar-foot">
          <strong>{currentAdmin?.name}</strong>
          <span>{currentAdmin?.email}</span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 10, color: '#fff', borderColor: 'rgba(255,255,255,0.2)', width: '100%' }}
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        {error ? (
          <div className="error" style={{ marginBottom: 12 }}>
            {error}{' '}
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => void refresh()}>
              Retry
            </button>
          </div>
        ) : null}
        {loading ? <p className="muted" style={{ marginTop: 0 }}>Refreshing live data…</p> : null}
        <Outlet />
      </main>
    </div>
  );
}
