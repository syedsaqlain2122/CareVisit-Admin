import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/lib/store';

export function RequireAuth() {
  const { currentAdmin, authReady } = useStore();
  if (!authReady) {
    return (
      <div className="login-wrap">
        <p className="muted">Loading session…</p>
      </div>
    );
  }
  if (!currentAdmin) return <Navigate to="/login" replace />;
  return <Outlet />;
}
