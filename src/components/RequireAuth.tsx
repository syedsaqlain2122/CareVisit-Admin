import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/lib/store';

export function RequireAuth() {
  const { currentAdmin, authReady } = useStore();
  if (!authReady) {
    return (
      <div className="login-wrap">
        <div className="empty">
          <div className="empty-art" aria-hidden>
            <span className="empty-orb empty-orb-a" />
            <span className="empty-orb empty-orb-b" />
            <span className="empty-plus">+</span>
          </div>
          <p className="muted">Loading session…</p>
        </div>
      </div>
    );
  }
  if (!currentAdmin) return <Navigate to="/login" replace />;
  return <Outlet />;
}
