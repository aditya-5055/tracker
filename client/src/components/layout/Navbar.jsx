import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiBellLine, RiSearchLine, RiLogoutBoxLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard':     { title: 'Dashboard',    sub: 'Your consistency overview' },
  '/calendar':      { title: 'Calendar',     sub: 'Month view — click any day to drill in' },
  '/calendar/year': { title: 'Year View',    sub: 'Your 365-day heatmap' },
  '/week':          { title: 'Week View',    sub: 'Weekly schedule & progress' },
  '/analytics':     { title: 'Analytics',    sub: 'Category breakdowns & trends' },
  '/motivation':    { title: 'Motivation',   sub: 'Quotes & purpose to keep you going' },
  '/settings':      { title: 'Settings',     sub: 'Profile, preferences & customization' },
};

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  // Handle /day/:date pattern
  const isDayView = pathname.startsWith('/day/');
  const pageInfo = isDayView
    ? { title: 'Day View', sub: pathname.replace('/day/', 'Date: ') }
    : (PAGE_TITLES[pathname] || { title: 'Consistency Tracker', sub: '' });

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-16 flex items-center justify-between px-6
                 border-b border-border-subtle bg-bg-surface/80 backdrop-blur-sm"
    >
      {/* Page title */}
      <div>
        <h1 className="text-lg font-bold text-txt-primary leading-tight">{pageInfo.title}</h1>
        {pageInfo.sub && (
          <p className="text-xs text-txt-muted">{pageInfo.sub}</p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search (placeholder) */}
        <button
          id="navbar-search-btn"
          aria-label="Search"
          className="w-8 h-8 flex items-center justify-center rounded-lg
                     text-txt-muted hover:text-txt-primary hover:bg-bg-elevated
                     transition-all duration-200"
        >
          <RiSearchLine className="text-lg" aria-hidden="true" />
        </button>

        {/* Notifications (placeholder) */}
        <button
          id="navbar-bell-btn"
          aria-label="Notifications"
          className="relative w-8 h-8 flex items-center justify-center rounded-lg
                     text-txt-muted hover:text-txt-primary hover:bg-bg-elevated
                     transition-all duration-200"
        >
          <RiBellLine className="text-lg" aria-hidden="true" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Logout"
          className="w-8 h-8 flex items-center justify-center rounded-lg
                     text-txt-muted hover:text-status-incomplete hover:bg-status-incomplete/10
                     transition-all duration-200"
        >
          <RiLogoutBoxLine className="text-lg" aria-hidden="true" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-indigo flex items-center justify-center
                        text-white text-xs font-bold cursor-pointer ring-2 ring-accent/30
                        hover:ring-accent transition-all duration-200">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </motion.header>
  );
}
