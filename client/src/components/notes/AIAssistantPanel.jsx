import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Trash2, Code2, Plus, Copy, FileText, AlignLeft, RefreshCw, MessageSquare, Globe, ArrowRightLeft, BookOpen, Bug, BarChart2, Map } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';
import { marked } from 'marked';
import api from '../../api';

export default function AIAssistantPanel({ 
  isOpen, 
  onClose, 
  editor, 
  noteTitle, 
  noteCategory, 
  userAiConfig, 
  onInsertHtml 
}) {
  const model = 'gemini';
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sectionContext, setSectionContext] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  
  const [useNoteContext, setUseNoteContext] = useState(() => {
    const stored = localStorage.getItem('ai_use_note_context');
    return stored !== null ? stored === 'true' : true;
  });
  const [showContextSuggestion, setShowContextSuggestion] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isLoading]);

  useEffect(() => {
    // Detect active section context when selection updates
    if (!editor || !isOpen) return;

    const updateContext = () => {
      const { $from } = editor.state.selection;
      let currentHeadingNode = null;
      let currentHeadingPos = 0;
      
      // Look upwards for the closest heading
      editor.state.doc.nodesBetween(0, $from.pos, (node, pos) => {
        if (node.type.name === 'heading') {
          currentHeadingNode = node;
          currentHeadingPos = pos;
        }
      });

      if (currentHeadingNode) {
        setSectionTitle(currentHeadingNode.textContent);
        
        const level = currentHeadingNode.attrs.level;
        let endPos = editor.state.doc.content.size;
        
        // Find next heading of same or higher level to mark end of section
        editor.state.doc.nodesBetween(currentHeadingPos + currentHeadingNode.nodeSize, editor.state.doc.content.size, (node, pos) => {
          if (node.type.name === 'heading' && node.attrs.level <= level && pos < endPos) {
            endPos = pos;
            return false; // Stop traversing this branch
          }
        });

        const sectionText = editor.state.doc.textBetween(currentHeadingPos, endPos, '\n');
        setSectionContext(sectionText);
      } else {
        setSectionTitle('Entire Note');
        setSectionContext(editor.getText());
      }
    };

    editor.on('selectionUpdate', updateContext);
    editor.on('update', updateContext);
    
    // Initial call
    updateContext();

    return () => {
      editor.off('selectionUpdate', updateContext);
      editor.off('update', updateContext);
    };
  }, [editor, isOpen]);

  const handleToggleContext = () => {
    const newVal = !useNoteContext;
    setUseNoteContext(newVal);
    localStorage.setItem('ai_use_note_context', newVal);
    setShowContextSuggestion(false);
  };

  useEffect(() => {
    if (!useNoteContext || !question.trim()) {
      setShowContextSuggestion(false);
      return;
    }
    const q = question.toLowerCase();
    
    // Check if it's a general question
    const generalSignals = ['what is', 'explain', 'define', 'how does', 'difference between', 'what are', 'why is', 'when was', 'who is', 'give me', 'list all', 'what do you know about'];
    const hasGeneralSignal = generalSignals.some(sig => q.startsWith(sig) || q.includes(sig));
    
    // Check if it contains note-specific pronouns
    const contextSignals = ['this', 'here', 'above', 'this topic', 'this section', 'explain this', 'what does this mean', 'this note', 'based on this', 'from the note', 'in this', 'the example above', 'it says'];
    const hasContextSignal = contextSignals.some(sig => q.includes(sig));

    if (hasGeneralSignal && !hasContextSignal) {
      setShowContextSuggestion(true);
    } else {
      setShowContextSuggestion(false);
    }
  }, [question, useNoteContext]);

  const askAi = async (promptText = question, forceContextVal = null) => {
    if (!promptText.trim() || isLoading) return;
    
    const finalUseContext = typeof forceContextVal === 'boolean' ? forceContextVal : useNoteContext;

    const newHistory = [...history, { role: 'user', content: promptText, usedContext: finalUseContext }];
    setHistory(newHistory);
    setQuestion('');
    setIsLoading(true);
    setShowContextSuggestion(false);

    try {
      const noteContext = editor ? editor.getText() : '';
      const payload = {
        model,
        question: promptText,
        history: history.slice(-10), // keep last 10
        noteTitle,
        noteCategory,
        useNoteContext: finalUseContext
      };

      if (finalUseContext) {
        payload.noteContext = noteContext;
        payload.sectionContext = sectionContext;
      }

      const res = await api.post('/ai/conversation', payload);
      
      if (res.data.success) {
        setHistory(prev => [...prev, { role: 'assistant', content: res.data.answer, model: res.data.model }]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to get AI response');
      // Remove the user message if it failed
      setHistory(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const insertToNote = (markdownText) => {
    if (!editor) return;
    const html = marked.parse(markdownText);
    editor.chain().focus().insertContent(html).run();
    if (onInsertHtml) onInsertHtml(); 
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askAi(question);
    }
  };

  const handleGeneralQuickAction = (prefix) => {
    setUseNoteContext(false);
    localStorage.setItem('ai_use_note_context', 'false');
    setQuestion(prefix);
    textareaRef.current?.focus();
  };

  const noteQuickActions = [
    { label: 'Summarize', icon: <AlignLeft size={14}/>, prompt: 'Summarize the key points of this section concisely.' },
    { label: 'Interview Q&A', icon: <MessageSquare size={14}/>, prompt: 'Generate 5 likely interview questions based on this section, with short answers.' },
    { label: 'Explain Simple', icon: <Sparkles size={14}/>, prompt: 'Explain this section in simple terms, as if to a beginner.' },
    { label: 'Real-world example', icon: <RefreshCw size={14}/>, prompt: 'Provide a real-world example of this concept.' },
    { label: 'Key points', icon: <Code2 size={14}/>, prompt: 'What are the key points to remember here?' }
  ];

  const generalQuickActions = [
    { label: 'What is ___?', icon: <BookOpen size={14}/>, prefix: 'What is ' },
    { label: 'Compare ___ vs ___', icon: <ArrowRightLeft size={14}/>, prefix: 'Compare  vs ' },
    { label: 'Roadmap for ___', icon: <Map size={14}/>, prefix: 'Give me a study roadmap for ' },
    { label: 'Interview tips for ___', icon: <Bug size={14}/>, prefix: 'Give placement interview tips for ' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0.5 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed md:relative right-0 top-0 h-full w-full md:w-[420px] bg-bg-surface border-l border-border-subtle shadow-2xl flex flex-col z-[100] md:z-0 shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-bg-elevated">
            <div className="flex items-center gap-2">
              <Sparkles className="text-accent" size={18} />
              <h3 className="font-bold text-txt-primary">AI Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHistory([])} title="Clear Chat" className="p-1.5 text-txt-muted hover:text-red-400 rounded-md transition-colors">
                <Trash2 size={16} />
              </button>
              <button onClick={onClose} className="p-1.5 text-txt-muted hover:bg-bg-card rounded-md transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Model Selector & Context Chip */}
          <div className="px-4 py-3 bg-bg-surface/50 border-b border-border-subtle">
            
            {useNoteContext ? (
              <div className="flex items-center justify-between gap-2 text-[11px] text-accent bg-accent/5 px-2.5 py-1.5 rounded border border-accent/20 cursor-pointer hover:bg-accent/10 transition-colors" onClick={handleToggleContext}>
                <div className="flex items-center gap-2 truncate">
                  <FileText size={12} />
                  <span className="truncate">Using context: {sectionTitle || 'Entire Note'}</span>
                </div>
                <span className="shrink-0 font-semibold px-1.5 bg-accent/20 rounded">ON</span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 text-[11px] text-txt-muted bg-bg-card px-2.5 py-1.5 rounded border border-border-subtle cursor-pointer hover:bg-border-subtle/50 transition-colors" onClick={handleToggleContext}>
                <div className="flex items-center gap-2 truncate">
                  <Globe size={12} />
                  <span className="truncate">General mode — no note context</span>
                </div>
                <span className="shrink-0 font-semibold px-1.5 bg-bg-elevated rounded">OFF</span>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 editor-scroll-container relative">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-txt-muted space-y-3 opacity-50">
                <Sparkles size={40} className="mb-2" />
                <p className="text-sm text-center px-6">Ask a question about your note, or generate summaries and interview questions.</p>
              </div>
            ) : (
              history.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="text-[10px] uppercase font-bold text-txt-muted mb-1 ml-1 tracking-wider flex items-center gap-1">
                      <span>AI Assistant</span>
                    </div>
                  )}
                  <div 
                    className={`max-w-[92%] rounded-xl px-4 py-3 text-sm leading-relaxed overflow-hidden relative ${
                      msg.role === 'user' 
                        ? 'bg-accent text-white rounded-br-none' 
                        : 'bg-bg-elevated border border-border-subtle text-txt-primary rounded-tl-none shadow-sm markdown-body'
                    }`}
                  >
                    {msg.role === 'user' && (
                      <div className="absolute top-1 right-2 opacity-50 text-[10px]" title={msg.usedContext ? "Note Context" : "General Mode"}>
                        {msg.usedContext ? '📄' : '🌐'}
                      </div>
                    )}
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap mt-2">{msg.content}</p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                {...props}
                                children={String(children).replace(/\n$/, '')}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-md my-3 text-xs overflow-x-auto"
                              />
                            ) : (
                              <code {...props} className="bg-bg-card px-1.5 py-0.5 rounded text-accent font-mono text-xs">
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  
                  {/* Action Buttons for AI Response */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-2 ml-1">
                      <button onClick={() => insertToNote(msg.content)} className="flex items-center gap-1.5 text-[11px] font-semibold text-txt-secondary hover:text-accent bg-bg-card hover:bg-accent/10 px-2 py-1 rounded transition-colors border border-border-subtle">
                        <Plus size={12}/> Insert
                      </button>
                      <button onClick={() => copyToClipboard(msg.content)} className="flex items-center gap-1.5 text-[11px] font-semibold text-txt-secondary hover:text-txt-primary bg-bg-card hover:bg-border-subtle px-2 py-1 rounded transition-colors border border-border-subtle">
                        <Copy size={12}/> Copy
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-bg-elevated border border-border-subtle rounded-xl rounded-tl-none px-5 py-4 flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions & Input Area */}
          <div className="p-4 bg-bg-elevated border-t border-border-subtle">
            
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase text-txt-muted mb-2 tracking-wider">About this note:</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {noteQuickActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setUseNoteContext(true);
                      localStorage.setItem('ai_use_note_context', 'true');
                      askAi(action.prompt, true);
                    }}
                    disabled={isLoading}
                    className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold bg-bg-card border border-border-subtle hover:border-accent hover:text-accent text-txt-secondary px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>

              <p className="text-[10px] font-bold uppercase text-txt-muted mt-2 mb-2 tracking-wider">General questions:</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {generalQuickActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => handleGeneralQuickAction(action.prefix)}
                    disabled={isLoading}
                    className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold bg-bg-card border border-border-subtle hover:border-accent hover:text-accent text-txt-secondary px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={useNoteContext ? "Ask about this note... (Enter to send)" : "Ask a general question... (Enter to send)"}
                className="w-full bg-bg-surface border border-border-subtle rounded-xl pl-4 pr-12 py-3 text-sm text-txt-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none placeholder:text-txt-muted min-h-[50px] max-h-[120px]"
                rows={1}
                disabled={isLoading}
              />
              <button 
                onClick={() => askAi(question)}
                disabled={!question.trim() || isLoading}
                className="absolute right-2 top-2 p-1.5 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
            
            {showContextSuggestion && (
              <div className="mt-2 text-[11px] text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-md flex items-center justify-between">
                <span>💡 Looks like a general question — switch to General mode?</span>
                <button onClick={handleToggleContext} className="font-bold hover:underline px-2 py-0.5 bg-amber-500/20 rounded">
                  [Switch]
                </button>
              </div>
            )}
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
