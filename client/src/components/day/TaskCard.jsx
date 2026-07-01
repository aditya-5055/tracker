import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiCheckLine, RiCloseLine, RiTimeLine, RiLoader4Line,
  RiArrowRightLine, RiDeleteBinLine, RiAlarmWarningLine,
} from 'react-icons/ri';
import { getCat, STATUS_META } from '../../constants/dayView';
import { updateTask, deleteTask } from '../../api/tasks';
import { createNote } from '../../api/notes';
import { useNavigate } from 'react-router-dom';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isPastDue = (task, selectedDate, today, now) => {
  if (task.status !== 'pending') return false;
  if (selectedDate > today)      return false;
  if (selectedDate < today)      return true;   // past date, still pending
  const [h, m]  = task.endTime.split(':').map(Number);
  const endMin  = h * 60 + m;
  const nowMin  = now.getHours() * 60 + now.getMinutes();
  return endMin <= nowMin;
};

const fmt12 = (hhmm) => {
  const [h, m]  = hhmm.split(':').map(Number);
  const period  = h < 12 ? 'AM' : 'PM';
  const h12     = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

// ─── Status actions ───────────────────────────────────────────────────────────
const STATUS_ACTIONS = [
  {
    status: 'completed',
    icon:   RiCheckLine,
    label:  'Done',
    cls:    'bg-teal-500/15 border-teal-500/40 text-teal-400 hover:bg-teal-500/25',
  },
  {
    status: 'incomplete',
    icon:   RiCloseLine,
    label:  'Incomplete',
    cls:    'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25',
  },
  {
    status: 'remaining',
    icon:   RiTimeLine,
    label:  'Carry Over',
    cls:    'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25',
  },
];

// ─── Card variants ────────────────────────────────────────────────────────────
const cardVariants = {
  initial: { opacity: 0, x: -14, scale: 0.98 },
  enter:   { opacity: 1, x: 0,   scale: 1,   transition: { type: 'spring', stiffness: 280, damping: 24 } },
  exit:    { opacity: 0, x: 16,  scale: 0.96, transition: { duration: 0.2 } },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function TaskCard({
  task,
  selectedDate,
  today,
  now,
  onUpdated,
  onDeleted,
}) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moveErr,  setMoveErr]  = useState('');
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const cat      = getCat(task.category);
  const statusM  = STATUS_META[task.status];
  const overdue  = isPastDue(task, selectedDate, today, now);

  // ── Mark status ────────────────────────────────────────────────────────────
  const handleStatus = async (newStatus) => {
    setUpdating(true);
    setMoveErr('');
    try {
      const res = await updateTask(task._id, { status: newStatus });
      onUpdated(res.data.task);
    } catch {
      // silent — keep card visible
    } finally {
      setUpdating(false);
    }
  };

  // ── Move to today ──────────────────────────────────────────────────────────
  const handleMoveToToday = async () => {
    setUpdating(true);
    setMoveErr('');
    try {
      const res = await updateTask(task._id, { date: today, status: 'pending' });
      onDeleted(task._id);           // remove from current day
      onUpdated(res.data.task);      // parent may ignore if it's a different day
    } catch (err) {
      setMoveErr(err.response?.data?.message || 'Slot conflict on today\u0027s schedule.');
    } finally {
      setUpdating(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    setDeleting(true);
    try {
      await deleteTask(task._id);
      onDeleted(task._id);
    } catch {
      setDeleting(false);
    }
  };

  // ── Add Note ───────────────────────────────────────────────────────────────
  const handleAddNote = async (e) => {
    e.stopPropagation();
    try {
      const res = await createNote({ title: task.title, category: task.category });
      if (res.success) {
        navigate(`/notes?id=${res.note._id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Card bg/glow by status ─────────────────────────────────────────────────
  const glowStyle = { boxShadow: statusM.shadow };

  const bgCls = {
    pending:   'bg-bg-card',
    completed: 'bg-teal-950/30',
    incomplete:'bg-rose-950/20',
    remaining: 'bg-amber-950/20',
  }[task.status];

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={`
        relative min-h-full flex flex-col rounded-xl border overflow-hidden
        cursor-pointer transition-all duration-200 select-none
        ${bgCls}
        ${overdue ? 'border-amber-500/50' : 'border-border-default'}
        hover:border-border-strong
      `}
      style={{ ...glowStyle, borderLeftWidth: 3, borderLeftColor: cat.color }}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* ── Top: time + status badge ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <span className="text-[10px] font-mono text-txt-muted">
          {fmt12(task.startTime)} – {fmt12(task.endTime)}
        </span>
        <span
          className={`badge text-[10px] font-semibold ${statusM.twBg} ${statusM.twText}`}
          style={{ borderColor: `${statusM.color}30` }}
        >
          {statusM.label}
        </span>
      </div>

      {/* ── Title + category ─────────────────────────────────────────────── */}
      <div className="flex-1 px-3 pb-2 min-h-0">
        <p className={`text-sm font-semibold leading-snug line-clamp-2
                       ${task.status === 'completed' ? 'line-through text-txt-muted' : 'text-txt-primary'}`}>
          {task.status === 'completed' && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex w-4 h-4 rounded-full bg-teal-500 items-center justify-center
                         mr-1.5 flex-shrink-0 align-middle"
            >
              <RiCheckLine className="text-white text-[10px]" />
            </motion.span>
          )}
          {task.title}
        </p>

        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={`badge text-[9px] font-bold ${cat.twBg} ${cat.twText}`}
            style={{ borderColor: `${cat.color}30` }}
          >
            {cat.label}
          </span>
          {task.notes && (
            <span className="text-[9px] text-txt-muted truncate max-w-[120px]">
              {task.notes}
            </span>
          )}
        </div>
      </div>

      {/* ── Overdue warning strip ────────────────────────────────────────── */}
      <AnimatePresence>
        {overdue && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-amber-500/30 bg-amber-500/5 px-3 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 mb-1.5">
              <RiAlarmWarningLine className="text-amber-400 text-xs" />
              <span className="text-[10px] text-amber-400 font-semibold">
                Time's up — mark this slot
              </span>
            </div>

            <div className="flex gap-1.5">
              {STATUS_ACTIONS.map(({ status, icon: Icon, label, cls }) => (
                <motion.button
                  key={status}
                  whileTap={{ scale: 0.93 }}
                  disabled={updating}
                  onClick={() => handleStatus(status)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg
                               text-[10px] font-semibold border transition-all duration-150
                               disabled:opacity-50 ${cls}`}
                >
                  {updating ? (
                    <RiLoader4Line className="animate-spin text-xs" />
                  ) : (
                    <><Icon className="text-xs" />{label}</>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Remaining → Move to today ────────────────────────────────────── */}
      <AnimatePresence>
        {task.status === 'remaining' && selectedDate !== today && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-amber-500/20 px-3 py-2 bg-amber-500/5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              disabled={updating}
              onClick={handleMoveToToday}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg
                         text-[10px] font-semibold text-amber-400
                         bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30
                         transition-all duration-150 disabled:opacity-50"
            >
              {updating
                ? <RiLoader4Line className="animate-spin" />
                : <><RiArrowRightLine />Move to Today</>
              }
            </button>
            {moveErr && (
              <p className="text-[10px] text-rose-400 mt-1 text-center">{moveErr}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Expanded: notes + delete ─────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border-subtle px-3 py-2.5 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            {task.notes ? (
              <p className="text-xs text-txt-secondary leading-relaxed break-words">
                {task.notes}
              </p>
            ) : (
              <p className="text-xs text-txt-muted italic">No notes.</p>
            )}

            {/* Non-overdue status actions */}
            {!overdue && task.status === 'pending' && (
              <div className="flex gap-1.5 pt-1">
                {STATUS_ACTIONS.map(({ status, icon: Icon, label, cls }) => (
                  <motion.button
                    key={status}
                    whileTap={{ scale: 0.93 }}
                    disabled={updating}
                    onClick={() => handleStatus(status)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg
                                 text-[10px] font-semibold border transition-all duration-150
                                 disabled:opacity-50 ${cls}`}
                  >
                    <Icon className="text-xs" />{label}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Allow re-marking if already marked */}
            {!overdue && task.status !== 'pending' && (
              <div className="flex gap-1.5 pt-1">
                {STATUS_ACTIONS.filter((a) => a.status !== task.status).map(
                  ({ status, icon: Icon, label, cls }) => (
                    <motion.button
                      key={status}
                      whileTap={{ scale: 0.93 }}
                      disabled={updating}
                      onClick={() => handleStatus(status)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg
                                   text-[10px] font-semibold border transition-all duration-150
                                   disabled:opacity-50 ${cls}`}
                    >
                      <Icon className="text-xs" />{label}
                    </motion.button>
                  )
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-1 mt-2 border-t border-border-subtle/50">
              <button
                onClick={handleAddNote}
                className="flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover transition-colors duration-150 font-medium"
              >
                📄 Add Note
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-[10px] text-txt-muted
                           hover:text-rose-400 transition-colors duration-150 disabled:opacity-50"
              >
                {deleting
                  ? <RiLoader4Line className="animate-spin text-xs" />
                  : <RiDeleteBinLine className="text-xs" />
                }
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spinner overlay while updating/deleting */}
      <AnimatePresence>
        {(updating || deleting) && !overdue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg-card/60 rounded-xl flex items-center justify-center"
          >
            <RiLoader4Line className="text-accent text-xl animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
