import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  RiDashboardLine,
  RiCalendarLine,
  RiCalendarEventLine,
  RiBarChartBoxLine,
  RiLightbulbFlashLine,
  RiCalendar2Line,
  RiLogoutBoxLine,
  RiCheckboxCircleLine,
  RiSettings4Line,
  RiFileTextLine,
} from 'react-icons/ri';

const NAV_LINKS = [
  { to: '/dashboard',    label: 'Dashboard',    icon: RiDashboardLine },
  { to: '/calendar',     label: 'Month View',   icon: RiCalendarLine },
  { to: '/week',         label: 'Week View',    icon: RiCalendar2Line },
  { to: '/day/today',    label: 'Day View',     icon: RiCalendarEventLine },
  { to: '/analytics',    label: 'Analytics',    icon: RiBarChartBoxLine },
  { to: '/motivation',   label: 'Motivation',   icon: RiLightbulbFlashLine },
  { to: '/notes',        label: 'Notes',        icon: RiFileTextLine },
  { to: '/notes/overview', label: 'Overview',   icon: RiFileTextLine },
  { to: '/settings',     label: 'Settings',     icon: RiSettings4Line },
];

const CATEGORIES = [
  { label: 'DSA',            color: 'bg-accent/20 text-accent' },
  { label: 'OS',             color: 'bg-teal-500/20 text-teal-400' },
  { label: 'DBMS',           color: 'bg-purple-500/20 text-purple-400' },
  { label: 'SQL',            color: 'bg-blue-500/20 text-blue-400' },
  { label: 'CNS',            color: 'bg-cyan-500/20 text-cyan-400' },
  { label: 'System Design',  color: 'bg-orange-500/20 text-orange-400' },
  { label: 'Interview Prep', color: 'bg-amber-500/20 text-amber-400' },
  { label: 'Projects',       color: 'bg-emerald-500/20 text-emerald-400' },
];

const sidebarVariants = {
  hidden: { x: -280 },
  visible: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      className="fixed left-0 top-0 h-full w-64 bg-bg-elevated border-r border-border-subtle
                 hidden md:flex flex-col z-40 overflow-y-auto"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* ── Logo ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border-subtle">
        <div className="w-9 h-9 rounded-xl bg-gradient-indigo flex items-center justify-center glow-indigo">
          <RiCheckboxCircleLine className="text-white text-xl" />
        </div>
        <div>
          <p className="font-bold text-txt-primary leading-tight text-sm">Consistency</p>
          <p className="text-[11px] text-txt-muted font-medium tracking-widest uppercase">Tracker</p>
        </div>
      </div>

      {/* ── User pill ─────────────────────────────────── */}
      {user && (
        <div className="mx-4 mt-4 px-3 py-2.5 rounded-xl bg-bg-card border border-border-subtle flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-indigo flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-txt-primary truncate">{user.name || 'User'}</p>
            <p className="text-[10px] text-txt-muted truncate">{user.email || ''}</p>
          </div>
        </div>
      )}

      {/* ── Navigation ────────────────────────────────── */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        <p className="text-[10px] font-semibold text-txt-muted uppercase tracking-widest px-3 mb-2">
          Navigation
        </p>
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="text-lg flex-shrink-0" aria-hidden="true" />
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Categories ────────────────────────────────── */}
      <div className="px-3 mt-6">
        <p className="text-[10px] font-semibold text-txt-muted uppercase tracking-widest px-3 mb-2">
          Categories
        </p>
        <div className="flex flex-wrap gap-1.5 px-1">
          {CATEGORIES.map(({ label, color }) => (
            <span key={label} className={`badge ${color} text-[10px]`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Logout ────────────────────────────────────── */}
      <div className="px-3 pb-5 mt-6">
        <button
          onClick={handleLogout}
          aria-label="Logout"
          className="sidebar-link w-full hover:text-status-incomplete hover:border-status-incomplete/20"
        >
          <RiLogoutBoxLine className="text-lg" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </motion.aside>
  );
}
