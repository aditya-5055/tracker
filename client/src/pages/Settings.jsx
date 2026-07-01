import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  RiSettings4Line, RiUserLine, RiTimeLine, RiPaletteLine,
  RiCheckLine, RiLoader4Line,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';

import api from '../api';

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h12 = i % 12 || 12;
  const period = i < 12 ? 'AM' : 'PM';
  return { value: i, label: `${h12}:00 ${period}` };
});

export default function Settings() {
  const { user, updateUser } = useAuth();

  // Profile
  const [goal, setGoal]     = useState(user?.personalGoal || '');
  const [saving, setSaving] = useState(false);

  // Day-view prefs (localStorage)
  const [startHour, setStartHour] = useState(() => {
    const stored = localStorage.getItem('cos_dayview_start');
    return stored ? Number(stored) : 5;
  });
  const [endHour, setEndHour] = useState(() => {
    const stored = localStorage.getItem('cos_dayview_end');
    return stored ? Number(stored) : 24;
  });

  const handleSaveGoal = async () => {
    if (goal.trim() === (user?.personalGoal || '')) return;
    setSaving(true);
    const { success } = await updateUser({ personalGoal: goal.trim() });
    setSaving(false);
    if (success) {
      toast.success('Personal goal saved');
    } else {
      toast.error('Failed to save goal');
    }
  };

  const handleSaveTimeline = () => {
    if (startHour >= endHour) {
      toast.error('Start hour must be before end hour');
      return;
    }
    localStorage.setItem('cos_dayview_start', startHour);
    localStorage.setItem('cos_dayview_end', endHour);
    toast.success('Day view timeline saved');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6 pb-12 max-w-3xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div variants={item} className="card flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center text-accent flex-shrink-0">
          <RiSettings4Line className="text-2xl" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-txt-primary">Settings</h2>
          <p className="text-sm text-txt-secondary">Profile, preferences & customization</p>
        </div>
      </motion.div>

      {/* ── Profile Card ──────────────────────────────────────── */}
      <motion.div variants={item} className="card">
        <div className="flex items-center gap-3 mb-5">
          <RiUserLine className="text-accent text-lg" aria-hidden="true" />
          <h3 className="text-sm font-bold text-txt-primary">Profile</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs font-semibold text-txt-muted block mb-1.5">Name</label>
            <input
              type="text"
              value={user?.name || ''}
              readOnly
              className="input-field opacity-60 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-txt-muted block mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="input-field opacity-60 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-txt-muted block mb-1.5">Personal Goal Statement</label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. I'm building toward financial independence..."
            className="input-field min-h-[80px] resize-none w-full"
            maxLength={300}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-txt-muted">{goal.length}/300</span>
            <button
              onClick={handleSaveGoal}
              disabled={saving || goal.trim() === (user?.personalGoal || '')}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {saving ? <RiLoader4Line className="animate-spin" aria-hidden="true" /> : <RiCheckLine aria-hidden="true" />}
              Save Goal
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Day View Preferences ──────────────────────────────── */}
      <motion.div variants={item} className="card">
        <div className="flex items-center gap-3 mb-5">
          <RiTimeLine className="text-teal-400 text-lg" aria-hidden="true" />
          <h3 className="text-sm font-bold text-txt-primary">Day View Timeline</h3>
        </div>

        <p className="text-xs text-txt-secondary mb-4">
          Set your default visible time range. Tasks outside this range will still be saved.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-txt-muted block mb-1.5">Start Hour</label>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="input-field w-full"
            >
              {HOUR_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-txt-muted block mb-1.5">End Hour</label>
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="input-field w-full"
            >
              {HOUR_OPTIONS.filter(o => o.value > 0).map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
              <option value={24}>12:00 AM (midnight)</option>
            </select>
          </div>
        </div>

        <button onClick={handleSaveTimeline} className="btn-primary flex items-center gap-2 text-sm">
          <RiCheckLine aria-hidden="true" /> Save Preferences
        </button>
      </motion.div>

      {/* ── Appearance ────────────────────────────────────────── */}
      <motion.div variants={item} className="card">
        <div className="flex items-center gap-3 mb-5">
          <RiPaletteLine className="text-purple-400 text-lg" aria-hidden="true" />
          <h3 className="text-sm font-bold text-txt-primary">Appearance</h3>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-border-subtle">
          <div>
            <p className="text-sm font-semibold text-txt-primary">Dark Theme</p>
            <p className="text-xs text-txt-muted">Currently the default and only theme</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold">Active</div>
        </div>
      </motion.div>

    </motion.div>
  );
}
