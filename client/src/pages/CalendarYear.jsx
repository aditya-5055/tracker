import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCalendarLine, RiArrowLeftSLine, RiArrowRightSLine, RiRefreshLine } from 'react-icons/ri';
import PageShell from '../components/layout/PageShell';
import { fetchYearTasks } from '../api/tasks';
import { getLocalISODate } from '../utils/dateUtils';

// ── Helpers ──────────────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function intensityClass(pct) {
  if (pct === null) return 'bg-bg-elevated border border-border-subtle';
  if (pct === 0)    return 'bg-bg-elevated border border-border-subtle opacity-60';
  if (pct <= 25)    return 'bg-accent/20 border border-accent/10';
  if (pct <= 50)    return 'bg-accent/40 border border-accent/25';
  if (pct <= 75)    return 'bg-accent/65 border border-accent/40';
  return 'bg-accent border border-accent/80 shadow-glow-indigo';
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalendarYear() {
  const navigate = useNavigate();
  const now = new Date();
  
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Fetch Data ─────────────────────────────────────────────────────────────
  const loadYearData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchYearTasks(viewYear);
      setHeatmap(res.data.heatmap || []);
    } catch {
      setError('Failed to load year data.');
    } finally {
      setLoading(false);
    }
  }, [viewYear]);

  useEffect(() => { loadYearData(); }, [loadYearData]);

  const prevYear = () => setViewYear(y => y - 1);
  const nextYear = () => setViewYear(y => y + 1);

  const handleDayClick = (cell) => {
    if (!cell) return;
    const iso = getLocalISODate(cell.date);
    navigate(`/day/${iso}`);
  };

  // ── Grid Building ──────────────────────────────────────────────────────────
  const buildYearGrid = () => {
    const firstDay = new Date(viewYear, 0, 1).getDay(); // 0=Sun
    const daysInYear = ((viewYear % 4 === 0 && viewYear % 100 > 0) || viewYear % 400 === 0) ? 366 : 365;
    
    const cells = [];
    // Padding
    for (let i = 0; i < firstDay; i++) cells.push(null);

    // Days
    for (let d = 1; d <= daysInYear; d++) {
      const cellDate = new Date(viewYear, 0, d);
      const isFuture = new Date(cellDate.toDateString()) > new Date(now.toDateString());
      
      const dateStr = getLocalISODate(cellDate);
      const dayData = heatmap.find(h => h.date === dateStr);
      
      let pct = null;
      let total = 0;
      let completed = 0;

      if (dayData) {
        pct = dayData.completionPct;
        total = dayData.total;
        completed = dayData.completed;
      } else if (!isFuture) {
        pct = 0;
      }

      cells.push({ date: cellDate, pct, total, completed });
    }
    return { cells, firstDay };
  };

  const { cells } = buildYearGrid();

  // ── Stats Calculation ──────────────────────────────────────────────────────
  const totalTasks = heatmap.reduce((sum, d) => sum + d.total, 0);
  const completedTasks = heatmap.reduce((sum, d) => sum + d.completed, 0);
  const overallPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  let currentStreak = 0;
  let maxStreak = 0;
  const todayStr = getLocalISODate(now);
  
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
    <PageShell
      icon={RiCalendarLine}
      title="Year View"
      description="A 365-day bird's eye view of your consistency."
      accentClass="text-accent-teal"
    >
      <div className="space-y-6 pb-12">
        
        {/* ── Header ───────────────────────────────────── */}
        <div className="card flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center text-accent flex-shrink-0">
              <RiCalendarLine className="text-2xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-txt-primary">{viewYear} Overview</h2>
              <p className="text-sm text-txt-secondary">{totalTasks} tasks recorded</p>
            </div>
          </div>

          <div className="flex bg-bg-elevated p-1 rounded-lg">
            <Link to="/calendar" className="px-4 py-1.5 text-xs font-semibold rounded-md text-txt-muted hover:text-txt-primary">
              Month
            </Link>
            <button className="px-4 py-1.5 text-xs font-semibold rounded-md bg-accent text-white shadow-sm">
              Year
            </button>
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
              <button onClick={loadYearData} className="flex items-center gap-1 hover:text-rose-300">
                <RiRefreshLine /> Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Heatmap ──────────────────────────────────────────────────────── */}
        <div className="card overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex items-center justify-between mb-6 min-w-[700px]">
            <div className="flex items-center gap-2">
              <button onClick={prevYear} className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-elevated text-txt-muted hover:text-txt-primary transition-all">
                <RiArrowLeftSLine className="text-xl" />
              </button>
              <h3 className="text-base font-bold text-txt-primary w-[80px] text-center">{viewYear}</h3>
              <button onClick={nextYear} className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-elevated text-txt-muted hover:text-txt-primary transition-all">
                <RiArrowRightSLine className="text-xl" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-txt-muted">Less</span>
              {[0, 25, 50, 75, 100].map(v => (
                <div key={v} className={`w-3.5 h-3.5 rounded-sm ${intensityClass(v)}`} />
              ))}
              <span className="text-[10px] text-txt-muted">More</span>
            </div>
          </div>

          <div className="flex gap-2 min-w-[700px]">
            {/* Day Labels */}
            <div className="grid grid-rows-7 gap-1.5 text-[9px] font-semibold text-txt-muted text-right pr-2 pt-5">
              {DAYS_OF_WEEK.map((d, i) => <span key={i} className={`${i % 2 === 0 ? 'opacity-0' : ''}`}>{d}</span>)}
            </div>
            
            {/* Grid Container */}
            <div className="flex-1">
              {/* Month Labels */}
              <div className="flex justify-between text-[10px] text-txt-muted font-semibold mb-1 pl-1">
                {MONTHS.map(m => <span key={m}>{m}</span>)}
              </div>

              {loading ? (
                <div className="h-32 bg-bg-elevated rounded-lg animate-pulse" />
              ) : (
                <div className="grid grid-flow-col grid-rows-7 gap-1.5" style={{ gridTemplateColumns: 'repeat(53, minmax(0, 1fr))' }}>
                  {cells.map((cell, idx) => {
                    if (!cell) return <div key={`empty-${idx}`} className="w-3.5 h-3.5 rounded-[3px]" />;

                    const isToday =
                      cell.date.getDate() === now.getDate() &&
                      cell.date.getMonth() === now.getMonth() &&
                      cell.date.getFullYear() === now.getFullYear();

                    return (
                      <div key={idx} className="relative group flex items-center justify-center">
                        <button
                          onClick={() => handleDayClick(cell)}
                          className={`
                            w-3.5 h-3.5 rounded-[3px] transition-transform duration-150
                            group-hover:scale-125 group-hover:z-10
                            ${intensityClass(cell.pct)}
                            ${isToday ? 'ring-1 ring-accent ring-offset-1 ring-offset-bg-card' : ''}
                          `}
                        />
                        {/* Tooltip */}
                        <div className="
                          absolute -top-10 left-1/2 -translate-x-1/2
                          bg-bg-elevated border border-border-default text-txt-primary
                          text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap
                          opacity-0 group-hover:opacity-100 pointer-events-none
                          transition-opacity duration-150 z-20 shadow-xl
                        ">
                          {cell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          <span className="block text-txt-muted">
                            {cell.pct !== null ? `${cell.pct}% (${cell.completed}/${cell.total})` : 'Future'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Yearly Completion', value: `${loading ? '—' : overallPct}%`, color: 'text-accent' },
            { label: 'Total Tasks',  value: loading ? '—' : totalTasks, color: 'text-indigo-400' },
            { label: 'Completed Tasks', value: loading ? '—' : completedTasks, color: 'text-emerald-400' },
            { label: 'Longest Streak', value: `${loading ? '—' : maxStreak} d`, color: 'text-orange-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center py-4 flex flex-col justify-center">
              <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              <p className="text-xs text-txt-muted mt-1">{label}</p>
            </div>
          ))}
        </div>

      </div>
    </PageShell>
  );
}
