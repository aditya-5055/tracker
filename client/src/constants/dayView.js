// ─── Category definitions (shared across all day-view components) ─────────────
export const CATEGORIES = [
  {
    id:    'DSA',
    label: 'DSA',
    color: '#6366f1',            // indigo
    glow:  'rgba(99,102,241,0.25)',
    twText:'text-indigo-400',
    twBg:  'bg-indigo-500/15',
  },
  {
    id:    'OS',
    label: 'OS',
    color: '#2dd4bf',            // teal
    glow:  'rgba(45,212,191,0.25)',
    twText:'text-teal-400',
    twBg:  'bg-teal-500/15',
  },
  {
    id:    'DBMS',
    label: 'DBMS',
    color: '#a855f7',            // purple
    glow:  'rgba(168,85,247,0.25)',
    twText:'text-purple-400',
    twBg:  'bg-purple-500/15',
  },
  {
    id:    'SQL',
    label: 'SQL',
    color: '#3b82f6',            // blue
    glow:  'rgba(59,130,246,0.25)',
    twText:'text-blue-400',
    twBg:  'bg-blue-500/15',
  },
  {
    id:    'CNS',
    label: 'CNS',
    color: '#06b6d4',            // cyan
    glow:  'rgba(6,182,212,0.25)',
    twText:'text-cyan-400',
    twBg:  'bg-cyan-500/15',
  },
  {
    id:    'SystemDesign',
    label: 'System Design',
    color: '#f97316',            // orange
    glow:  'rgba(249,115,22,0.25)',
    twText:'text-orange-400',
    twBg:  'bg-orange-500/15',
  },
  {
    id:    'InterviewPrep',
    label: 'Interview Prep',
    color: '#f59e0b',            // amber
    glow:  'rgba(245,158,11,0.25)',
    twText:'text-amber-400',
    twBg:  'bg-amber-500/15',
  },
  {
    id:    'Project',
    label: 'Project',
    color: '#10b981',            // emerald
    glow:  'rgba(16,185,129,0.25)',
    twText:'text-emerald-400',
    twBg:  'bg-emerald-500/15',
  },
  {
    id:    'Other',
    label: 'Other',
    color: '#64748b',            // slate
    glow:  'rgba(100,116,139,0.25)',
    twText:'text-slate-400',
    twBg:  'bg-slate-500/15',
  },
];

export const getCat = (id) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

// ─── Status meta ──────────────────────────────────────────────────────────────
export const STATUS_META = {
  pending: {
    label: 'Pending',
    color: '#64748b',
    twText: 'text-slate-400',
    twBg:   'bg-slate-500/15',
    shadow: 'none',
  },
  completed: {
    label: 'Completed',
    color: '#2dd4bf',
    twText: 'text-teal-400',
    twBg:   'bg-teal-500/15',
    shadow: '0 0 18px rgba(45,212,191,0.30)',
  },
  incomplete: {
    label: 'Incomplete',
    color: '#f43f5e',
    twText: 'text-rose-400',
    twBg:   'bg-rose-500/15',
    shadow: '0 0 18px rgba(244,63,94,0.30)',
  },
  remaining: {
    label: 'Remaining',
    color: '#f59e0b',
    twText: 'text-amber-400',
    twBg:   'bg-amber-500/15',
    shadow: '0 0 18px rgba(245,158,11,0.30)',
  },
};

// ─── Timeline constants ───────────────────────────────────────────────────────
export const TIMELINE_START_HOUR = 5;   // 5 AM
export const TIMELINE_END_HOUR   = 24;  // midnight
export const PX_PER_HOUR         = 88;
export const TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
export const TOTAL_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;

export const TIMELINE_HOURS = Array.from(
  { length: TOTAL_HOURS },
  (_, i) => TIMELINE_START_HOUR + i
);

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const taskTop = (startTime) => {
  const offsetMin = toMinutes(startTime) - TIMELINE_START_HOUR * 60;
  return (offsetMin / 60) * PX_PER_HOUR;
};

export const taskHeight = (startTime, endTime) =>
  Math.max(((toMinutes(endTime) - toMinutes(startTime)) / 60) * PX_PER_HOUR, 52);

export const formatHour12 = (h) => {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
};

// ─── Time-select options (30-min increments 05:00 → 23:30 + 00:00) ───────────
const pad = (n) => String(n).padStart(2, '0');

export const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 5; h < 24; h++) {
    for (const m of [0, 30]) {
      const val = `${pad(h)}:${pad(m)}`;
      const period = h < 12 ? 'AM' : 'PM';
      const h12 = h % 12 || 12;
      opts.push({ val, label: `${h12}:${pad(m)} ${period}` });
    }
  }
  opts.push({ val: '00:00', label: '12:00 AM' });
  return opts;
})();
