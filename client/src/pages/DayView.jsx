import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiArrowLeftSLine, RiArrowRightSLine, RiCalendarTodoLine,
  RiAddLine, RiRefreshLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';

import ProgressRing  from '../components/day/ProgressRing';
import TaskCard      from '../components/day/TaskCard';
import AddTaskModal  from '../components/day/AddTaskModal';
import { fetchDayTasks } from '../api/tasks';
import {
  TIMELINE_HOURS, TIMELINE_START_HOUR, PX_PER_HOUR, TOTAL_HEIGHT,
  taskTop, taskHeight, formatHour12,
} from '../constants/dayView';

import { getLocalISODate, addDaysToLocal } from '../utils/dateUtils';

// ─── Date helpers (no external lib needed) ────────────────────────────────────
const addDays = (dateStr, delta) => addDaysToLocal(dateStr, delta);

const fmtDisplay = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

const fmtShort = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

// ─── Stat pill ────────────────────────────────────────────────────────────────
const Pill = ({ label, count, color }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-elevated
                  border border-border-subtle">
    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
    <span className="text-xs text-txt-muted">{label}</span>
    <span className="text-xs font-bold text-txt-primary">{count}</span>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd, isFuture }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 text-center"
  >
    <div className="w-20 h-20 rounded-2xl bg-bg-elevated border border-border-subtle
                    flex items-center justify-center mb-5 text-4xl">
      📅
    </div>
    <h3 className="text-lg font-bold text-txt-primary mb-2">
      {isFuture ? 'Plan your day ahead' : 'No tasks logged here'}
    </h3>
    <p className="text-sm text-txt-muted max-w-xs mb-6 leading-relaxed">
      {isFuture
        ? 'Schedule your study slots now — future you will thank you.'
        : 'This day has no tasks. Every consistent day starts with a single slot.'}
    </p>
    <motion.button
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={onAdd}
      className="btn-primary flex items-center gap-2 text-sm"
    >
      <RiAddLine /> Add First Task
    </motion.button>
  </motion.div>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="space-y-3 animate-pulse py-8">
    {[180, 240, 140, 200].map((w, i) => (
      <div key={i} className="h-16 bg-bg-elevated rounded-xl" style={{ opacity: 1 - i * 0.15 }} />
    ))}
  </div>
);

