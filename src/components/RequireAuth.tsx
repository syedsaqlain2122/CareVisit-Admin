import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/lib/store';

export function RequireAuth() {
  const { currentAdmin } = useStore();
  if (!currentAdmin) return <Navigate to="/login" replace />;
  return <Outlet />;
}
