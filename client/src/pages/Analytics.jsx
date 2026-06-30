import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiBarChartBoxLine, RiPieChartLine, RiLineChartLine, RiRefreshLine,
} from 'react-icons/ri';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line,
} from 'recharts';
import { fetchDashboardStats } from '../api/tasks';
import { CATEGORIES } from '../constants/dayView';

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchDashboardStats();
      setStats(res.data);
    } catch {
      setError('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const catData = stats?.categoryBreakdown?.map(c => {
    const meta = CATEGORIES.find(cat => cat.id === c.category) || CATEGORIES[CATEGORIES.length - 1];
    return { ...c, color: meta.color, label: meta.label };
  }) || [];

  const pieData = catData.map(c => ({ name: c.label, value: c.total, fill: c.color }));

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6 pb-12">

      {/* Header */}
      <motion.div variants={item} className="card flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center text-accent" aria-hidden="true">
          <RiBarChartBoxLine className="text-2xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-txt-primary">Analytics</h2>
          <p className="text-sm text-txt-secondary">Category breakdowns, completion trends, and streak history</p>
        </div>
      </motion.div>

      {/* Error */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Category Bar Chart ────────────────────────────────────── */}
        <motion.div variants={item} className="card">
          <div className="flex items-center gap-2 mb-4">
            <RiBarChartBoxLine className="text-accent" aria-hidden="true" />
            <p className="text-sm font-semibold text-txt-primary">Category Completion %</p>
          </div>
          <div className="h-[220px]">
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
                    {catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-txt-muted italic">No data yet</div>
            )}
          </div>
        </motion.div>

        {/* ── Category Distribution Pie ────────────────────────────── */}
        <motion.div variants={item} className="card">
          <div className="flex items-center gap-2 mb-4">
            <RiPieChartLine className="text-accent-teal" aria-hidden="true" />
            <p className="text-sm font-semibold text-txt-primary">Task Distribution</p>
          </div>
          <div className="flex items-center gap-6 h-[220px]">
            {loading ? (
              <div className="w-full h-full bg-bg-elevated rounded-lg animate-pulse" />
            ) : pieData.length > 0 ? (
              <>
                <div className="w-[180px] h-[180px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                        formatter={(val, name) => [`${val} tasks`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  {catData.map(({ label, color, total, pct }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-txt-secondary truncate">{label}</span>
                      <span className="ml-auto text-txt-muted">{total} ({pct}%)</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-txt-muted italic">No data yet</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── 8-Week Trend ──────────────────────────────────────────── */}
      <motion.div variants={item} className="card">
        <div className="flex items-center gap-2 mb-4">
          <RiLineChartLine className="text-amber-400" aria-hidden="true" />
          <p className="text-sm font-semibold text-txt-primary">8-Week Completion Trend</p>
        </div>
        <div className="h-[200px]">
          {loading ? (
            <div className="w-full h-full bg-bg-elevated rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.weeklyTrend || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="week" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Line type="monotone" dataKey="pct" name="Completion %" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* ── Quick Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Current Streak',   value: loading ? '—' : `${stats?.streaks?.currentStreak || 0} d`, color: 'text-orange-400' },
          { label: 'Longest Streak',   value: loading ? '—' : `${stats?.streaks?.longestStreak || 0} d`, color: 'text-emerald-400' },
          { label: 'Today Completed',  value: loading ? '—' : `${stats?.todayProgress?.completed || 0}/${stats?.todayProgress?.total || 0}`, color: 'text-accent' },
          { label: 'Today %',          value: loading ? '—' : `${stats?.todayProgress?.pct || 0}%`, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <motion.div key={label} variants={item} className="card text-center py-4 flex flex-col justify-center">
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs text-txt-muted mt-1">{label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
