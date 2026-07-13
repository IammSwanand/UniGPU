import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

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
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const GpuMarketplace = lazy(() => import('./pages/GpuMarketplace'));

function AppShell() {
  return <div className="connecting-spinner" aria-label="Loading" />;
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
            <Route path="/dashboard/admin" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </AuthProvider>
  );
}
