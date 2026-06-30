const mongoose = require('mongoose');

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'DSA', 'OS', 'DBMS', 'SQL', 'CNS',
  'SystemDesign', 'InterviewPrep', 'Project', 'Other',
];

const STATUSES = ['pending', 'completed', 'incomplete', 'remaining'];

// ─── Schema ───────────────────────────────────────────────────────────────────
const taskSchema = new mongoose.Schema(
  {
    // ── Ownership ──────────────────────────────────────────────────────────
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // ── Date (stored as YYYY-MM-DD string — timezone-safe) ─────────────────
    date: {
      type:     String,
      required: [true, 'Date is required (YYYY-MM-DD)'],
      match:    [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
      index:    true,
    },

    // ── Time slot ──────────────────────────────────────────────────────────
    // Stored as "HH:MM" in 24-hour format so arithmetic & sorting is easy.
    startTime: {
      type:     String,
      required: [true, 'Start time is required (HH:MM)'],
      match:    [/^\d{2}:\d{2}$/, 'startTime must be HH:MM (24h)'],
    },
    endTime: {
      type:     String,
      required: [true, 'End time is required (HH:MM)'],
      match:    [/^\d{2}:\d{2}$/, 'endTime must be HH:MM (24h)'],
    },

    // ── Content ───────────────────────────────────────────────────────────
    title: {
      type:      String,
      required:  [true, 'Title is required'],
      trim:      true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    category: {
      type:     String,
      enum:     { values: CATEGORIES, message: 'Invalid category' },
      required: [true, 'Category is required'],
    },

    status: {
      type:    String,
      enum:    { values: STATUSES, message: 'Invalid status' },
      default: 'pending',
    },

    notes: {
      type:      String,
      trim:      true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
      default:   '',
    },
  },
  {
    timestamps: true,                 // createdAt, updatedAt
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ─── Virtual: human-readable slot label ───────────────────────────────────────
taskSchema.virtual('slotLabel').get(function () {
  const fmt = (t) => {
    const [h, m] = t.split(':').map(Number);
    const period = h < 12 ? 'AM' : 'PM';
    const h12    = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };
  return `${fmt(this.startTime)} – ${fmt(this.endTime)}`;
});

// ─── Static helpers ───────────────────────────────────────────────────────────
/**
 * Convert "HH:MM" → integer minutes since midnight.
 * Used for overlap detection.
 */
taskSchema.statics.toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Check whether two [start, end) intervals overlap.
 * Uses half-open intervals: [startA, endA) overlaps [startB, endB)
 * iff startA < endB && startB < endA.
 */
taskSchema.statics.slotsOverlap = (s1, e1, s2, e2) => {
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  return toMin(s1) < toMin(e2) && toMin(s2) < toMin(e1);
};

// ─── Compound index: fast date-based queries per user ─────────────────────────
taskSchema.index({ userId: 1, date: 1 });

// ─── Export ───────────────────────────────────────────────────────────────────
module.exports = mongoose.model('Task', taskSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES   = STATUSES;
