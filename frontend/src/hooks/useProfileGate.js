import { useAuth } from '../context/AuthContext';

export function useProfileGate() {
  const { isAuthenticated, profileCompleted, loading } = useAuth();
  return { isAuthenticated, profileCompleted, loading };
}
