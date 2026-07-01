import { useState } from 'react';
import { motion } from 'framer-motion';
import { RiCheckLine, RiCloseLine, RiTimeLine, RiLoader4Line } from 'react-icons/ri';
import { updateTask } from '../../api/tasks';
import { createNote } from '../../api/notes';
import { getCat } from '../../constants/dayView';
import { useNavigate } from 'react-router-dom';

const STATUS_ACTIONS = [
  {
    status: 'completed',
    icon:   RiCheckLine,
    label:  'Done',
    cls:    'bg-teal-500/15 border-teal-500/40 text-teal-400 hover:bg-teal-500/25',
  },
  {
    status: 'incomplete',
    icon:   RiCloseLine,
    label:  'Incomplete',
    cls:    'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25',
  },
  {
    status: 'remaining',
    icon:   RiTimeLine,
    label:  'Carry Over',
    cls:    'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25',
  },
];

export default function TaskEditPopover({ task, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const cat = getCat(task.category);

  const handleStatus = async (newStatus) => {
    if (task.status === newStatus) return;
    setUpdating(true);
    try {
      const res = await updateTask(task._id, { status: newStatus });
      onUpdate(res.data.task);
      onClose();
    } catch (err) {
      console.error('Failed to update task', err);
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    try {
      const res = await createNote({ title: task.title, category: task.category });
      if (res.success) {
        navigate(`/notes?id=${res.note._id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative z-10 w-full max-w-sm bg-bg-card border border-border-default
                   rounded-2xl shadow-2xl p-5"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{ scale: 0.95,    opacity: 0, y: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
          <p className="text-sm font-bold text-txt-primary truncate">
            {task.title}
          </p>
        </div>

        <p className="text-xs text-txt-muted mb-4">
          {task.date} • {task.startTime} - {task.endTime}
        </p>

        <div className="grid grid-cols-3 gap-2">
          {STATUS_ACTIONS.map(({ status, icon: Icon, label, cls }) => (
            <button
              key={status}
              disabled={updating}
              onClick={() => handleStatus(status)}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl
                           text-xs font-semibold border transition-all duration-150
                           disabled:opacity-50 ${cls} ${task.status === status ? 'ring-2 ring-white/20' : ''}`}
            >
              {updating ? (
                <RiLoader4Line className="animate-spin text-lg" />
              ) : (
                <><Icon className="text-lg" />{label}</>
              )}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleAddNote}
          className="mt-4 w-full py-2.5 rounded-xl border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
        >
          📄 Add Note
        </button>
        
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-txt-muted hover:text-txt-primary transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}
