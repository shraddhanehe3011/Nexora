import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/ui/LoadingScreen';

export function ProtectedRoute({ requireProfile = false }) {
  const { isAuthenticated, profileCompleted, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen label="Loading your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireProfile && !profileCompleted) {
    return <Navigate to="/personalization" replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, profileCompleted, loading } = useAuth();

  if (loading) return <LoadingScreen label="Loading…" />;

  if (isAuthenticated) {
    return <Navigate to={profileCompleted ? '/app' : '/personalization'} replace />;
  }

  return <Outlet />;
}
