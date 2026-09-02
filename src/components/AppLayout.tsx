import type { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Avatar, BrandMark } from '@/components/ui';
import { useStore } from '@/lib/store';

const NAV = [
  {
    label: 'Care',
    items: [
      { to: '/', label: 'Overview', icon: HomeIcon },
      { to: '/requests', label: 'Visit queue', icon: QueueIcon },
      { to: '/verification', label: 'ID review', icon: ShieldIcon },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/staff', label: 'Staff roster', icon: StaffIcon },
      { to: '/patients', label: 'Patients', icon: PeopleIcon },
      { to: '/admins', label: 'Admin users', icon: KeyIcon },
    ],
  },
  {
    label: 'Money',
    items: [
      { to: '/pharmacy', label: 'Pharmacy', icon: BagIcon },
      { to: '/payments', label: 'Payments', icon: CashIcon },
      { to: '/reports', label: 'Reports', icon: ChartIcon },
    ],
  },
];

function IconWrap({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

function HomeIcon() {
  return (
    <IconWrap>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </IconWrap>
  );
}
function QueueIcon() {
  return (
    <IconWrap>
      <path d="M4 6h16M4 12h10M4 18h7" />
      <circle cx="18" cy="16" r="3" />
    </IconWrap>
  );
}
function ShieldIcon() {
  return (
    <IconWrap>
      <path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 9 4.2-1.8 7-4.8 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </IconWrap>
  );
}
function StaffIcon() {
  return (
    <IconWrap>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.5c1.2-3.2 3.4-4.8 6.5-4.8s5.3 1.6 6.5 4.8" />
    </IconWrap>
  );
}
function PeopleIcon() {
  return (
    <IconWrap>
      <circle cx="9" cy="8" r="2.6" />
      <circle cx="16" cy="9" r="2.2" />
      <path d="M4.5 18.5c.9-2.6 2.6-4 5-4s4.1 1.4 5 4" />
      <path d="M14 14.6c1.7-.2 3.2.8 4.2 2.9" />
    </IconWrap>
  );
}
function KeyIcon() {
  return (
    <IconWrap>
      <circle cx="8" cy="12" r="3" />
      <path d="M11 12h9v3M17 12v3" />
    </IconWrap>
  );
}
function BagIcon() {
  return (
    <IconWrap>
      <path d="M6 8h12l-1 12H7z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </IconWrap>
  );
}
function CashIcon() {
  return (
    <IconWrap>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.2" />
    </IconWrap>
  );
}
function ChartIcon() {
  return (
    <IconWrap>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 15v-4M12 15V8M16 15v-7" />
    </IconWrap>
  );
}

export function AppLayout() {
  const { currentAdmin, logout, loading, error, refresh } = useStore();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <BrandMark size={40} />
          <div>
            <h1>CareVisit</h1>
            <p>Admin operations</p>
          </div>
        </div>
        {NAV.map((group) => (
          <div key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <item.icon />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="sidebar-foot">
          <div className="foot-user">
            <Avatar name={currentAdmin?.name ?? 'Admin'} size={36} tone="primary" />
            <div>
              <strong>{currentAdmin?.name}</strong>
              <span>{currentAdmin?.email}</span>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-block"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.18)' }}
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
        <div className="topbar">
          <span className="live-pill">
            <span className="live-dot" />
            {loading ? 'Syncing live data' : 'Live from CareVisit'}
          </span>
        </div>
        {error ? (
          <div className="banner">
            <span>{error}</span>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => void refresh()}>
              Retry
            </button>
          </div>
        ) : null}
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
