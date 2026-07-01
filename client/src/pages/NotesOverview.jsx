import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchNotesStats } from '../api/notes';
import { CATEGORIES } from '../constants/dayView';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function NotesOverview() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetchNotesStats();
        if (res.success) setStats(res.stats);
      } catch (err) {
        console.error('Failed to load note stats');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const getCatStat = (catId) => stats.find(s => s._id === catId);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-txt-primary">Subject Overview</h2>
          <p className="text-sm text-txt-muted mt-1">Your structured study vault</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.filter(c => c.id !== 'General').map((cat) => {
          const catStat = getCatStat(cat.id);
          const count = catStat?.count || 0;
          const words = catStat?.totalWords || 0;
          const lastUpdated = catStat?.lastUpdated ? new Date(catStat.lastUpdated).toLocaleDateString() : 'Never';

          return (
            <motion.div 
              variants={itemVariants}
              key={cat.id} 
              className="relative p-5 rounded-2xl bg-bg-elevated/40 backdrop-blur-md border border-border-subtle shadow-card flex flex-col justify-between overflow-hidden"
            >
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ backgroundColor: cat.color }} 
              />
              
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border" style={{ backgroundColor: `${cat.color}20`, color: cat.color, borderColor: `${cat.color}40` }}>
                    {cat.label[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-txt-primary">{cat.label}</h3>
                    <p className="text-[10px] text-txt-muted tracking-wide uppercase">{count} notes</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-txt-muted">Total Words</span>
                    <span className="font-semibold text-txt-primary">{words.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-txt-muted">Last Updated</span>
                    <span className="font-semibold text-txt-primary">{lastUpdated}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/notes?category=${cat.id}`)}
                className="w-full py-2 rounded-lg text-xs font-semibold border transition-all"
                style={{ borderColor: `${cat.color}30`, color: cat.color, backgroundColor: `${cat.color}10` }}
              >
                View Notes
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
