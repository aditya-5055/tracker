import { motion } from 'framer-motion';
import { RiCheckLine, RiCloseLine, RiTimeLine } from 'react-icons/ri';
import { getCat, STATUS_META } from '../../constants/dayView';

const STATUS_ICONS = {
  completed:  RiCheckLine,
  incomplete: RiCloseLine,
  remaining:  RiTimeLine,
};

export default function WeekTaskCard({ task, onClick }) {
  const cat     = getCat(task.category);
  const statusM = STATUS_META[task.status];
  const Icon    = STATUS_ICONS[task.status];

  // Base style depends on status
  const bgCls = {
    pending:   'bg-bg-elevated hover:bg-bg-elevated/80',
    completed: 'bg-teal-950/30',
    incomplete:'bg-rose-950/20',
    remaining: 'bg-amber-950/20',
  }[task.status];

  const borderColor = task.status === 'pending' ? `${cat.color}40` : `${statusM.color}40`;

  return (
    <motion.div
      layoutId={`task-${task._id}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(task)}
      className={`relative w-full p-2 text-left rounded-lg border cursor-pointer
                  transition-all duration-150 flex flex-col gap-1 ${bgCls}`}
      style={{ borderColor }}
    >
      <div className="flex items-start justify-between gap-1">
        <p className={`text-xs font-semibold leading-tight line-clamp-2 min-h-0 break-words flex-1
                       ${task.status === 'completed' ? 'line-through text-txt-muted' : 'text-txt-primary'}`}>
          {task.title}
        </p>
        
        {Icon && (
          <Icon className={`text-[10px] flex-shrink-0 mt-0.5 ${statusM.twText}`} />
        )}
      </div>

      <div className="flex items-center gap-1 mt-auto pt-1">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: cat.color }}
        />
        <span className="text-[9px] text-txt-muted font-mono leading-none">
          {task.startTime}
        </span>
      </div>
    </motion.div>
  );
}
