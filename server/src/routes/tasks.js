const express  = require('express');
const router   = express.Router();
const Task     = require('../models/Task');
const { protect } = require('../middleware/auth');

// All task routes require authentication
router.use(protect);

// ─── Shared validation helper ─────────────────────────────────────────────────
const validateTimeOrder = (startTime, endTime) => {
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  return toMin(endTime) > toMin(startTime);
};

// ─── Overlap check helper ─────────────────────────────────────────────────────
/**
 * Returns the conflicting task if any task owned by the current user on the
 * given date overlaps [startTime, endTime), excluding `excludeId` (for PATCH).
 */
const findOverlap = async (userId, date, startTime, endTime, excludeId = null) => {
  const existing = await Task.find({ userId, date });
  return existing.find((t) => {
    if (excludeId && t._id.toString() === excludeId.toString()) return false;
    return Task.slotsOverlap(startTime, endTime, t.startTime, t.endTime);
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/tasks — Create a task
// ══════════════════════════════════════════════════════════════════════════════
router.post('/', async (req, res, next) => {
  try {
    const { date, startTime, endTime, title, category, status, notes } = req.body;

    // ── Required field check ─────────────────────────────────────────────
    if (!date || !startTime || !endTime || !title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Fields required: date, startTime, endTime, title, category.',
      });
    }

    // ── Date format check ────────────────────────────────────────────────
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'date must be in YYYY-MM-DD format.',
      });
    }

    // ── Time format check ────────────────────────────────────────────────
    const timeRe = /^\d{2}:\d{2}$/;
    if (!timeRe.test(startTime) || !timeRe.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'startTime and endTime must be in HH:MM (24-hour) format.',
      });
    }

    // ── Time order check ─────────────────────────────────────────────────
    if (!validateTimeOrder(startTime, endTime)) {
      return res.status(400).json({
        success: false,
        message: 'endTime must be strictly after startTime.',
      });
    }

    // ── Overlap check ────────────────────────────────────────────────────
    const conflict = await findOverlap(req.user._id, date, startTime, endTime);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Time slot overlaps with "${conflict.title}" (${conflict.slotLabel}).`,
        conflict: {
          _id:       conflict._id,
          title:     conflict.title,
          startTime: conflict.startTime,
          endTime:   conflict.endTime,
          slotLabel: conflict.slotLabel,
        },
      });
    }

    const task = await Task.create({
      userId:    req.user._id,
      date,
      startTime,
      endTime,
      title,
      category,
      status:    status || 'pending',
      notes:     notes  || '',
    });

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/tasks/dashboard
//   Calculates and returns today's progress, streaks, category breakdowns,
//   and the weekly trend for the last 8 weeks.
// ══════════════════════════════════════════════════════════════════════════════
router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    // Keep local offset
    const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    // Fetch all user tasks (lean for performance)
    const allTasks = await Task.find({ userId }).select('date status category').lean();

    // 1. Today's Progress
    const todayTasks = allTasks.filter(t => t.date === todayStr);
    const todayTotal = todayTasks.length;
    const todayCompleted = todayTasks.filter(t => t.status === 'completed').length;
    const todayPct = todayTotal ? Math.round((todayCompleted / todayTotal) * 100) : 0;
    const todayProgress = { completed: todayCompleted, total: todayTotal, pct: todayPct };

    // 2. Streaks
    const dateMap = {};
    for (const t of allTasks) {
      if (!dateMap[t.date]) dateMap[t.date] = { completed: 0 };
      if (t.status === 'completed') dateMap[t.date].completed++;
    }
    const completedDates = Object.entries(dateMap)
      .filter(([_, data]) => data.completed > 0)
      .map(([date]) => date)
      .sort();

    let longestStreak = 0;
    let currentStreak = 0;
    
    if (completedDates.length > 0) {
      let tempStreak = 1;
      let maxTemp = 1;
      for (let i = 1; i < completedDates.length; i++) {
        const prev = new Date(completedDates[i-1]);
        const curr = new Date(completedDates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
        if (tempStreak > maxTemp) maxTemp = tempStreak;
      }
      longestStreak = maxTemp;

      let checkDate = new Date(todayStr);
      if (!completedDates.includes(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1); 
      }
      if (completedDates.includes(checkDate.toISOString().split('T')[0])) {
         let cStreak = 0;
         while(completedDates.includes(checkDate.toISOString().split('T')[0])) {
           cStreak++;
           checkDate.setDate(checkDate.getDate() - 1);
         }
         currentStreak = cStreak;
      }
    }
    const streaks = { currentStreak, longestStreak };

    // 3. Category Breakdown
    const catMap = {};
    for (const t of allTasks) {
      if (!catMap[t.category]) catMap[t.category] = { total: 0, completed: 0 };
      catMap[t.category].total++;
      if (t.status === 'completed') catMap[t.category].completed++;
    }
    const categoryBreakdown = Object.entries(catMap).map(([category, data]) => ({
      category,
      total: data.total,
      completed: data.completed,
      pct: Math.round((data.completed / data.total) * 100),
    }));

    // 4. Weekly Trend (last 8 weeks)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const thisMonday = new Date(now.setDate(diff));
    thisMonday.setHours(0,0,0,0);
    
    const weeklyTrend = [];
    for (let i = 7; i >= 0; i--) {
      const wStart = new Date(thisMonday);
      wStart.setDate(wStart.getDate() - (i * 7));
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6);

      const wStartStr = new Date(wStart.getTime() - (wStart.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const wEndStr = new Date(wEnd.getTime() - (wEnd.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      
      const wTasks = allTasks.filter(t => t.date >= wStartStr && t.date <= wEndStr);
      const wTotal = wTasks.length;
      const wCompleted = wTasks.filter(t => t.status === 'completed').length;
      const wPct = wTotal ? Math.round((wCompleted / wTotal) * 100) : 0;
      
      const label = wStartStr.substring(5).replace('-', '/'); // MM/DD
      weeklyTrend.push({ week: label, pct: wPct, completed: wCompleted, total: wTotal });
    }

    return res.status(200).json({
      success: true,
      todayProgress,
      streaks,
      categoryBreakdown,
      weeklyTrend
    });
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/tasks
//   ?date=YYYY-MM-DD     → all tasks for a single day  (sorted by startTime)
//   ?month=YYYY-MM       → summary for every day in the month (for heatmap)
//   ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD → all tasks in a date range
//   (no query)           → today's tasks
// ══════════════════════════════════════════════════════════════════════════════
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { date, month, year, startDate, endDate } = req.query;

    // ── Range query (Week View) ──────────────────────────────────────────
    if (startDate && endDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate must be in YYYY-MM-DD format.',
        });
      }
      const tasks = await Task.find({
        userId,
        date: { $gte: startDate, $lte: endDate },
      }).sort({ date: 1, startTime: 1 });

      return res.status(200).json({ success: true, startDate, endDate, tasks });
    }

    // ── Month query → heatmap payload ────────────────────────────────────
    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
          success: false,
          message: 'month must be in YYYY-MM format.',
        });
      }

      // Match all dates that start with "YYYY-MM-"
      const tasks = await Task.find({
        userId,
        date: { $regex: `^${month}-` },
      }).select('date status -_id').lean();

      // Group by date → compute per-day stats
      const dayMap = {};
      for (const t of tasks) {
        if (!dayMap[t.date]) {
          dayMap[t.date] = { total: 0, completed: 0, incomplete: 0, remaining: 0, pending: 0 };
        }
        dayMap[t.date].total++;
        dayMap[t.date][t.status]++;
      }

      // Convert to array sorted by date
      const heatmap = Object.entries(dayMap)
        .map(([d, stats]) => ({
          date: d,
          ...stats,
          completionPct: stats.total
            ? Math.round((stats.completed / stats.total) * 100)
            : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return res.status(200).json({ success: true, month, heatmap });
    }

    // ── Year query → full 365 heatmap payload ──────────────────────────────
    if (year) {
      if (!/^\d{4}$/.test(year)) {
        return res.status(400).json({
          success: false,
          message: 'year must be in YYYY format.',
        });
      }

      const tasks = await Task.find({
        userId,
        date: { $regex: `^${year}-` },
      }).select('date status -_id').lean();

      const dayMap = {};
      for (const t of tasks) {
        if (!dayMap[t.date]) {
          dayMap[t.date] = { total: 0, completed: 0, incomplete: 0, remaining: 0, pending: 0 };
        }
        dayMap[t.date].total++;
        dayMap[t.date][t.status]++;
      }

      const heatmap = Object.entries(dayMap)
        .map(([d, stats]) => ({
          date: d,
          ...stats,
          completionPct: stats.total
            ? Math.round((stats.completed / stats.total) * 100)
            : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return res.status(200).json({ success: true, year, heatmap });
    }

    // ── Day query (or default to today) ──────────────────────────────────
    const targetDate = date || new Date().toISOString().split('T')[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return res.status(400).json({
        success: false,
        message: 'date must be in YYYY-MM-DD format.',
      });
    }

    const tasks = await Task.find({ userId, date: targetDate })
      .sort({ startTime: 1 });

    // ── Day-level summary counts ─────────────────────────────────────────
    const summary = {
      total:     tasks.length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      incomplete: tasks.filter((t) => t.status === 'incomplete').length,
      remaining: tasks.filter((t) => t.status === 'remaining').length,
      pending:   tasks.filter((t) => t.status === 'pending').length,
    };
    summary.completionPct = summary.total
      ? Math.round((summary.completed / summary.total) * 100)
      : 0;

    res.status(200).json({ success: true, date: targetDate, summary, tasks });
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/tasks/:id — Update a task
//   Updatable: title, category, status, notes, startTime, endTime, date
// ══════════════════════════════════════════════════════════════════════════════
router.patch('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const allowed = ['title', 'category', 'status', 'notes', 'startTime', 'endTime', 'date'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // ── Re-validate time if either time or date is changing ──────────────
    const newStart = updates.startTime ?? task.startTime;
    const newEnd   = updates.endTime   ?? task.endTime;
    const newDate  = updates.date      ?? task.date;

    const timeRe = /^\d{2}:\d{2}$/;
    if (!timeRe.test(newStart) || !timeRe.test(newEnd)) {
      return res.status(400).json({
        success: false,
        message: 'startTime and endTime must be in HH:MM (24-hour) format.',
      });
    }

    if (!validateTimeOrder(newStart, newEnd)) {
      return res.status(400).json({
        success: false,
        message: 'endTime must be strictly after startTime.',
      });
    }

    if (
      newStart !== task.startTime ||
      newEnd   !== task.endTime   ||
      newDate  !== task.date
    ) {
      const conflict = await findOverlap(req.user._id, newDate, newStart, newEnd, task._id);
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Updated slot overlaps with "${conflict.title}" (${conflict.slotLabel}).`,
          conflict: {
            _id:       conflict._id,
            title:     conflict.title,
            startTime: conflict.startTime,
            endTime:   conflict.endTime,
            slotLabel: conflict.slotLabel,
          },
        });
      }
    }

    Object.assign(task, updates);
    await task.save();

    res.status(200).json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/tasks/:id
// ══════════════════════════════════════════════════════════════════════════════
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.status(200).json({ success: true, message: 'Task deleted.', taskId: task._id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
