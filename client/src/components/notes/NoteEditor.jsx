import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { 
  RiArrowLeftLine, RiDownloadCloud2Line, RiCheckLine, RiLoader4Line, RiErrorWarningLine, RiCloseLine, RiFilePdfLine
} from 'react-icons/ri';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Link2, Image as ImageIcon, Table as TableIcon,
  Code2, Highlighter, Minus, Undo2, Redo2, Palette, FileText, Copy,
  Maximize2, Minimize2, BookOpen, ChevronRight, ChevronsDownUp, ChevronsUpDown, LayoutTemplate, ListTree, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// TipTap Core & Extensions
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CustomHeading } from './extensions/CustomHeading';
import Details from '@tiptap/extension-details';
import DetailsSummary from '@tiptap/extension-details-summary';
import DetailsContent from '@tiptap/extension-details-content';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Underline } from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import { uploadImage } from '../../api/notes';
import api from '../../api';

const lowlight = createLowlight(all);

const CATEGORIES = [
  'DSA', 'OS', 'DBMS', 'SQL', 'CNS',
  'System Design', 'Interview Prep', 'Projects', 'General'
];

import DocumentTabs from './DocumentTabs';
import AIAssistantPanel from './AIAssistantPanel';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../context/AuthContext';

export default function NoteEditor({ note, onUpdate, onExport, onBack }) {
  const { user } = useAuth();
  
  const [title, setTitle] = useState(note.title);
  const [category, setCategory] = useState(note.category);
  const [tags, setTags] = useState(note.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');

  // ── Tabs State ────────────────────────────────────────────────────────────
  const [tabs, setTabsState] = useState(() => {
    if (note.tabs && note.tabs.length > 0) return note.tabs;
    return [{
      id: uuidv4(),
      title: 'Main',
      content: note.content || '',
      parentId: null,
      order: 0
    }];
  });
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Debounce helpers
  const saveTimeout = useRef(null);
  const mouseMoveTimer = useRef(null);
  // Ref to hold latest active tab id for editor update callback
  const activeTabIdRef = useRef(activeTabId);
  useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);

  const triggerSave = useCallback(async (updates) => {
    setSaveStatus('saving');
    try {
      await onUpdate(note._id, updates);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  }, [note._id, onUpdate]);

  const debouncedSave = useCallback((updates) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaveStatus('saving');
    saveTimeout.current = setTimeout(() => {
      triggerSave(updates);
    }, 2000);
  }, [triggerSave]);

  const setTabs = (newTabs) => {
    setTabsState(newTabs);
    debouncedSave({ tabs: newTabs });
  };

  // Setup TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: false, link: false, underline: false }),
      CustomHeading, Details.configure({ HTMLAttributes: { class: 'details' } }),
      DetailsSummary, DetailsContent, Underline, TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }), Link.configure({ openOnClick: true, autolink: true }),
      Image.configure({ inline: true }), Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
      CodeBlockLowlight.configure({ lowlight }), Placeholder.configure({ placeholder: 'Start writing your notes here...' }),
    ],
    content: activeTab.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setTabsState(prev => {
        const next = prev.map(t => t.id === activeTabIdRef.current ? { ...t, content: html } : t);
        debouncedSave({ tabs: next });
        return next;
      });
    },
  });

  // Switch tab content in editor when activeTabId changes
  useEffect(() => {
    if (editor && activeTab && editor.getHTML() !== activeTab.content) {
      editor.commands.setContent(activeTab.content || '', false); // false = don't emit update event
    }
  }, [activeTabId, editor]); // intentionally exclude activeTab.content so it doesn't reset cursor while typing

  // Re-sync when switching entirely different notes
  useEffect(() => {
    setTitle(note.title);
    setCategory(note.category);
    setTags(note.tags || []);
    
    const newTabs = (note.tabs && note.tabs.length > 0) ? note.tabs : [{
      id: uuidv4(),
      title: 'Main',
      content: note.content || '',
      parentId: null,
      order: 0
    }];
    setTabsState(newTabs);
    setActiveTabId(newTabs[0]?.id);
    
    setSaveStatus('saved');
    setIsReadingMode(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note._id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  // Full screen keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.shiftKey && e.key === 'F') || e.key === 'F11') {
        e.preventDefault();
        setIsFullScreen(prev => !prev);
      } else if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAIOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Auto-hide toolbar in full screen after 2s of mouse inactivity
  useEffect(() => {
    if (!isFullScreen) {
      setShowUI(true);
      if (mouseMoveTimer.current) clearTimeout(mouseMoveTimer.current);
      return;
    }
    const handleMouseMove = () => {
      setShowUI(true);
      if (mouseMoveTimer.current) clearTimeout(mouseMoveTimer.current);
      mouseMoveTimer.current = setTimeout(() => setShowUI(false), 2500);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseMoveTimer.current) clearTimeout(mouseMoveTimer.current);
    };
  }, [isFullScreen]);

  // Sync Reading Mode with TipTap
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadingMode);
    }
  }, [isReadingMode, editor]);

  // Anchor link: copy heading link on click
  useEffect(() => {
    const handleHeadingClick = (e) => {
      const heading = e.target.closest('h1[data-anchor], h2[data-anchor], h3[data-anchor]');
      if (!heading) return;
      const id = heading.getAttribute('data-anchor');
      if (!id) return;
      const url = `${window.location.href.split('#')[0]}#${id}`;
      navigator.clipboard.writeText(url).then(() => {
        toast.success('🔗 Link copied — share this section directly');
      });
    };
    const editorEl = document.querySelector('.ProseMirror');
    if (editorEl) {
      editorEl.addEventListener('click', handleHeadingClick);
      return () => editorEl.removeEventListener('click', handleHeadingClick);
    }
  }, [editor]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSave({ title: newTitle });
  };

  const handleCategoryChange = (e) => {
    const newCat = e.target.value;
    setCategory(newCat);
    triggerSave({ category: newCat });
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !tags.includes(val)) {
        const newTags = [...tags, val];
        setTags(newTags);
        triggerSave({ tags: newTags });
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      triggerSave({ tags: newTags });
    }
  };

  const removeTag = (tagToRemove) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    setTags(newTags);
    triggerSave({ tags: newTags });
  };

  if (!editor) return null;

  // The actual editor content — same for both normal and full screen
  const editorContent = (
    <div className={`flex flex-col h-full bg-bg-base ${isFullScreen ? 'bg-[#1a1b26]' : ''}`}>
      
      {/* Top Bar */}
      <motion.div
        animate={{ opacity: (isFullScreen && !showUI) ? 0 : 1, y: (isFullScreen && !showUI) ? -56 : 0 }}
        transition={{ duration: 0.25 }}
        className={`flex items-center justify-between px-4 py-2.5 border-b border-border-subtle shrink-0 ${
          isFullScreen 
            ? 'bg-[#1a1b26]/95 backdrop-blur-md shadow-lg border-white/5' 
            : 'bg-bg-base'
        }`}
      >
        {/* Left: Back + Category + Tags */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Back button - always visible */}
          <button 
            onClick={() => { setIsFullScreen(false); onBack(); }}
            title="Go back"
            className="p-2 bg-bg-card rounded-lg text-txt-muted hover:text-txt-primary transition-colors shrink-0"
          >
            <RiArrowLeftLine />
          </button>
          
          <select 
            value={category}
            onChange={handleCategoryChange}
            className="bg-bg-elevated border border-border-subtle text-xs text-txt-primary rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent font-medium shrink-0"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Tags */}
          <div className="hidden lg:flex items-center gap-1.5 flex-wrap min-w-0">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-bg-card border border-border-subtle rounded-md text-[10px] text-txt-secondary">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors"><RiCloseLine /></button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="+ tag"
              className="bg-transparent text-[10px] text-txt-primary placeholder-txt-muted focus:outline-none w-14"
            />
          </div>
        </div>

        {/* Right: Save Status + Mode toggles + Export */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Save Status */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {saveStatus === 'saving' && <><RiLoader4Line className="animate-spin text-accent" /><span className="text-txt-muted hidden sm:inline">Saving...</span></>}
            {saveStatus === 'saved' && <><RiCheckLine className="text-status-completed" /><span className="text-txt-muted hidden sm:inline">Saved</span></>}
            {saveStatus === 'error' && (
              <button onClick={() => triggerSave({ title, content: editor.getHTML(), tags, category })} className="flex items-center gap-1 text-red-400 hover:opacity-80">
                <RiErrorWarningLine /><span className="hidden sm:inline">Retry</span>
              </button>
            )}
          </div>

          {/* Mode Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsReadingMode(!isReadingMode)}
              title="Reading Mode (focus, no toolbar)"
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${isReadingMode ? 'bg-accent/20 text-accent ring-1 ring-accent/30' : 'text-txt-muted hover:text-txt-primary hover:bg-bg-card'}`}
            >
              <BookOpen size={15} />
            </button>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Full Screen (Ctrl+Shift+F)'}
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${isFullScreen ? 'bg-accent/20 text-accent ring-1 ring-accent/30' : 'text-txt-muted hover:text-txt-primary hover:bg-bg-card'}`}
            >
              {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>

          <ExportDropdown editor={editor} title={title} onExportHTML={onExport} noteId={note._id} />
        </div>
      </motion.div>

      {/* Toolbar */}
      <AnimatePresence>
        {!isReadingMode && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: (isFullScreen && !showUI) ? 0 : 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={isFullScreen ? 'bg-[#1a1b26]/95 backdrop-blur-md border-b border-white/5' : ''}
          >
            <Toolbar editor={editor} isAIOpen={isAIOpen} onToggleAI={() => setIsAIOpen(!isAIOpen)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Body: Sidebars + Editor */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebars Container */}
        {!isReadingMode && (
          <div className="w-64 flex-shrink-0 bg-bg-surface border-r border-border-subtle h-full flex flex-col hidden lg:flex">
            {/* Tabs Sidebar */}
            <div className="flex-1 flex flex-col">
              <DocumentTabs 
                tabs={tabs} 
                setTabs={setTabs} 
                activeTabId={activeTabId} 
                setActiveTabId={setActiveTabId} 
              />
            </div>
          </div>
        )}

        {/* Editor Scroll Area */}
        <div className="flex-1 overflow-y-auto editor-scroll-container">
          {/* Google Docs style white page container */}
          <div className={`min-h-full ${
            isFullScreen 
              ? 'bg-[#1a1b26] py-12 px-4 flex justify-center' 
              : 'bg-bg-surface py-8 px-6 md:px-12'
          }`}>
            <div className={`w-full ${
              isFullScreen 
                ? 'max-w-[820px] bg-white dark:bg-[#1e1f2e] rounded-lg shadow-2xl shadow-black/40 px-16 py-14 min-h-[1100px]' 
                : 'max-w-4xl mx-auto'
            }`}>
              
              {/* Reading Mode Banner */}
              {isReadingMode && (
                <div 
                  onClick={() => setIsReadingMode(false)}
                  className="mb-8 cursor-pointer flex items-center justify-center gap-2 py-2 px-4 bg-accent/10 text-accent border border-accent/20 rounded-xl hover:bg-accent/20 transition-colors"
                >
                  <BookOpen size={15} />
                  <span className="text-sm font-medium">Reading Mode — Click to Edit</span>
                </div>
              )}

              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    editor.commands.focus();
                  }
                }}
                placeholder="Untitled Note"
                disabled={isReadingMode}
                className={`w-full bg-transparent font-extrabold text-txt-primary placeholder-border-strong focus:outline-none mb-8 border-b border-transparent focus:border-border-subtle pb-2 transition-colors disabled:opacity-90 ${
                  isFullScreen ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'
                }`}
              />
              
              {/* TipTap Editor */}
              <div className={isReadingMode ? 'reading-mode' : ''}>
                <EditorContent editor={editor} className="min-h-[500px] text-txt-secondary" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant Panel */}
        <AIAssistantPanel
          isOpen={isAIOpen}
          onClose={() => setIsAIOpen(false)}
          editor={editor}
          noteTitle={title}
          noteCategory={category}
          userAiConfig={user?.aiConfig}
          onInsertHtml={() => {
            toast.success('Inserted into note');
            debouncedSave({ content: editor.getHTML(), tabs }); // Ensure auto-save fires
          }}
        />

      </div>

      {/* Footer: Word Count — only in normal mode */}
      {!isFullScreen && (
        <div className="px-6 py-2 border-t border-border-subtle bg-bg-base flex items-center justify-between text-[10px] text-txt-muted shrink-0">
          <div>
            <span>{editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0} words</span>
          </div>
          <div>
            <span>{Math.ceil((editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0) / 200) || 1} min read</span>
          </div>
        </div>
      )}
    </div>
  );

  // In full screen, render via a React Portal at <body> level to escape all parent z-index / overflow constraints
  if (isFullScreen) {
    return (
      <>
        {/* Keep the placeholder in normal layout */}
        <div className="flex-1 h-full" />
        {createPortal(
          <motion.div
            key="fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
          >
            {editorContent}
          </motion.div>,
          document.body
        )}
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-bg-base relative"
    >
      {editorContent}
    </motion.div>
  );
}

