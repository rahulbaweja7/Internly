import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { VerifyEmail } from './components/VerifyEmail';
import Dashboard from './components/Dashboard'; 
import AddJob from './components/ui/AddJob';
import { Analytics } from './components/Analytics';
import Settings from './components/Settings';
import Profile from './components/Profile';
import ImportGmail from './components/ImportGmail';
import Activity from './components/Activity';
// Friends/Leaderboards removed
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import Contact from './components/Contact';
import './App.css';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/add" element={
        <ProtectedRoute>
          <AddJob />
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      } />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      {/* Friends and Leaderboards routes removed */}
      <Route path="/import/gmail" element={
        <ProtectedRoute>
          <ImportGmail />
        </ProtectedRoute>
      } />
      <Route path="/activity" element={
        <ProtectedRoute>
          <Activity />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <AnalyticsOptIn />
          {process.env.NODE_ENV === 'production' && <SpeedInsights />}
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

// Dynamically load Vercel Analytics only in production so tests/dev do not fail if entrypoint changes
const AnalyticsOptIn = React.memo(() => {
  const [Component, setComponent] = React.useState(null);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      import('@vercel/analytics/react')
        .then((mod) => setComponent(() => mod.Analytics))
        .catch(() => setComponent(null));
    }
  }, []);

  return Component ? <Component /> : null;
});
