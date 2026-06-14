import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './App.css';

// ── Eager — needed on first load for unauthenticated visitors ─────────────────
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { VerifyEmail } from './components/VerifyEmail';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import Contact from './components/Contact';

// ── Lazy — only loaded after the user logs in ─────────────────────────────────
const Dashboard   = lazy(() => import('./components/Dashboard'));
const AddJob      = lazy(() => import('./components/ui/AddJob'));
const Analytics   = lazy(() => import('./components/Analytics'));
const Settings    = lazy(() => import('./components/Settings'));
const Profile     = lazy(() => import('./components/Profile'));
const ImportGmail = lazy(() => import('./components/ImportGmail'));
const Activity    = lazy(() => import('./components/Activity'));

// Shown while a lazy chunk is downloading
function PageSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"        element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register"     element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/privacy"      element={<Privacy />} />
        <Route path="/terms"        element={<Terms />} />
        <Route path="/contact"      element={<Contact />} />

        {/* Protected — chunks downloaded on first navigation to each route */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/add"       element={<ProtectedRoute><AddJob /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/import/gmail" element={<ProtectedRoute><ImportGmail /></ProtectedRoute>} />
        <Route path="/activity"  element={<ProtectedRoute><Activity /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <Router>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
              {process.env.NODE_ENV === 'production' && <SpeedInsights />}
            </Router>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
