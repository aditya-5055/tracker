/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Always dark — <html> always has class="dark"
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Backgrounds ──────────────────────────────────────────────────
        'bg-base':     '#0a0c12',   // deepest background
        'bg-surface':  '#0f1117',   // page background
        'bg-card':     '#1a1d27',   // cards / panels
        'bg-elevated': '#252836',   // sidebar, modals, dropdowns

        // ── Brand / Accent ────────────────────────────────────────────────
        'accent': {
          DEFAULT:  '#6366f1',      // electric indigo (completed, CTA)
          hover:    '#818cf8',
          muted:    '#3730a3',
          teal:     '#2dd4bf',      // secondary accent / highlights
        },

        // ── Status colors ─────────────────────────────────────────────────
        'status': {
          completed:  '#6366f1',    // indigo
          remaining:  '#f59e0b',    // amber
          incomplete: '#f43f5e',    // rose/red
          pending:    '#64748b',    // slate (future tasks)
        },

        // ── Text ──────────────────────────────────────────────────────────
        'txt': {
          primary:  '#e2e8f0',
          secondary:'#94a3b8',
          muted:    '#64748b',
          disabled: '#334155',
        },

        // ── Border ────────────────────────────────────────────────────────
        'border-subtle': '#1e2235',
        'border-default':'#2d3348',
        'border-strong': '#404663',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-indigo': '0 0 20px rgba(99,102,241,0.35)',
        'glow-teal':   '0 0 20px rgba(45,212,191,0.30)',
        'glow-amber':  '0 0 20px rgba(245,158,11,0.30)',
        'card':        '0 4px 24px rgba(0,0,0,0.45)',
      },
      backgroundImage: {
        'gradient-indigo': 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
        'gradient-teal':   'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)',
        'gradient-dark':   'linear-gradient(180deg, #1a1d27 0%, #0f1117 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-in-left': 'slideInLeft 0.3s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(99,102,241,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(99,102,241,0.7)' },
        },
      },
      borderRadius: {
        xl2: '1rem',
        xl3: '1.5rem',
      },
    },
  },
  plugins: [],
}
