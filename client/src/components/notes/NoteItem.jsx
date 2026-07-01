import { motion } from 'framer-motion';
import { RiMore2Fill, RiPushpinFill, RiPushpinLine, RiDeleteBinLine } from 'react-icons/ri';
import { useState, useRef, useEffect } from 'react';

// Format date nicely (e.g. "2 hours ago", "Yesterday", "Oct 12")
const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 172800) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const CATEGORY_COLORS = {
  'DSA': 'bg-accent/20 text-accent',
  'OS': 'bg-teal-500/20 text-teal-400',
  'DBMS': 'bg-purple-500/20 text-purple-400',
  'SQL': 'bg-blue-500/20 text-blue-400',
  'CNS': 'bg-cyan-500/20 text-cyan-400',
  'System Design': 'bg-orange-500/20 text-orange-400',
  'Interview Prep': 'bg-amber-500/20 text-amber-400',
  'Projects': 'bg-emerald-500/20 text-emerald-400',
  'General': 'bg-slate-500/20 text-slate-400'
};

const HighlightedText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) {
    return <span>{text}</span>;
  }
  // Split on highlight term and include term in array, ignore case
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-accent/30 text-accent rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export default function NoteItem({ note, isSelected, searchQuery, onClick, onDelete, onPin }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const catColor = CATEGORY_COLORS[note.category] || CATEGORY_COLORS['General'];
  const title = note.title || 'Untitled Note';

  return (
    <motion.div
      variants={itemVariants}
      onClick={onClick}
      className={`group relative p-3 mb-1 rounded-xl cursor-pointer transition-all ${
        isSelected 
          ? 'bg-bg-elevated border border-accent shadow-glow-indigo' 
          : 'bg-transparent border border-transparent hover:bg-bg-card'
      }`}
    >
      <div className="flex justify-between items-start mb-1.5 pr-6">
        <h4 className={`font-semibold text-sm truncate ${isSelected ? 'text-txt-primary' : 'text-txt-primary'}`}>
          <HighlightedText text={title} highlight={searchQuery} />
        </h4>
        
        {/* Dropdown Menu */}
        <div className="absolute right-2 top-2" ref={menuRef}>
          <button 
            onClick={handleMenuClick}
            className={`p-1 rounded-md transition-opacity ${showMenu ? 'opacity-100 bg-bg-elevated' : 'opacity-0 group-hover:opacity-100 hover:bg-bg-elevated text-txt-muted'}`}
          >
            <RiMore2Fill />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-bg-elevated border border-border-subtle rounded-lg shadow-card py-1 z-30">
              <button
                onClick={(e) => { e.stopPropagation(); onPin(); setShowMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-txt-primary hover:bg-bg-card flex items-center gap-2"
              >
                {note.isPinned ? <RiPushpinLine /> : <RiPushpinFill />}
                {note.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-status-incomplete hover:bg-bg-card flex items-center gap-2"
              >
                <RiDeleteBinLine /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-txt-muted">
        <span className={`px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${catColor}`}>
          {note.category}
        </span>
        <span>•</span>
        <span>{formatTimeAgo(note.lastEditedAt)}</span>
        <span>•</span>
        <span>{note.wordCount || 0} words</span>
      </div>
      
      {/* Show tags on the item if they exist */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {note.tags.map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-bg-elevated border border-border-subtle text-txt-secondary rounded-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