// ─── Export Dropdown Component ────────────────────────────────────────────────
function ExportDropdown({ editor, title, onExportHTML, noteId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const response = await api.post(`/notes/${noteId}/export/pdf`, {}, {
        responseType: 'blob',
        timeout: 60000, // 60 second timeout — Puppeteer can take time
      });
      // Check if the response is actually an error JSON blob
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Export failed');
      }
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(title || 'note').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded ✓');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('PDF export failed — please try again');
    } finally {
      setIsExportingPDF(false);
      setIsOpen(false);
    }
  };

  const handleExportText = () => {
    const html = editor.getHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const textContent = doc.body.textContent || '';
    const finalContent = `${title || 'Untitled Note'}\n\n${textContent}`;
    
    const blob = new Blob([finalContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(title || 'note').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleCopyText = async () => {
    const html = editor.getHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const textContent = doc.body.textContent || '';
    const finalContent = `${title || 'Untitled Note'}\n\n${textContent}`;
    
    try {
      await navigator.clipboard.writeText(finalContent);
      toast.success('Copied to clipboard ✓');
    } catch {
      toast.error('Failed to copy');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-border-subtle hover:border-accent hover:text-accent text-txt-secondary text-xs font-medium rounded-lg transition-all"
      >
        <RiDownloadCloud2Line className="text-base" />
        <span className="hidden sm:inline">Export</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-bg-elevated border border-border-subtle rounded-xl shadow-2xl py-1.5 z-[100] overflow-hidden">
          <button 
            onClick={handleExportPDF} 
            disabled={isExportingPDF} 
            className="w-full text-left px-4 py-2.5 text-sm text-txt-primary hover:bg-bg-card transition-colors flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingPDF ? <RiLoader4Line className="animate-spin text-accent" size={16} /> : <RiFilePdfLine className="text-red-400" />}
            <span>{isExportingPDF ? 'Generating PDF...' : '📄 Download as PDF'}</span>
          </button>
          <button 
            onClick={() => { onExportHTML(); setIsOpen(false); }} 
            className="w-full text-left px-4 py-2.5 text-sm text-txt-primary hover:bg-bg-card transition-colors flex items-center gap-2.5"
          >
            <RiDownloadCloud2Line className="text-blue-400" />
            <span>🌐 Download as HTML</span>
          </button>
          <button 
            onClick={handleExportText} 
            className="w-full text-left px-4 py-2.5 text-sm text-txt-primary hover:bg-bg-card transition-colors flex items-center gap-2.5"
          >
            <FileText size={15} className="text-green-400" />
            <span>📝 Download as Text</span>
          </button>
          <div className="mx-3 my-1 border-t border-border-subtle" />
          <button 
            onClick={handleCopyText} 
            className="w-full text-left px-4 py-2.5 text-sm text-txt-primary hover:bg-bg-card transition-colors flex items-center gap-2.5"
          >
            <Copy size={15} className="text-txt-muted" />
            <span>📋 Copy to Clipboard</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Toolbar Component ────────────────────────────────────────────────────────
function Toolbar({ editor, isAIOpen, onToggleAI }) {
  if (!editor) return null;

  const toggleAllDetails = (open) => {
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'details' && node.attrs.open !== open) {
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, open }));
      }
    });
  };

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (input.files?.length > 0) {
        try {
          const file = input.files[0];
          const res = await uploadImage(file);
          if (res.success) {
            editor.chain().focus().setImage({ src: res.url }).run();
          }
        } catch (err) {
          console.error('Image upload failed', err);
        }
      }
    };
    input.click();
  };

  const handleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="px-4 py-1.5 border-b border-border-subtle bg-bg-elevated flex flex-nowrap gap-x-3 gap-y-1 items-center overflow-x-auto no-scrollbar whitespace-nowrap">
      
      {/* Group 1: History */}
      <div className="flex items-center gap-0.5">
        <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={<Undo2 size={15}/>} title="Undo (Ctrl+Z)" />
        <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={<Redo2 size={15}/>} title="Redo (Ctrl+Y)" />
      </div>
      <Sep />

      {/* Group 2: Headings */}
      <div className="flex items-center gap-0.5">
        <TBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={<Heading1 size={15}/>} title="Heading 1" />
        <TBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 size={15}/>} title="Heading 2" />
        <TBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={<Heading3 size={15}/>} title="Heading 3" />
      </div>
      <Sep />

      {/* Group 3: Marks */}
      <div className="flex items-center gap-0.5">
        <TBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold size={15}/>} title="Bold (Ctrl+B)" />
        <TBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic size={15}/>} title="Italic (Ctrl+I)" />
        <TBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} icon={<UnderlineIcon size={15}/>} title="Underline (Ctrl+U)" />
        <TBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} icon={<Strikethrough size={15}/>} title="Strikethrough" />
      </div>
      <Sep />

      {/* Group 4: Highlights */}
      <div className="flex items-center gap-0.5">
        <TBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} icon={<Highlighter size={15}/>} title="Highlight (yellow)" />
        <TBtn active={editor.isActive('highlight', { color: '#ef4444' })} onClick={() => editor.chain().focus().toggleHighlight({ color: '#ef4444' }).run()} icon={<Palette size={15} color="#ef4444"/>} title="Red Highlight" />
        <TBtn active={editor.isActive('highlight', { color: '#22c55e' })} onClick={() => editor.chain().focus().toggleHighlight({ color: '#22c55e' }).run()} icon={<Palette size={15} color="#22c55e"/>} title="Green Highlight" />
        <TBtn active={editor.isActive('highlight', { color: '#3b82f6' })} onClick={() => editor.chain().focus().toggleHighlight({ color: '#3b82f6' }).run()} icon={<Palette size={15} color="#3b82f6"/>} title="Blue Highlight" />
      </div>
      <Sep />

      {/* Group 5: Alignment */}
      <div className="flex items-center gap-0.5">
        <TBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={<AlignLeft size={15}/>} title="Align Left" />
        <TBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={<AlignCenter size={15}/>} title="Align Center" />
        <TBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={<AlignRight size={15}/>} title="Align Right" />
        <TBtn active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} icon={<AlignJustify size={15}/>} title="Justify" />
      </div>
      <Sep />

      {/* Group 6: Lists & Blocks */}
      <div className="flex items-center gap-0.5">
        <TBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List size={15}/>} title="Bullet List" />
        <TBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<ListOrdered size={15}/>} title="Numbered List" />
        <TBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={<Quote size={15}/>} title="Blockquote" />
        <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<Minus size={15}/>} title="Horizontal Rule" />
      </div>
      <Sep />

      {/* Group 7: Insert */}
      <div className="flex items-center gap-0.5">
        <TBtn active={editor.isActive('link')} onClick={handleLink} icon={<Link2 size={15}/>} title="Insert Link" />
        <TBtn onClick={handleImageUpload} icon={<ImageIcon size={15}/>} title="Insert Image" />
        <TBtn active={editor.isActive('table')} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} icon={<TableIcon size={15}/>} title="Insert Table" />
        <TBtn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} icon={<Code2 size={15}/>} title="Code Block" />
      </div>
      <Sep />

      {/* Group 8: Structural */}
      <div className="flex items-center gap-0.5">
        <TBtn onClick={() => editor.chain().focus().setDetails().run()} icon={<ChevronRight size={15}/>} title="Insert Collapsible Section" />
        <TBtn onClick={() => toggleAllDetails(false)} icon={<ChevronsDownUp size={15}/>} title="Collapse All Sections" />
        <TBtn onClick={() => toggleAllDetails(true)} icon={<ChevronsUpDown size={15}/>} title="Expand All Sections" />
        <TemplatesDropdown editor={editor} />
      </div>
      <Sep />
      
      {/* Group 9: AI Assistant */}
      <div className="flex items-center gap-0.5">
        <TBtn active={isAIOpen} onClick={onToggleAI} icon={<Sparkles size={15}/>} title="Ask AI (Ctrl+Shift+A)" />
      </div>
    </div>
  );
}

