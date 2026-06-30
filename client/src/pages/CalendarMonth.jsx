import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCalendarLine, RiArrowLeftSLine, RiArrowRightSLine, RiRefreshLine } from 'react-icons/ri';
import { fetchMonthTasks } from '../api/tasks';
import { getLocalISODate } from '../utils/dateUtils';

// ── Helpers ──────────────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function intensityClass(pct) {
  if (pct === null) return 'bg-bg-elevated border border-border-subtle'; // future / empty
  if (pct === 0)    return 'bg-bg-elevated border border-border-subtle opacity-60';
  if (pct <= 25)    return 'bg-accent/20 border border-accent/10';
  if (pct <= 50)    return 'bg-accent/40 border border-accent/25';
  if (pct <= 75)    return 'bg-accent/65 border border-accent/40';
  return 'bg-accent border border-accent/80 shadow-glow-indigo';
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalendarMonth() {
  const navigate = useNavigate();
  const now = new Date();
  
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Fetch Data ─────────────────────────────────────────────────────────────
  const loadMonthData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
      const res = await fetchMonthTasks(monthStr);
      setHeatmap(res.data.heatmap || []);
    } catch {
      setError('Failed to load month data.');
    } finally {
      setLoading(false);
    }
  }, [viewYear, viewMonth]);

  useEffect(() => { loadMonthData(); }, [loadMonthData]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const handleDayClick = (cell) => {
    if (!cell) return;
    const iso = getLocalISODate(cell.date);
    navigate(`/day/${iso}`);
  };

  // ── Grid Building ──────────────────────────────────────────────────────────
  const buildMonthGrid = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(viewYear, viewMonth, d);
      // use local time for comparison to avoid timezone offset bugs
      const isFuture = new Date(cellDate.toDateString()) > new Date(now.toDateString());
      
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = heatmap.find(h => h.date === dateStr);
      
      let pct = null;
      let total = 0;
      let completed = 0;

      if (dayData) {
        pct = dayData.completionPct;
        total = dayData.total;
        completed = dayData.completed;
      } else if (!isFuture) {
        pct = 0; // past day with no tasks
      }

      cells.push({ day: d, date: cellDate, pct, total, completed });
    }
    return cells;
  };

  const cells = buildMonthGrid();

  // ── Stats Calculation ──────────────────────────────────────────────────────
  const daysTracked = heatmap.length;
  const perfectDays = heatmap.filter(d => d.completionPct === 100 && d.total > 0).length;
  const avgPct = daysTracked ? Math.round(heatmap.reduce((sum, d) => sum + d.completionPct, 0) / daysTracked) : 0;
  
  let currentStreak = 0;
  let maxStreak = 0;
  const todayStr = getLocalISODate(now);
  
  // Calculate streak from start of month up to today
  for (const cell of cells) {
    if (!cell) continue;
    const cellDateStr = getLocalISODate(cell.date);
    if (cellDateStr > todayStr) break;
    
    if (cell.completed > 0) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
      
      {/* ── Header card ───────────────────────────────────── */}
      <div className="card flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center text-accent flex-shrink-0">
            <RiCalendarLine className="text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-txt-primary">Calendar</h2>
            <p className="text-sm text-txt-secondary">
              Track your consistency over time.
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-bg-elevated p-1 rounded-lg">
          <button className="px-4 py-1.5 text-xs font-semibold rounded-md bg-accent text-white shadow-sm">
            Month
          </button>
          <Link to="/calendar/year" className="px-4 py-1.5 text-xs font-semibold rounded-md text-txt-muted hover:text-txt-primary">
            Year
          </Link>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm"
          >
            <span>{error}</span>
            <button onClick={loadMonthData} className="flex items-center gap-1 hover:text-rose-300">
              <RiRefreshLine /> Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Calendar card ─────────────────────────────────── */}
      <div className="card">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-elevated text-txt-muted hover:text-txt-primary hover:bg-border-subtle transition-all"
            >
              <RiArrowLeftSLine className="text-xl" />
            </button>
            <motion.h3
              key={`${viewYear}-${viewMonth}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base font-bold text-txt-primary w-[140px] text-center"
            >
              {MONTHS[viewMonth]} {viewYear}
            </motion.h3>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-elevated text-txt-muted hover:text-txt-primary hover:bg-border-subtle transition-all"
            >
              <RiArrowRightSLine className="text-xl" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {(viewMonth !== now.getMonth() || viewYear !== now.getFullYear()) && (
              <button onClick={goToday} className="btn-ghost text-xs px-3 py-1.5">
                Today
              </button>
            )}
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] text-txt-muted">Less</span>
              {[0, 25, 50, 75, 100].map(v => (
                <div key={v} className={`w-3.5 h-3.5 rounded-sm ${intensityClass(v)}`} />
              ))}
              <span className="text-[10px] text-txt-muted">More</span>
            </div>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-txt-muted py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <motion.div
          key={`${viewYear}-${viewMonth}-grid`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-7 gap-1.5 sm:gap-2"
        >
          {loading ? (
            Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-bg-elevated animate-pulse" />
            ))
          ) : cells.map((cell, idx) => {
            if (!cell) return <div key={`empty-${idx}`} />;

            const isToday =
              cell.date.getDate() === now.getDate() &&
              cell.date.getMonth() === now.getMonth() &&
              cell.date.getFullYear() === now.getFullYear();

            return (
              <motion.button
                key={cell.day}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDayClick(cell)}
                className={`
                  relative aspect-[4/3] sm:aspect-square rounded-lg flex flex-col items-center justify-center
                  cursor-pointer transition-all duration-150 group
                  ${intensityClass(cell.pct)}
                  ${isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-card' : ''}
                `}
              >
                <span className={`
                  text-[11px] sm:text-sm font-semibold leading-none
                  ${cell.pct !== null && cell.pct > 50 ? 'text-white' : 'text-txt-secondary'}
                  ${isToday ? 'text-white' : ''}
                `}>
                  {cell.day}
                </span>

                {/* Tiny count badge (e.g. "3/5") */}
                {cell.total > 0 && (
                  <span className="absolute bottom-1 right-1 text-[8px] font-mono font-bold opacity-80 mix-blend-plus-lighter">
                    {cell.completed}/{cell.total}
                  </span>
                )}

                {/* Tooltip */}
                <span className="
                  absolute -top-8 left-1/2 -translate-x-1/2
                  bg-bg-elevated border border-border-default text-txt-primary
                  text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap
                  opacity-0 group-hover:opacity-100 pointer-events-none
                  transition-opacity duration-150 z-10
                ">
                  {cell.pct !== null ? `${cell.pct}% done` : 'Future'}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* ── Quick stats strip ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Days Tracked',  value: daysTracked, color: 'text-accent' },
          { label: 'Perfect Days',  value: perfectDays, color: 'text-emerald-400' },
          { label: 'Avg. Completion', value: `${avgPct}%`, color: 'text-amber-400' },
          { label: 'Month Streak',   value: `${maxStreak} d`, color: 'text-orange-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-3 flex flex-col justify-center">
            <p className={`text-xl font-extrabold ${color}`}>{loading ? '—' : value}</p>
            <p className="text-[11px] text-txt-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
