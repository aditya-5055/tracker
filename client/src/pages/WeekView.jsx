import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCalendar2Line, RiArrowLeftSLine, RiArrowRightSLine, RiFireLine, RiRefreshLine } from 'react-icons/ri';
import PageShell from '../components/layout/PageShell';
import ProgressRing from '../components/day/ProgressRing';
import WeekTaskCard from '../components/week/WeekTaskCard';
import TaskEditPopover from '../components/week/TaskEditPopover';
import { fetchTasksByRange } from '../api/tasks';
import { CATEGORIES } from '../constants/dayView';
import { getLocalISODate, addDaysToLocal } from '../utils/dateUtils';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return getLocalISODate(date);
};

const addDays = (dateStr, days) => addDaysToLocal(dateStr, days);

const fmtShortDate = (dateStr) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeekView() {
  const navigate = useNavigate();
  const todayStr = getLocalISODate();
  
  const [weekStart, setWeekStart] = useState(() => getMonday(todayStr));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedTask, setSelectedTask] = useState(null);

  const weekEnd = addDays(weekStart, 6);

  // ─── Fetch Tasks ───────────────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchTasksByRange(weekStart, weekEnd);
      setTasks(res.data.tasks || []);
    } catch {
      setError('Failed to load week tasks.');
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // ─── Task Update Handler ───────────────────────────────────────────────────
  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
  };

  // ─── Navigation ────────────────────────────────────────────────────────────
  const prevWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const goThisWeek = () => setWeekStart(getMonday(todayStr));

  // ─── Computed Stats & Grouping ─────────────────────────────────────────────
  // Group by day (0 to 6 mapping to Mon to Sun)
  const daysData = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      label: DAYS_SHORT[i],
      tasks: tasks.filter(t => t.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    };
  });

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const overallPct = total ? Math.round((completed / total) * 100) : 0;

  // Category stats
  const catStats = CATEGORIES.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat.id);
    if (!catTasks.length) return null;
    const catCompleted = catTasks.filter(t => t.status === 'completed').length;
    const pct = Math.round((catCompleted / catTasks.length) * 100);
    return { ...cat, pct, total: catTasks.length };
  }).filter(Boolean);

  // Streak: Max consecutive days in THIS week with >= 1 completed task
  let maxStreak = 0;
  let currentStreak = 0;
  for (const day of daysData) {
    if (day.tasks.some(t => t.status === 'completed')) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  return (
    <PageShell
      icon={RiCalendar2Line}
      title="Week View"
      description="View your full week's schedule, track overall progress, and manage tasks efficiently."
      accentClass="text-accent-teal"
    >
      <div className="space-y-6 pb-12">
        {/* ─── Top Nav & Stats ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Navigator & Overall Progress */}
          <div className="card lg:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={prevWeek}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border-subtle hover:text-txt-primary hover:border-border-default"
              >
                <RiArrowLeftSLine className="text-xl" />
              </motion.button>
              
              <div className="text-center px-2 min-w-[140px]">
                <p className="text-sm font-bold text-txt-primary">
                  {fmtShortDate(weekStart)} – {fmtShortDate(weekEnd)}
                </p>
                {weekStart === getMonday(todayStr) && (
                  <span className="text-[10px] text-accent font-semibold tracking-widest uppercase">This Week</span>
                )}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={nextWeek}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border-subtle hover:text-txt-primary hover:border-border-default"
              >
                <RiArrowRightSLine className="text-xl" />
              </motion.button>
            </div>

            <div className="flex items-center gap-4">
              {weekStart !== getMonday(todayStr) && (
                <button onClick={goThisWeek} className="btn-ghost text-xs px-3 py-1.5">
                  This Week
                </button>
              )}
              <div className="flex items-center gap-3 px-3 py-1.5 bg-bg-elevated border border-border-subtle rounded-xl">
                <ProgressRing pct={overallPct} size={48} stroke={4} />
                <div className="text-right">
                  <p className="text-xs font-bold text-txt-primary">{completed}/{total}</p>
                  <p className="text-[10px] text-txt-muted">completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Streak & Category Breakdown */}
          <div className="card flex flex-col justify-center gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <RiFireLine className="text-orange-500 text-lg" />
                <span className="text-xs font-semibold text-txt-primary">Weekly Streak</span>
              </div>
              <span className="text-sm font-bold text-orange-400">{maxStreak} days</span>
            </div>
            
            <div className="space-y-2">
              {catStats.length > 0 ? catStats.map(cat => (
                <div key={cat.id} className="flex items-center gap-2 text-[10px]">
                  <span className="w-16 truncate text-txt-muted">{cat.label}</span>
                  <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: cat.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-mono text-txt-primary">{cat.pct}%</span>
                </div>
              )) : (
                <p className="text-xs text-txt-muted italic text-center py-2">No categories yet</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Error ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm"
            >
              <span>{error}</span>
              <button onClick={loadTasks} className="flex items-center gap-1 hover:text-rose-300">
                <RiRefreshLine /> Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── 7-Column Grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {daysData.map((day) => {
            const isToday = day.date === todayStr;
            const pct = day.tasks.length ? Math.round((day.tasks.filter(t => t.status === 'completed').length / day.tasks.length) * 100) : 0;
            
            return (
              <div key={day.date} className="flex flex-col gap-2">
                {/* Column Header */}
                <div
                  onClick={() => navigate(`/day/${day.date}`)}
                  className={`card p-2 text-center cursor-pointer hover:border-border-strong transition-colors ${isToday ? 'border-accent/50 bg-accent/5' : ''}`}
                >
                  <p className="text-xs font-bold text-txt-primary">{day.label}</p>
                  <p className="text-[10px] text-txt-muted mb-2">{fmtShortDate(day.date)}</p>
                  <div className="h-1 w-full bg-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-accent/60 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Tasks List */}
                <div className="flex-1 space-y-2">
                  {loading ? (
                    <div className="h-16 bg-bg-elevated rounded-lg animate-pulse" />
                  ) : day.tasks.length > 0 ? (
                    day.tasks.map(task => (
                      <WeekTaskCard
                        key={task._id}
                        task={task}
                        onClick={setSelectedTask}
                      />
                    ))
                  ) : (
                    <div className="h-12 border border-dashed border-border-subtle rounded-lg flex items-center justify-center">
                      <span className="text-[10px] text-txt-muted">Rest</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Task Edit Popover ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedTask && (
          <TaskEditPopover
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleTaskUpdate}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}
