import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import NotesSidebar from '../components/notes/NotesSidebar';
import NoteEditor from '../components/notes/NoteEditor';
import { fetchNotes, createNote, deleteNote, updateNote, exportNote, fetchTags } from '../api/notes';

export default function NotesView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const isDragging = useRef(false);
  const [notes, setNotes] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [tagsFilter, setTagsFilter] = useState([]);
  const [sortOption, setSortOption] = useState('newest');
  
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // For mobile drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (tagsFilter.length > 0) params.tags = tagsFilter.join(',');
      if (sortOption) params.sort = sortOption;

      const res = await fetchNotes(params);
      if (res.success) setNotes(res.notes);
    } catch (err) {
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter, tagsFilter, sortOption]);

  const loadTags = useCallback(async () => {
    try {
      const res = await fetchTags();
      if (res.success) setAvailableTags(res.tags);
    } catch (err) {
      console.error('Failed to load tags');
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  useEffect(() => {
    const delay = setTimeout(() => {
      loadNotes();
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery, categoryFilter, tagsFilter, sortOption, loadNotes]);

  // Initial load from URL params
  useEffect(() => {
    const catParam = searchParams.get('category');
    const idParam = searchParams.get('id');
    const newParam = searchParams.get('new');

    if (catParam) {
      setCategoryFilter(catParam);
      searchParams.delete('category');
      setSearchParams(searchParams, { replace: true });
    }
    
    if (idParam) {
      setSelectedNoteId(idParam);
      setIsSidebarOpen(false);
      searchParams.delete('id');
      setSearchParams(searchParams, { replace: true });
    }

    if (newParam === 'true') {
      handleCreateNote();
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleCreateNote();
      } else if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('notes-search-input')?.focus();
      } else if (e.key === 'Escape') {
        setSearchQuery('');
        setCategoryFilter('All');
        setTagsFilter([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateNote = async () => {
    try {
      const res = await createNote({ title: 'Untitled Note', category: 'General' });
      if (res.success) {
        setNotes((prev) => [res.note, ...prev]);
        setSelectedNoteId(res.note._id);
        setIsSidebarOpen(false); // On mobile, close sidebar to show editor
        toast.success('Note created');
      }
    } catch (err) {
      toast.error('Failed to create note');
    }
  };

  const handleSelectNote = (id) => {
    setSelectedNoteId(id);
    setIsSidebarOpen(false);
  };

  const handleDeleteNote = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteNote(deleteConfirmId);
      setNotes((prev) => prev.filter(n => n._id !== deleteConfirmId));
      if (selectedNoteId === deleteConfirmId) {
        setSelectedNoteId(null);
        setIsSidebarOpen(true);
      }
      toast.success('Note deleted');
    } catch (err) {
      toast.error('Failed to delete note');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handlePinNote = async (id, isPinned) => {
    try {
      const res = await updateNote(id, { isPinned: !isPinned });
      if (res.success) {
        setNotes((prev) => prev.map(n => n._id === id ? res.note : n));
      }
    } catch (err) {
      toast.error('Failed to update pin status');
    }
  };

  const handleUpdateNote = async (id, data) => {
    try {
      const res = await updateNote(id, data);
      if (res.success) {
        setNotes((prev) => prev.map(n => n._id === id ? res.note : n));
        if (data.tags) loadTags(); // Refresh tags if they changed
        return res.note;
      }
    } catch (err) {
      toast.error('Failed to save note');
      throw err;
    }
  };

  const handleExport = async (id) => {
    try {
      const res = await exportNote(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const note = notes.find(n => n._id === id);
      link.setAttribute('download', `${(note?.title || 'note').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const selectedNote = notes.find(n => n._id === selectedNoteId);

  // Resize Handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    
    const handleMouseMove = (moveEvent) => {
      if (!isDragging.current) return;
      let newWidth = moveEvent.clientX;
      if (newWidth < 280) newWidth = 280;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="h-[calc(100dvh-4rem)] md:h-screen flex overflow-hidden bg-bg-base relative">
      {/* Sidebar Panel */}
      <div 
        style={{ width: window.innerWidth < 768 ? '100%' : sidebarWidth }}
        className={`absolute md:static top-0 left-0 h-full bg-bg-surface z-20 transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <NotesSidebar 
          notes={notes}
          isLoading={isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          tagsFilter={tagsFilter}
          setTagsFilter={setTagsFilter}
          availableTags={availableTags}
          sortOption={sortOption}
          setSortOption={setSortOption}
          onCreateNote={handleCreateNote}
          onSelectNote={handleSelectNote}
          selectedNoteId={selectedNoteId}
          onDeleteNote={handleDeleteNote}
          onPinNote={handlePinNote}
        />
      </div>

      {/* Resize Handle (Desktop Only) */}
      <div 
        className="hidden md:flex w-1 bg-border-subtle hover:bg-accent hover:cursor-col-resize z-30 flex-shrink-0 transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* Editor Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg-base relative z-10 h-full">
        {selectedNoteId && selectedNote ? (
          <NoteEditor 
            note={selectedNote} 
            onUpdate={handleUpdateNote} 
            onExport={() => handleExport(selectedNoteId)}
            onBack={() => setIsSidebarOpen(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 hidden md:flex">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-bg-elevated flex items-center justify-center shadow-inner border border-border-subtle text-2xl">
              📄
            </div>
            <h3 className="text-xl font-semibold text-txt-primary mb-2">Select a note or create a new one</h3>
            <p className="text-txt-muted mb-6">Capture your thoughts and organize them by category.</p>
            <button 
              onClick={handleCreateNote}
              className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors shadow-glow-indigo"
            >
              New Note
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-bg-card border border-border-default rounded-2xl shadow-2xl p-6 w-full max-w-sm z-[60]">
            <h3 className="text-lg font-bold text-txt-primary mb-2">Delete Note</h3>
            <p className="text-sm text-txt-secondary mb-6">
              Delete this note? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-txt-secondary hover:text-txt-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20 rounded-lg transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
