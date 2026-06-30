import { motion } from 'framer-motion';

/**
 * Animated SVG progress ring.
 * Props:
 *   pct      – 0-100
 *   size     – px diameter (default 72)
 *   stroke   – stroke width (default 6)
 *   color    – stroke color (default accent indigo)
 *   label    – center text override (default shows pct%)
 */
export default function ProgressRing({
  pct   = 0,
  size  = 72,
  stroke= 6,
  color = '#6366f1',
  label,
}) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const cx = size / 2;

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {/* Track */}
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke="#1e2235"
        strokeWidth={stroke}
      />

      {/* Animated progress arc */}
      <motion.circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ transformOrigin: `${cx}px ${cx}px`, transform: 'rotate(-90deg)' }}
      />

      {/* Center label */}
      <text
        x={cx} y={cx}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#e2e8f0"
        fontSize={size < 60 ? 11 : 14}
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        {label ?? `${pct}%`}
      </text>
    </svg>
  );
}
