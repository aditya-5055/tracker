import { motion } from 'framer-motion';
import { RiSearchLine, RiAddLine } from 'react-icons/ri';
import { FileQuestion, FolderSearch, SearchX } from 'lucide-react';
import NoteItem from './NoteItem';

const CATEGORIES = [
  'All', 'DSA', 'OS', 'DBMS', 'SQL', 'CNS',
  'System Design', 'Interview Prep', 'Projects', 'General'
];

export default function NotesSidebar({
  notes,
  isLoading,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  tagsFilter,
  setTagsFilter,
  availableTags,
  sortOption,
  setSortOption,
  onCreateNote,
  onSelectNote,
  selectedNoteId,
  onDeleteNote,
  onPinNote
}) {
  const pinnedNotes = notes.filter(n => n.isPinned);
  const unpinnedNotes = notes.filter(n => !n.isPinned);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const toggleTag = (tag) => {
    if (tagsFilter.includes(tag)) {
      setTagsFilter(tagsFilter.filter(t => t !== tag));
    } else {
      setTagsFilter([...tagsFilter, tag]);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg-surface">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle shrink-0">
        <button
          onClick={onCreateNote}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white py-2.5 rounded-xl font-medium transition-colors shadow-glow-indigo mb-4"
        >
          <RiAddLine className="text-xl" />
          <span>New Note</span>
        </button>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-lg" />
            <input
              id="notes-search-input"
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-card border border-border-subtle rounded-xl py-2 pl-10 pr-4 text-sm text-txt-primary placeholder-txt-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
          </div>
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-bg-card border border-border-subtle rounded-xl px-2 py-2 text-xs text-txt-primary focus:outline-none focus:border-accent"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">Title A-Z</option>
            <option value="za">Title Z-A</option>
            <option value="words">Word count</option>
          </select>
        </div>
      </div>

      {/* Filters Area (Scrollable horizontal) */}
      <div className="shrink-0 border-b border-border-subtle bg-bg-surface z-10">
        {/* Categories */}
        <div className="px-3 py-2 overflow-x-auto no-scrollbar flex gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === cat 
                  ? 'bg-accent text-white' 
                  : 'bg-bg-card text-txt-secondary hover:text-txt-primary border border-border-subtle'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* Tags Row */}
        {availableTags && availableTags.length > 0 && (
          <div className="px-3 py-2 pt-0 overflow-x-auto no-scrollbar flex gap-1.5">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`whitespace-nowrap px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  tagsFilter.includes(tag)
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'bg-bg-elevated text-txt-muted hover:text-txt-primary border border-transparent'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="p-2 flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-[88px] bg-bg-card rounded-xl animate-pulse border border-border-subtle/50" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="p-8 text-center text-sm text-txt-muted flex flex-col items-center justify-center h-full opacity-60">
            {searchQuery ? (
              <>
                <SearchX size={48} className="mb-4 text-border-strong" />
                <p>No notes match '{searchQuery}'.</p>
                <p className="text-xs mt-1">Try different keywords.</p>
              </>
            ) : categoryFilter !== 'All' ? (
              <>
                <FolderSearch size={48} className="mb-4 text-border-strong" />
                <p>No notes in {categoryFilter} yet.</p>
              </>
            ) : (
              <>
                <FileQuestion size={48} className="mb-4 text-border-strong" />
                <p>No notes yet.</p>
                <p className="text-xs mt-1">Hit 'New Note' to start.</p>
              </>
            )}
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-1">
            {pinnedNotes.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-txt-muted uppercase tracking-widest px-2 mb-2 flex items-center gap-1">
                  <span>📌 Pinned</span>
                </p>
                {pinnedNotes.map(note => (
                  <NoteItem 
                    key={note._id} 
                    note={note} 
                    isSelected={selectedNoteId === note._id}
                    searchQuery={searchQuery}
                    onClick={() => onSelectNote(note._id)}
                    onDelete={() => onDeleteNote(note._id)}
                    onPin={() => onPinNote(note._id, note.isPinned)}
                  />
                ))}
              </div>
            )}
            
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                   <p className="text-[10px] font-semibold text-txt-muted uppercase tracking-widest px-2 mb-2">
                     All Notes
                   </p>
                )}
                {unpinnedNotes.map(note => (
                  <NoteItem 
                    key={note._id} 
                    note={note} 
                    isSelected={selectedNoteId === note._id}
                    searchQuery={searchQuery}
                    onClick={() => onSelectNote(note._id)}
                    onDelete={() => onDeleteNote(note._id)}
                    onPin={() => onPinNote(note._id, note.isPinned)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