// ─── Templates Dropdown ───────────────────────────────────────────────────────
function TemplatesDropdown({ editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertTemplate = (html) => {
    editor.chain().focus().insertContent(html).run();
    setIsOpen(false);
  };

  const templates = {
    DSA: `<h2>Problem Name</h2><p><strong>Difficulty:</strong> Easy / Medium / Hard</p><p><strong>Topic:</strong> Arrays / Trees / DP</p><details class="details"><summary>Problem Statement</summary><div data-type="detailsContent"><p></p></div></details><details class="details"><summary>My Approach</summary><div data-type="detailsContent"><p></p></div></details><details class="details"><summary>Code Solution</summary><div data-type="detailsContent"><pre><code class="language-javascript"></code></pre></div></details><details class="details"><summary>Time &amp; Space Complexity</summary><div data-type="detailsContent"><p></p></div></details><details class="details"><summary>Key Takeaway</summary><div data-type="detailsContent"><p></p></div></details>`,
    Core: `<h2>Topic Name</h2><p><strong>Phase:</strong> Fundamentals</p><details class="details"><summary>Core Concept</summary><div data-type="detailsContent"><p></p></div></details><details class="details"><summary>Important Points</summary><div data-type="detailsContent"><p></p></div></details><details class="details"><summary>Interview Q&amp;A</summary><div data-type="detailsContent"><p></p></div></details><details class="details"><summary>My Notes</summary><div data-type="detailsContent"><p></p></div></details>`,
    SystemDesign: `<h2>System Name</h2><details class="details"><summary>Requirements (Functional + Non-Functional)</summary><div data-type="detailsContent"><p></p></div></details><details class="details"><summary>Capacity Estimation</summary><div data-type="detailsContent"><p></p></div></details><details class="details"><summary>High-Level Design</summary><div data-type="detailsContent"><p></p></div></details><details class="details"><summary>Deep Dive Components</summary><div data-type="detailsContent"><p></p></div></details><details class="details"><summary>Trade-offs &amp; Bottlenecks</summary><div data-type="detailsContent"><p></p></div></details>`,
    InterviewPrep: `<h2>Question</h2><p><strong>Category:</strong> Behavioral / Technical / HR</p><details class="details"><summary>My Answer (STAR format)</summary><div data-type="detailsContent"><p></p></div></details><details class="details"><summary>Key Points to Remember</summary><div data-type="detailsContent"><p></p></div></details>`,
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-md text-txt-muted hover:bg-bg-card hover:text-txt-primary flex items-center justify-center transition-all"
        title="Insert Template"
      >
        <LayoutTemplate size={15} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-bg-elevated border border-border-subtle rounded-xl shadow-2xl py-1.5 z-[100] overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] text-txt-muted font-semibold uppercase tracking-wider">Templates</div>
          {[
            { key: 'DSA', label: '🧮 DSA Problem' },
            { key: 'Core', label: '📚 Core Subject (OS/DBMS/CNS)' },
            { key: 'SystemDesign', label: '🏗️ System Design' },
            { key: 'InterviewPrep', label: '🎯 Interview Prep' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => insertTemplate(templates[key])} className="w-full text-left px-4 py-2 text-sm text-txt-primary hover:bg-bg-card transition-colors">
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Sep() {
  return <div className="w-px h-4 bg-border-strong mx-1 shrink-0" />;
}

function TBtn({ onClick, active, disabled, icon, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-all flex items-center justify-center shrink-0
        ${active ? 'bg-accent/20 text-accent' : 'text-txt-muted hover:bg-bg-card hover:text-txt-primary'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon}
    </button>
  );
}
