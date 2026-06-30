import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiCloseLine, RiTimeLine, RiAddCircleLine, RiLoader4Line,
} from 'react-icons/ri';
import { CATEGORIES, TIME_OPTIONS } from '../../constants/dayView';
import { createTask } from '../../api/tasks';

// ─── Format YYYY-MM-DD → readable ─────────────────────────────────────────────
const fmtDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

// ─── End-time options filtered to be after startTime ─────────────────────────
const endOptions = (start) => {
  if (!start) return TIME_OPTIONS.slice(1);
  return TIME_OPTIONS.filter(({ val }) => {
    // allow 00:00 (midnight) only if start is before midnight
    if (val === '00:00') return true;
    return val > start;
  });
};

export default function AddTaskModal({ date, initialStartTime = '', onClose, onTaskCreated }) {
  const [form, setForm] = useState({
    startTime: initialStartTime || '',
    endTime:   '',
    title:     '',
    category:  'DSA',
    notes:     '',
  });
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef(null);

  // Auto-set endTime to startTime+1hr when startTime changes
  useEffect(() => {
    if (!form.startTime) return;
    const idx = TIME_OPTIONS.findIndex((o) => o.val === form.startTime);
    const nextIdx = idx + 2; // +2 = 1 hour (each step = 30 min)
    const next = TIME_OPTIONS[nextIdx];
    if (next) setForm((p) => ({ ...p, endTime: next.val }));
  }, [form.startTime]);

  // Focus title on open
  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 150); }, []);

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startTime || !form.endTime) return setError('Pick a start and end time.');
    if (!form.title.trim())               return setError('Task title is required.');
    if (form.startTime >= form.endTime && form.endTime !== '00:00')
      return setError('End time must be after start time.');

    setSubmitting(true);
    setError('');
    try {
      const res = await createTask({ ...form, title: form.title.trim(), date });
      onTaskCreated(res.data.task);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <motion.div
        className="relative z-10 w-full max-w-lg bg-bg-card border border-border-default
                   rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.93, opacity: 0, y: 24 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{ scale: 0.93,    opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-border-subtle bg-bg-elevated">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <RiAddCircleLine className="text-accent text-lg" />
            </div>
            <div>
              <p className="text-sm font-bold text-txt-primary leading-tight">Add Task</p>
              <p className="text-[11px] text-txt-muted">{fmtDate(date)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       text-txt-muted hover:text-txt-primary hover:bg-bg-card
                       transition-all duration-200"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* ── Form ──────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Time row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Start time */}
            <div>
              <label className="block text-xs text-txt-muted font-medium mb-1.5">
                Start Time
              </label>
              <div className="relative">
                <RiTimeLine className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm" />
                <select
                  value={form.startTime}
                  onChange={set('startTime')}
                  className="input-field pl-8 appearance-none cursor-pointer"
                >
                  <option value="">— pick —</option>
                  {TIME_OPTIONS.map(({ val, label }) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* End time */}
            <div>
              <label className="block text-xs text-txt-muted font-medium mb-1.5">
                End Time
              </label>
              <div className="relative">
                <RiTimeLine className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm" />
                <select
                  value={form.endTime}
                  onChange={set('endTime')}
                  className="input-field pl-8 appearance-none cursor-pointer"
                >
                  <option value="">— pick —</option>
                  {endOptions(form.startTime).map(({ val, label }) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-txt-muted font-medium mb-1.5">
              Task / Topic <span className="text-rose-400">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Leetcode — Binary Search patterns"
              maxLength={200}
              className="input-field"
            />
          </div>

          {/* Category grid */}
          <div>
            <label className="block text-xs text-txt-muted font-medium mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const active = form.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, category: cat.id }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                                border transition-all duration-150
                                ${active
                                  ? 'bg-bg-elevated border-transparent text-txt-primary'
                                  : 'bg-bg-elevated/50 border-border-subtle text-txt-muted hover:border-border-default'
                                }`}
                    style={active ? { borderColor: cat.color, boxShadow: `0 0 10px ${cat.glow}` } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: cat.color }}
                    />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-txt-muted font-medium mb-1.5">
              Notes <span className="text-txt-muted/50">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              placeholder="Problem link, resource, or any context…"
              rows={3}
              maxLength={2000}
              className="input-field resize-none"
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30
                           text-rose-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? <><RiLoader4Line className="animate-spin" /> Adding…</>
                : <><RiAddCircleLine /> Add Task</>
              }
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
