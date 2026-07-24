import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const HowToUse = lazy(() => import('./pages/HowToUse'));
const Docs = lazy(() => import('./pages/Docs'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Download = lazy(() => import('./pages/Download'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const ClientWallet = lazy(() => import('./pages/ClientWallet'));
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard'));
const ProviderWallet = lazy(() => import('./pages/ProviderWallet'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const GpuMarketplace = lazy(() => import('./pages/GpuMarketplace'));
const Support = lazy(() => import('./pages/Support'));

function AppShell() {
  return <div className="connecting-spinner" aria-label="Loading" />;
}

function GlobalDisabledModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleDisabled = () => setOpen(true);
    window.addEventListener('accountDisabled', handleDisabled);
    return () => window.removeEventListener('accountDisabled', handleDisabled);
  }, []);

  if (!open) return null;

  return (
    <div className="cd-overlay" style={{ zIndex: 9999, display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="cd-modal__panel" style={{ padding: '24px', maxWidth: '400px', width: '100%', margin: 'auto', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px' }}>
        <h3 className="cd-modal__title" style={{ marginBottom: '12px', color: '#ef4444', fontSize: '20px', fontWeight: 600 }}>Account Disabled</h3>
        <p style={{ color: 'var(--lp-ash-helper)', marginBottom: '24px', fontSize: '15px' }}>
          Your account has been disabled. Please contact support for assistance.
        </p>
        <button className="cd-btn cd-btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/';
        }}>
          Return to Home
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  const paths = { client: '/dashboard/client', provider: '/dashboard/provider', admin: '/dashboard/admin' };
  return <Navigate to={paths[user.role] || '/login'} />;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
      <AuthProvider>
        <Suspense fallback={<AppShell />}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/download" element={<Download />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/support" element={<Support />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/dashboard/client" element={
              <ProtectedRoute roles={['client']}><ClientDashboard /></ProtectedRoute>
            } />
            <Route path="/dashboard/client/wallet" element={
              <ProtectedRoute roles={['client']}><ClientWallet /></ProtectedRoute>
            } />
            <Route path="/dashboard/client/gpus" element={
              <ProtectedRoute roles={['client']}><GpuMarketplace /></ProtectedRoute>
            } />
            <Route path="/dashboard/provider" element={
              <ProtectedRoute roles={['provider']}><ProviderDashboard /></ProtectedRoute>
            } />
            <Route path="/dashboard/provider/wallet" element={
              <ProtectedRoute roles={['provider']}><ProviderWallet /></ProtectedRoute>
            } />
            <Route path="/dashboard/admin" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
        <GlobalDisabledModal />
      </Suspense>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}
