import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiLightbulbLine, RiFireLine, RiTrophyLine, RiBarChartBoxLine,
  RiAddLine, RiCalendarCheckLine, RiCalendarEventLine, RiRefreshLine
} from 'react-icons/ri';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardStats } from '../api/tasks';
import { fetchNotes } from '../api/notes';
import { CATEGORIES } from '../constants/dayView';
import ProgressRing from '../components/day/ProgressRing';
import { getLocalISODate } from '../utils/dateUtils';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, notesRes] = await Promise.all([
        fetchDashboardStats(),
        fetchNotes({ sort: 'newest', limit: 3 })
      ]);
      setStats(statsRes.data);
      if (notesRes.success) setRecentNotes(notesRes.notes);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const [showBanner, setShowBanner] = useState(false);
  const [quote, setQuote] = useState('');

  const MOTIVATION_QUOTES = [
    "Consistency over intensity. One step every day builds an empire.",
    "The cost of procrastination is the life you could have lived.",
    "Don't trade what you want most for what you want right now.",
    "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
    "Discipline equals freedom. Own your schedule.",
    "Your future self is watching you right now through memories. Make them proud."
  ];

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    // Check if banner was dismissed today
    const dismissedAt = localStorage.getItem('cos_banner_dismissed');
    const today = getLocalISODate();
    if (dismissedAt !== today) {
      setQuote(MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)]);
      setShowBanner(true);
    }
  }, []);

  const dismissBanner = () => {
    const today = getLocalISODate();
    localStorage.setItem('cos_banner_dismissed', today);
    setShowBanner(false);
  };

  const todayStr = getLocalISODate();
  const formattedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Map category breakdown to colors
  const catData = stats?.categoryBreakdown?.map(c => {
    const catMeta = CATEGORIES.find(cat => cat.id === c.category) || CATEGORIES[CATEGORIES.length - 1];
    return { ...c, color: catMeta.color, label: catMeta.label };
  }) || [];

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60) || 1}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6 pb-12">

      {/* ── Motivation Banner ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="relative overflow-hidden rounded-2xl shadow-glow-indigo"
          >
            {/* Abstract CSS Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-bg-card opacity-90" />
            
            {/* SVG Abstract Mountains/Waves overlay */}
            <svg className="absolute bottom-0 left-0 w-full h-auto text-white/5 pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="currentColor" d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,213.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>

            <div className="relative z-10 px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs font-bold text-accent-teal uppercase tracking-[0.2em] mb-3">Daily Fuel</p>
                <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight italic">
                  "{quote}"
                </h2>
              </div>
              <button 
                onClick={dismissBanner}
                className="shrink-0 px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/10"
              >
                Dismiss for today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <motion.div variants={item} className="card bg-gradient-dark border-border-default relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-indigo opacity-5 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <p className="text-xs text-accent font-semibold tracking-widest uppercase mb-1">{formattedDate}</p>
            <h2 className="text-2xl font-extrabold text-txt-primary mb-1">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
            </h2>
            <p className="text-sm text-txt-secondary">
              Let's keep your placement prep streak alive.
            </p>
            
            {user?.personalGoal && (
              <div className="mt-4 p-3 rounded-lg bg-bg-elevated/50 border border-border-subtle inline-block">
                <p className="text-xs font-semibold text-accent mb-1">Your Why:</p>
                <p className="text-sm text-txt-primary font-medium italic">"{user.personalGoal}"</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <div className="bg-bg-elevated/50 border border-border-subtle rounded-xl px-5 py-3 text-center min-w-[120px]">
              <div className="flex items-center justify-center gap-1.5 mb-1 text-orange-500">
                <RiFireLine />
                <span className="text-xs font-semibold">Current Streak</span>
              </div>
              <p className="text-2xl font-bold text-txt-primary">{loading ? '—' : stats?.streaks?.currentStreak}</p>
            </div>
            <div className="bg-bg-elevated/50 border border-border-subtle rounded-xl px-5 py-3 text-center min-w-[120px]">
              <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-500">
                <RiTrophyLine />
                <span className="text-xs font-semibold">Best Streak</span>
              </div>
              <p className="text-2xl font-bold text-txt-primary">{loading ? '—' : stats?.streaks?.longestStreak}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            <span>{error}</span>
            <button onClick={loadStats} className="flex items-center gap-1 hover:text-rose-300">
              <RiRefreshLine /> Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Today's Snapshot ───────────────────────────────────────────────── */}
        <motion.div variants={item} className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-txt-primary">Today's Snapshot</h3>
            <RiLightbulbLine className="text-accent-teal text-lg" />
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center py-4">
            {loading ? (
              <div className="w-32 h-32 rounded-full border-4 border-bg-elevated animate-pulse" />
            ) : (
              <ProgressRing pct={stats?.todayProgress?.pct || 0} size={140} stroke={10} />
            )}
            <p className="text-sm text-txt-secondary mt-4 font-medium">
              {loading ? '—/—' : `${stats?.todayProgress?.completed || 0} / ${stats?.todayProgress?.total || 0}`} tasks completed
            </p>
          </div>

          <button
            onClick={() => navigate(`/day/${todayStr}`)}
            className="w-full mt-4 btn-primary flex items-center justify-center gap-2"
          >
            <RiAddLine /> Add Task
          </button>
        </motion.div>

        {/* ── Weekly Trend ───────────────────────────────────────────────────── */}
        <motion.div variants={item} className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-txt-primary">8-Week Trend</h3>
              <p className="text-xs text-txt-muted">Completion percentage over time</p>
            </div>
            <RiBarChartBoxLine className="text-amber-400 text-lg" />
          </div>
          
          <div className="h-[220px] w-full">
            {loading ? (
              <div className="w-full h-full bg-bg-elevated rounded-lg animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.weeklyTrend || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="week" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pct" 
                    name="Completion %"
                    stroke="#818cf8" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* ── Category Breakdown ─────────────────────────────────────────────── */}
        <motion.div variants={item} className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-txt-primary">Category Mastery</h3>
              <p className="text-xs text-txt-muted">Overall completion % by topic</p>
            </div>
          </div>
          
          <div className="h-[220px] w-full">
            {loading ? (
              <div className="w-full h-full bg-bg-elevated rounded-lg animate-pulse" />
            ) : catData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis type="category" dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.2 }}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                    formatter={(val) => [`${val}%`, 'Completed']}
                  />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={12}>
                    {catData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-txt-muted italic">
                No categories logged yet.
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Recent Notes ───────────────────────────────────────────────────── */}
        <motion.div variants={item} className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-txt-primary">Recent Notes</h3>
              <p className="text-xs text-txt-muted">Last edited documents</p>
            </div>
            <button
              onClick={() => navigate('/notes?new=true')}
              className="text-xs flex items-center gap-1 bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1.5 rounded-lg transition-colors"
            >
              <RiAddLine /> New
            </button>
          </div>
          
          <div className="space-y-2 mb-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-12 bg-bg-elevated rounded-xl animate-pulse" />)
            ) : recentNotes.length > 0 ? (
              recentNotes.map(note => (
                <Link to={`/notes?id=${note._id}`} key={note._id} className="flex items-center justify-between p-3 bg-bg-elevated hover:bg-bg-elevated-hover rounded-xl transition-colors border border-border-subtle hover:border-border-strong group">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center text-txt-secondary border border-border-subtle group-hover:text-accent transition-colors">
                      📄
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-txt-primary truncate">{note.title || 'Untitled'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">{note.category}</span>
                        <span className="text-[10px] text-txt-muted">• {formatTimeAgo(note.lastEditedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-txt-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-txt-muted bg-bg-elevated/50 rounded-xl border border-border-subtle">
                No recent notes. Start writing!
              </div>
            )}
          </div>
          
          <Link to="/notes" className="text-xs text-accent hover:text-accent-hover font-medium block text-center transition-colors">
            View all notes →
          </Link>
        </motion.div>

        {/* ── Mini Previews ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <motion.div variants={item} className="card card-hover flex-1 flex flex-col justify-center">
            <Link to="/week" className="group flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <RiCalendarEventLine className="text-accent text-lg" />
                  <h4 className="text-sm font-bold text-txt-primary group-hover:text-accent transition-colors">This Week</h4>
                </div>
                <p className="text-xs text-txt-muted">Manage your 7-day schedule</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-txt-muted group-hover:bg-accent/10 group-hover:text-accent transition-all">
                →
              </div>
            </Link>
          </motion.div>
          
          <motion.div variants={item} className="card card-hover flex-1 flex flex-col justify-center">
            <Link to="/calendar" className="group flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <RiCalendarCheckLine className="text-teal-400 text-lg" />
                  <h4 className="text-sm font-bold text-txt-primary group-hover:text-teal-400 transition-colors">This Month</h4>
                </div>
                <p className="text-xs text-txt-muted">View your consistency heatmap</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-txt-muted group-hover:bg-teal-500/10 group-hover:text-teal-400 transition-all">
                →
              </div>
            </Link>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}
