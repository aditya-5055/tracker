import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RiCheckboxCircleLine, RiEyeLine, RiEyeOffLine,
  RiLockLine, RiMailLine, RiUserLine, RiLoader4Line,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return setError('All fields are required.');
    }
    if (form.password !== form.confirm) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    setSubmitting(true);
    setError('');
    const result = await signup(form.name, form.email, form.password);
    setSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-bg-surface flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-indigo flex items-center justify-center glow-indigo">
            <RiCheckboxCircleLine className="text-white text-xl" />
          </div>
          <div>
            <p className="font-bold text-txt-primary leading-tight text-sm">Consistency Tracker</p>
            <p className="text-[10px] text-txt-muted">Start your journey today</p>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-txt-primary mb-1">Create account</h2>
        <p className="text-sm text-txt-muted mb-8">Set up your placement tracker in seconds ⚡</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-status-incomplete/10 border border-status-incomplete/30
                          text-status-incomplete text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <div>
            <label htmlFor="signup-name" className="block text-xs text-txt-muted mb-1.5 font-medium">
              Full name
            </label>
            <div className="relative">
              <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
              <input
                id="signup-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="signup-email" className="block text-xs text-txt-muted mb-1.5 font-medium">
              Email address
            </label>
            <div className="relative">
              <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
              <input
                id="signup-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="signup-password" className="block text-xs text-txt-muted mb-1.5 font-medium">
              Password
            </label>
            <div className="relative">
              <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
              <input
                id="signup-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
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

          {/* Confirm password */}
          <div>
            <label htmlFor="signup-confirm" className="block text-xs text-txt-muted mb-1.5 font-medium">
              Confirm password
            </label>
            <div className="relative">
              <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
              <input
                id="signup-confirm"
                name="confirm"
                type={showPwd ? 'text' : 'password'}
                value={form.confirm}
                onChange={handleChange}
                placeholder="Repeat password"
                className="input-field pl-10"
              />
            </div>
          </div>

          <button
            id="signup-submit-btn"
            type="submit"
            disabled={submitting}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><RiLoader4Line className="animate-spin text-base" /> Creating account…</>
            ) : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-txt-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
