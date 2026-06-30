import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/layout/ErrorBoundary';

// Pages
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import Dashboard      from './pages/Dashboard';
import CalendarMonth  from './pages/CalendarMonth';
import CalendarYear   from './pages/CalendarYear';
import DayView        from './pages/DayView';
import WeekView       from './pages/WeekView';
import Analytics      from './pages/Analytics';
import Motivation     from './pages/Motivation';
import Settings       from './pages/Settings';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* ── Public routes ──────────────────────────────────────── */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ── Protected routes (wrapped in AppLayout) ────────────── */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/calendar"      element={<CalendarMonth />} />
            <Route path="/calendar/year" element={<CalendarYear />} />
            <Route path="/day/:date"     element={<DayView />} />
            <Route path="/week"          element={<WeekView />} />
            <Route path="/analytics"     element={<Analytics />} />
            <Route path="/motivation"    element={<Motivation />} />
            <Route path="/settings"      element={<Settings />} />
          </Route>

          {/* ── Default redirect ───────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </BrowserRouter>

        {/* ── Global Toast Notifications ─────────────────────────────── */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 500,
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#2dd4bf', secondary: '#0f172a' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#0f172a' },
            },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}
