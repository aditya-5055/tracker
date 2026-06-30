import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { RiRefreshLine, RiCheckLine, RiLoader4Line, RiFireLine, RiHeartPulseLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import PageShell from '../components/layout/PageShell';

const MOTIVATION_QUOTES = [
  "Consistency over intensity. One step every day builds an empire.",
  "The cost of procrastination is the life you could have lived.",
  "Don't trade what you want most for what you want right now.",
  "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
  "Discipline equals freedom. Own your schedule.",
  "Your future self is watching you right now through memories. Make them proud."
];

export default function Motivation() {
  const { user, updateUser } = useAuth();
  const [goal, setGoal] = useState(user?.personalGoal || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [showComparison, setShowComparison] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(Math.floor(Math.random() * MOTIVATION_QUOTES.length));

  const handleSaveGoal = async () => {
    if (goal.trim() === user?.personalGoal) return;
    
    setSaving(true);
    const { success } = await updateUser({ personalGoal: goal.trim() });
    setSaving(false);
    
    if (success) {
      setSaved(true);
      toast.success('Personal goal saved');
      setTimeout(() => setSaved(false), 2000);
    } else {
      toast.error('Failed to save goal');
    }
  };

  const nextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length);
  };

  return (
    <PageShell
      icon={RiFireLine}
      title="Motivation"
      description="Fuel your consistency and remember your why."
      accentClass="text-orange-500"
    >
      <div className="space-y-6 pb-12">
        
        {/* ── Hero Banner ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl shadow-glow-indigo min-h-[200px] flex items-center justify-center"
        >
          {/* Abstract CSS Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-bg-card opacity-90" />
          
          {/* SVG Abstract Mountains/Waves overlay */}
          <svg className="absolute bottom-0 left-0 w-full h-auto text-white/5 pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="currentColor" d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,213.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>

          <div className="relative z-10 px-6 py-10 md:px-12 text-center max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.h2
                key={quoteIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-2xl md:text-3xl font-extrabold text-white leading-snug italic"
              >
                "{MOTIVATION_QUOTES[quoteIndex]}"
              </motion.h2>
            </AnimatePresence>
            <button
              onClick={nextQuote}
              className="mt-6 flex items-center gap-2 mx-auto px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all border border-white/10"
            >
              <RiRefreshLine /> New Quote
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ── Remember Your Why ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <RiHeartPulseLine className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-txt-primary">Remember Your Why</h3>
                <p className="text-xs text-txt-muted">What are you working towards?</p>
              </div>
            </div>

            <p className="text-sm text-txt-secondary mb-4 leading-relaxed">
              Motivation fades, but purpose persists. Write down the core reason you're putting in the work. We'll show this on your dashboard to keep you anchored.
            </p>

            <div className="flex-1 flex flex-col">
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. I'm building toward financial independence and a career I'm proud of."
                className="input-field min-h-[120px] resize-none flex-1 mb-4"
                maxLength={300}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-txt-muted">{goal.length}/300</span>
                <button
                  onClick={handleSaveGoal}
                  disabled={saving || goal.trim() === user?.personalGoal}
                  className="btn-primary flex items-center gap-2 min-w-[100px] justify-center"
                >
                  {saving ? (
                    <RiLoader4Line className="animate-spin" />
                  ) : saved ? (
                    <><RiCheckLine /> Saved</>
                  ) : (
                    'Save Why'
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Comparison Reset ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card flex flex-col justify-center items-center text-center h-full min-h-[300px]"
          >
            <AnimatePresence mode="wait">
              {!showComparison ? (
                <motion.div
                  key="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="max-w-xs mx-auto"
                >
                  <div className="w-16 h-16 mx-auto bg-bg-elevated rounded-full flex items-center justify-center text-3xl mb-4 border border-border-default shadow-glow-indigo">
                    🌧️
                  </div>
                  <h3 className="text-lg font-bold text-txt-primary mb-2">Feeling Discouraged?</h3>
                  <p className="text-sm text-txt-secondary mb-6">
                    Looking at others' successes and feeling behind? Take a breath.
                  </p>
                  <button
                    onClick={() => setShowComparison(true)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border-default hover:border-accent text-txt-primary font-semibold transition-all hover:shadow-glow-indigo group"
                  >
                    Reset my perspective <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">→</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="message"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-sm mx-auto"
                >
                  <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center text-3xl mb-4 border border-emerald-500/20 shadow-glow-indigo">
                    🌱
                  </div>
                  <h3 className="text-xl font-bold text-txt-primary mb-3">Your path is your own</h3>
                  <p className="text-sm text-txt-secondary leading-relaxed mb-6">
                    Comparison is the thief of joy. The only person you should try to be better than is the person you were yesterday. Focus on your own streaks.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <a href="/dashboard" className="btn-primary">View My Streaks</a>
                    <button onClick={() => setShowComparison(false)} className="btn-ghost">Close</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </PageShell>
  );
}
