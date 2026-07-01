import React, { useState, useMemo } from 'react';
import { Plus, MoreVertical, FileText, ChevronRight, ChevronDown, Edit2, Trash2, ArrowDown, ArrowUp, FoldHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

export default function DocumentTabs({ tabs, setTabs, activeTabId, setActiveTabId }) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [collapsedIds, setCollapsedIds] = useState(new Set());

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleGlobalClick = () => setMenuOpenId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleAddTab = () => {
    const newTab = {
      id: uuidv4(),
      title: 'Untitled Tab',
      content: '',
      parentId: null,
      order: tabs.length
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleAddSubtab = (parentId, e) => {
    e.stopPropagation();
    
    // Find highest order among existing children
    const children = tabs.filter(t => t.parentId === parentId);
    const maxOrder = children.length > 0 ? Math.max(...children.map(c => c.order)) : -1;

    const newTab = {
      id: uuidv4(),
      title: 'Untitled Subtab',
      content: '',
      parentId,
      order: maxOrder + 1
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setMenuOpenId(null);

    // Auto-expand parent
    setCollapsedIds(prev => {
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
  };

  const handleDeleteTab = (id, e) => {
    e.stopPropagation();
    
    // Recursive delete (delete tab and all its subtabs)
    const idsToDelete = new Set([id]);
    let added = true;
    while (added) {
      added = false;
      tabs.forEach(t => {
        if (t.parentId && idsToDelete.has(t.parentId) && !idsToDelete.has(t.id)) {
          idsToDelete.add(t.id);
          added = true;
        }
      });
    }

    const newTabs = tabs.filter(t => !idsToDelete.has(t.id));
    setTabs(newTabs);

    if (idsToDelete.has(activeTabId)) {
      // Find a fallback tab (e.g. first root tab)
      const fallback = newTabs.find(t => !t.parentId);
      setActiveTabId(fallback ? fallback.id : null);
    }
    setMenuOpenId(null);
  };

  const handleRenameSubmit = (id) => {
    if (editTitle.trim()) {
      setTabs(tabs.map(t => t.id === id ? { ...t, title: editTitle.trim() } : t));
    }
    setEditingId(null);
  };

  const startRename = (id, title, e) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
    setMenuOpenId(null);
  };

  const toggleCollapse = (id, e) => {
    e.stopPropagation();
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build Tree
  const tree = useMemo(() => {
    const rootNodes = tabs.filter(t => !t.parentId).sort((a, b) => a.order - b.order);
    
    const buildNode = (node) => {
      const children = tabs
        .filter(t => t.parentId === node.id)
        .sort((a, b) => a.order - b.order)
        .map(buildNode);
      return { ...node, children };
    };

    return rootNodes.map(buildNode);
  }, [tabs]);

  const renderNode = (node, depth = 0) => {
    const isActive = activeTabId === node.id;
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsedIds.has(node.id);
    const isEditing = editingId === node.id;

    return (
      <div key={node.id} className="flex flex-col">
        <div 
          onClick={() => setActiveTabId(node.id)}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-colors mb-0.5 ${
            isActive ? 'bg-accent/10 text-accent font-medium' : 'text-txt-secondary hover:bg-bg-card hover:text-txt-primary'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Collapse Caret or Spacer */}
            {hasChildren ? (
              <button 
                onClick={(e) => toggleCollapse(node.id, e)}
                className="p-0.5 hover:bg-bg-elevated rounded text-txt-muted shrink-0"
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
            ) : (
              <div className="w-[18px] shrink-0 flex items-center justify-center">
                <FileText size={13} className={isActive ? "text-accent" : "text-border-strong"} />
              </div>
            )}

            {/* Title / Editor */}
            {isEditing ? (
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => handleRenameSubmit(node.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRenameSubmit(node.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="bg-bg-elevated text-txt-primary px-1 py-0.5 text-xs rounded border border-accent/50 outline-none w-full"
              />
            ) : (
              <span className="text-xs truncate" title={node.title}>{node.title}</span>
            )}
          </div>

          {/* Action Menu Trigger */}
          <div className="relative shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === node.id ? null : node.id); }}
              className={`p-1 rounded transition-opacity ${menuOpenId === node.id ? 'opacity-100 bg-bg-elevated text-txt-primary' : 'opacity-0 group-hover:opacity-100 hover:bg-bg-elevated'}`}
            >
              <MoreVertical size={14} />
            </button>
            
            {/* Dropdown Menu */}
            <AnimatePresence>
              {menuOpenId === node.id && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-full mt-1 w-40 bg-bg-elevated border border-border-subtle rounded-xl shadow-2xl py-1 z-50 origin-top-right overflow-hidden"
                >
                  <button onClick={(e) => handleAddSubtab(node.id, e)} className="w-full text-left px-3 py-2 text-xs text-txt-primary hover:bg-bg-card transition-colors flex items-center gap-2">
                    <FoldHorizontal size={14} /> Add subtab
                  </button>
                  <button onClick={(e) => startRename(node.id, node.title, e)} className="w-full text-left px-3 py-2 text-xs text-txt-primary hover:bg-bg-card transition-colors flex items-center gap-2">
                    <Edit2 size={14} /> Rename
                  </button>
                  <div className="mx-2 my-1 border-t border-border-subtle" />
                  <button onClick={(e) => handleDeleteTab(node.id, e)} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 transition-colors flex items-center gap-2">
                    <Trash2 size={14} /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Children */}
        {!isCollapsed && hasChildren && (
          <div className="flex flex-col relative">
            <div className="absolute left-[16px] top-0 bottom-1 border-l border-border-subtle/50" />
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-4 w-full">
      <div className="flex items-center justify-between mb-4 pl-1">
        <h3 className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">Document Tabs</h3>
        <button 
          onClick={handleAddTab}
          className="p-1 rounded-md text-txt-muted hover:text-txt-primary hover:bg-bg-card transition-colors"
          title="Add new root tab"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col pb-10">
        {tabs.length === 0 ? (
          <div className="text-center mt-10 text-xs text-txt-muted">
            <p>No tabs yet.</p>
            <button onClick={handleAddTab} className="mt-2 text-accent hover:underline">Create Main Tab</button>
          </div>
        ) : (
          tree.map(node => renderNode(node, 0))
        )}
      </div>
    </div>
  );
}
