import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiCheckboxCircleLine, RiEyeLine, RiEyeOffLine, RiLockLine, RiMailLine, RiLoader4Line } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      return setError('Please enter both email and password.');
    }
    setSubmitting(true);
    setError('');
    const result = await loginWithCredentials(form.email, form.password);
    setSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-bg-surface flex">
      {/* Left: Branding panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex w-1/2 bg-bg-elevated border-r border-border-subtle
                   flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-accent/10
                        blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-accent-teal/10
                        blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-indigo flex items-center justify-center
                          mx-auto mb-6 glow-indigo">
            <RiCheckboxCircleLine className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-txt-primary mb-3">
            Consistency<br />
            <span className="text-gradient-indigo">Tracker</span>
          </h1>
          <p className="text-txt-secondary text-sm leading-relaxed">
            Your personal placement preparation command center. Track DSA, OS, DBMS,
            System Design, and more — one day at a time.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {['DSA', 'OS', 'DBMS', 'SQL', 'CNS', 'System Design', 'Interview', 'Projects'].map((t) => (
              <span key={t} className="badge bg-bg-card border border-border-default text-txt-muted text-[10px]">{t}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-indigo flex items-center justify-center">
              <RiCheckboxCircleLine className="text-white text-lg" />
            </div>
            <span className="font-bold text-txt-primary">Consistency Tracker</span>
          </div>

          <h2 className="text-2xl font-extrabold text-txt-primary mb-1">Welcome back</h2>
          <p className="text-sm text-txt-muted mb-8">Sign in to continue your streak 🔥</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-status-incomplete/10 border border-status-incomplete/30
                            text-status-incomplete text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs text-txt-muted mb-1.5 font-medium">
                Email address
              </label>
              <div className="relative">
                <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-xs text-txt-muted mb-1.5 font-medium">
                Password
              </label>
              <div className="relative">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
                <input
                  id="login-password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary"
                >
                  {showPwd ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><RiLoader4Line className="animate-spin text-base" /> Signing in…</>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-txt-muted mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-accent hover:text-accent-hover font-medium transition-colors">
              Sign up
            </Link>
          </p>


        </motion.div>
      </div>
    </div>
  );
}
