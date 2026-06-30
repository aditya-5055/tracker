import { motion } from 'framer-motion';

/**
 * Reusable placeholder shell for Step 0 pages.
 * Shows an icon, title, description, and a "Coming Soon" badge.
 */
export default function PageShell({ icon: Icon, title, description, accentClass = 'text-accent', children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-full"
    >
      {/* Page header card */}
      <div className="card flex items-start gap-5 mb-6">
        <div className={`w-14 h-14 rounded-xl2 bg-bg-elevated flex items-center justify-center flex-shrink-0 ${accentClass}`}>
          <Icon className="text-3xl" />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h2 className="text-xl font-bold text-txt-primary">{title}</h2>
          <p className="text-sm text-txt-secondary mt-1">{description}</p>
        </div>
      </div>

      {/* Placeholder grid */}
      {children || (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="card animate-pulse-slow"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="h-3 bg-bg-elevated rounded-full w-2/3 mb-3" />
              <div className="h-3 bg-bg-elevated rounded-full w-1/2 mb-2" />
              <div className="h-3 bg-bg-elevated rounded-full w-3/4" />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
