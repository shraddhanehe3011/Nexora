import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PersonalizationPage from './pages/PersonalizationPage';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ScanPage from './pages/ScanPage';
import UploadPage from './pages/UploadPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import AnalysisPage from './pages/AnalysisPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './context/AuthContext';
import LoadingScreen from './components/ui/LoadingScreen';

function PersonalizationGate() {
  const { isAuthenticated, profileCompleted, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (profileCompleted) return <Navigate to="/app" replace />;
  return <PersonalizationPage />;
}

function AppShell() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route path="/personalization" element={<PersonalizationGate />} />

      <Route element={<ProtectedRoute requireProfile />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="products/:productId" element={<ProductDetailsPage />} />
          <Route path="analysis/:analysisId" element={<AnalysisPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