// ─── Timeline ─────────────────────────────────────────────────────────────────
function Timeline({ tasks, selectedDate, isToday, now, onHourClick, onTaskUpdated, onTaskDeleted, today }) {
  const currentMin   = now.getHours() * 60 + now.getMinutes();
  const startMin     = TIMELINE_START_HOUR * 60;
  const nowOffset    = ((currentMin - startMin) / 60) * PX_PER_HOUR;
  const showTimeLine = isToday && currentMin >= startMin;

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex">
        {/* ── Time label column ───────────────────────────────────── */}
        <div
          className="flex-shrink-0 w-14 relative select-none"
          style={{ height: TOTAL_HEIGHT }}
        >
          {TIMELINE_HOURS.map((h, i) => (
            <div
              key={h}
              className="absolute right-2 flex items-center"
              style={{ top: i * PX_PER_HOUR - 8 }}
            >
              <span className="text-[10px] font-mono text-txt-muted whitespace-nowrap">
                {formatHour12(h)}
              </span>
            </div>
          ))}
        </div>

        {/* ── Task grid column ─────────────────────────────────────── */}
        <div
          className="flex-1 relative border-l border-border-subtle"
          style={{ height: TOTAL_HEIGHT }}
        >
          {/* Hour divider lines (clickable) */}
          {TIMELINE_HOURS.map((h, i) => (
            <div
              key={h}
              className="absolute inset-x-0 border-t border-border-subtle/60
                         hover:bg-accent/5 transition-colors cursor-pointer group"
              style={{ top: i * PX_PER_HOUR, height: PX_PER_HOUR }}
              onClick={() => onHourClick(h)}
            >
              {/* Hover hint */}
              <span className="absolute right-3 top-1 text-[10px] text-accent opacity-0
                               group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <RiAddLine className="text-xs" /> Add
              </span>
            </div>
          ))}

          {/* Current time indicator */}
          {showTimeLine && (
            <motion.div
              className="absolute inset-x-0 z-20 pointer-events-none flex items-center"
              style={{ top: nowOffset }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0 -ml-1.5
                              shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
              <div className="flex-1 border-t border-rose-500/60" />
            </motion.div>
          )}

          {/* Task cards */}
          <AnimatePresence>
            {tasks.map((task) => {
              const top    = taskTop(task.startTime);
              const height = taskHeight(task.startTime, task.endTime);

              // Skip tasks outside the visible timeline
              if (top < 0 || top > TOTAL_HEIGHT) return null;

              return (
                <motion.div
                  key={task._id}
                  layout
                  className="absolute px-2"
                  style={{
                    top:    top + 1,
                    height: height - 2,
                    left:   0,
                    right:  0,
                    zIndex: 10,
                  }}
                >
                  <TaskCard
                    task={task}
                    selectedDate={selectedDate}
                    today={today}
                    now={now}
                    onUpdated={onTaskUpdated}
                    onDeleted={onTaskDeleted}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Page
// ═════════════════════════════════════════════════════════════════════════════
export default function DayView() {
  const { date: dateParam } = useParams();
  const navigate = useNavigate();

  const todayStr     = getLocalISODate();
  const selectedDate = !dateParam || dateParam === 'today' ? todayStr : dateParam;
  const isToday      = selectedDate === todayStr;
  const isFuture     = selectedDate > todayStr;

  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchErr,   setFetchErr]   = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [initTime,   setInitTime]   = useState('');
  const [now,        setNow]        = useState(new Date());
  const timelineRef  = useRef(null);

  // ── Tick clock every minute ────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setFetchErr('');
    try {
      const res = await fetchDayTasks(selectedDate);
      setTasks(res.data.tasks || []);
    } catch {
      setFetchErr('Failed to load tasks. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // ── Scroll to current time on today ───────────────────────────────────────
  useEffect(() => {
    if (!isToday || loading) return;
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const startMin   = TIMELINE_START_HOUR * 60;
    const top        = ((currentMin - startMin) / 60) * PX_PER_HOUR;
    setTimeout(() => {
      timelineRef.current?.scrollTo({ top: Math.max(0, top - 180), behavior: 'smooth' });
    }, 400);
  }, [isToday, loading]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = (d)    => navigate(`/day/${d}`);
  const prev = ()     => goTo(addDays(selectedDate, -1));
  const next = ()     => goTo(addDays(selectedDate, +1));
  const goToday = ()  => goTo(todayStr);

  // ── Task mutations ─────────────────────────────────────────────────────────
  const handleTaskCreated = (t) => {
    setTasks((p) => [...p, t].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    toast.success('Task created');
  };

  const handleTaskUpdated = (t) => {
    setTasks((p) => {
      const exists = p.some((x) => x._id === t._id);
      // If the updated task is on a different date, remove it from this view
      if (t.date !== selectedDate) return p.filter((x) => x._id !== t._id);
      return exists
        ? p.map((x) => (x._id === t._id ? t : x))
        : [...p, t].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    toast.success('Task updated');
  };

  const handleTaskDeleted = (id) => {
    setTasks((p) => p.filter((t) => t._id !== id));
    toast.success('Task deleted');
  };

  const openModal = (h = '') => {
    const hh = h ? String(h).padStart(2, '0') + ':00' : '';
    setInitTime(hh);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setInitTime(''); };

  // ── Summary stats ──────────────────────────────────────────────────────────
  const total     = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const incomplete= tasks.filter((t) => t.status === 'incomplete').length;
  const remaining = tasks.filter((t) => t.status === 'remaining').length;
  const pending   = tasks.filter((t) => t.status === 'pending').length;
  const pct       = total ? Math.round((completed / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4 pb-8"
    >
      {/* ══ TOP BAR ═══════════════════════════════════════════════════════ */}
      <div className="card flex flex-col sm:flex-row sm:items-center gap-4">

        {/* Date nav */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <motion.button
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={prev}
            className="w-9 h-9 flex items-center justify-center rounded-xl
                       bg-bg-elevated border border-border-subtle text-txt-muted
                       hover:text-txt-primary hover:border-border-default transition-all"
          >
            <RiArrowLeftSLine className="text-xl" />
          </motion.button>

          <div className="flex-1 text-center min-w-0">
            <motion.p
              key={selectedDate}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base font-bold text-txt-primary leading-tight truncate"
            >
              {fmtDisplay(selectedDate)}
            </motion.p>
            {isToday && (
              <span className="text-[10px] text-accent font-semibold tracking-widest uppercase">
                Today
              </span>
            )}
            {isFuture && (
              <span className="text-[10px] text-txt-muted font-medium">Upcoming</span>
            )}
            {!isToday && !isFuture && (
              <span className="text-[10px] text-txt-muted font-medium">Past</span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={next}
            className="w-9 h-9 flex items-center justify-center rounded-xl
                       bg-bg-elevated border border-border-subtle text-txt-muted
                       hover:text-txt-primary hover:border-border-default transition-all"
          >
            <RiArrowRightSLine className="text-xl" />
          </motion.button>
        </div>

        {/* Today + Add buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isToday && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={goToday}
              className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5"
            >
              <RiCalendarTodoLine /> Today
            </motion.button>
          )}

          {/* Progress ring */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-bg-elevated
                          border border-border-subtle rounded-xl">
            <ProgressRing pct={pct} size={52} stroke={5} />
            <div className="text-right">
              <p className="text-xs font-bold text-txt-primary">{completed}/{total}</p>
              <p className="text-[10px] text-txt-muted">done</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-1.5 text-sm px-4"
          >
            <RiAddLine className="text-base" /> Add Task
          </motion.button>
        </div>
      </div>

      {/* ══ STAT PILLS ════════════════════════════════════════════════════ */}
      {!loading && total > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2"
        >
          <Pill label="Total"      count={total}     color="#6366f1" />
          <Pill label="Completed"  count={completed} color="#2dd4bf" />
          {incomplete > 0 && <Pill label="Incomplete" count={incomplete} color="#f43f5e" />}
          {remaining  > 0 && <Pill label="Remaining"  count={remaining}  color="#f59e0b" />}
          {pending    > 0 && <Pill label="Pending"    count={pending}    color="#64748b" />}
        </motion.div>
      )}

      {/* ══ ERROR ═════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {fetchErr && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between px-4 py-3 rounded-xl
                       bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm"
          >
            <span>{fetchErr}</span>
            <button onClick={loadTasks} className="flex items-center gap-1 hover:text-rose-300">
              <RiRefreshLine /> Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ CONTENT ═══════════════════════════════════════════════════════ */}
      {loading ? (
        <LoadingSkeleton />
      ) : total === 0 ? (
        <EmptyState onAdd={() => openModal()} isFuture={isFuture} />
      ) : (
        <div ref={timelineRef} className="overflow-visible">
          <Timeline
            tasks={tasks}
            selectedDate={selectedDate}
            isToday={isToday}
            now={now}
            today={todayStr}
            onHourClick={openModal}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
        </div>
      )}

      {/* ══ ADD TASK MODAL ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <AddTaskModal
            date={selectedDate}
            initialStartTime={initTime}
            onClose={closeModal}
            onTaskCreated={handleTaskCreated}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
