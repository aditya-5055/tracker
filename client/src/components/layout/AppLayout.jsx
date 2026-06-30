import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-bg-surface flex">
      {/* Desktop sidebar — hidden on small screens */}
      <Sidebar />

      {/* Main content — offset by sidebar on md+ */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — visible only on small screens */}
      <BottomNav />
    </div>
  );
}
