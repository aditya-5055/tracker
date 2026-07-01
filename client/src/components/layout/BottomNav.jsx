import { NavLink } from 'react-router-dom';
import {
  RiDashboardLine,
  RiCalendar2Line,
  RiCalendarEventLine,
  RiCalendarLine,
  RiSettings4Line,
  RiFileTextLine,
} from 'react-icons/ri';
import { getLocalISODate } from '../../utils/dateUtils';

const todayStr = getLocalISODate();

const NAV_ITEMS = [
  { to: '/dashboard',       label: 'Home',     icon: RiDashboardLine },
  { to: '/week',            label: 'Week',     icon: RiCalendar2Line },
  { to: `/day/${todayStr}`, label: 'Day',      icon: RiCalendarEventLine },
  { to: '/calendar',        label: 'Calendar', icon: RiCalendarLine },
  { to: '/notes',           label: 'Notes',    icon: RiFileTextLine },
  { to: '/settings',        label: 'Settings', icon: RiSettings4Line },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden
                 bg-bg-elevated/95 backdrop-blur-md border-t border-border-subtle
                 flex items-center justify-around h-16 px-2"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-all duration-150
             ${isActive
               ? 'text-accent'
               : 'text-txt-muted hover:text-txt-secondary'
             }`
          }
        >
          <Icon className="text-xl" aria-hidden="true" />
          <span className="text-[10px] font-semibold">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
