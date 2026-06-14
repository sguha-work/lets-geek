import React, { useState, useEffect, useRef } from 'react';
import {
  FolderPlus,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  MessageSquare,
  FileText,
  FileCode,
  Music,
  Video,
  Link2,
  Grid,
  List,
  Edit2,
  CheckSquare,
  Square,
  Send,
  X,
  File,
  Sparkles,
  RefreshCw,
  MoreVertical,
  ArrowLeft,
  Calendar,
  Clock,
  Zap,
  BookMarked,
  Star,
  LayoutGrid,
} from 'lucide-react';

// ==========================================
// TYPES DEFINITIONS
// ==========================================
export interface Source {
  _id: string;
  title: string;
  type: 'pdf' | 'doc' | 'audio' | 'video' | 'url';
  url: string;
  content: string;
  createdAt?: string;
}

export interface ChecklistItem {
  text: string;
  checked: boolean;
  _id?: string;
}

export interface Note {
  _id: string;
  title?: string;
  type: 'text' | 'list' | 'checklist';
  content?: string;
  listContent?: string[];
  checklistContent?: ChecklistItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface StudySpace {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  createdAt: string;
  lastOpened?: string;
  sourceCount?: number;
  noteCount?: number;
}

const API_BASE = 'http://localhost:3000/api';

// ==========================================
// DEFAULT MOCK FALLBACKS (If backend is offline)
// ==========================================
const DEFAULT_SOURCES: Source[] = [
  {
    _id: 'mock-s1',
    title: 'Quantum Physics Intro.pdf',
    type: 'pdf',
    url: 'https://arxiv.org/pdf/quantum-intro',
    content: `# STUDY GUIDE: Quantum Physics Intro.pdf\n\n## Section 1: Overview\nQuantum mechanics is a fundamental theory in physics that describes the physical properties of nature at the scale of atoms and subatomic particles.\n\n## Section 2: Core Concepts\n1. Wave-Particle Duality: Light and matter exhibit both wave-like and particle-like properties.\n2. Uncertainty Principle: Formulated by Werner Heisenberg, states that we cannot simultaneously know both the exact position and momentum of a particle.\n3. Superposition: A physical system exists in multiple states simultaneously until it is measured.`,
  },
  {
    _id: 'mock-s2',
    title: 'Biology Class Notes.doc',
    type: 'doc',
    url: 'https://docs.google.com/biology-notes',
    content: `# STUDY NOTES: Biology Class Notes.doc\n\nThis document covers cellular biology fundamentals.\nKey topic: Photosynthesis.\nProcess: Light-dependent reactions convert solar energy into chemical energy (ATP and NADPH), taking place in the thylakoid membranes of chloroplasts. The Calvin cycle uses these carriers to fix CO2 into sugar molecules.`,
  },
  {
    _id: 'mock-s3',
    title: 'AI Ethics Lecture.mp3',
    type: 'audio',
    url: 'https://podcasts.org/ai-ethics-audio',
    content: `# TRANSCRIPT: AI Ethics Lecture.mp3\n\n[00:05] Professor: Today, we will debate the moral considerations of autonomous machine learning models.\n[08:40] Student: Should developers be legally liable for algorithmic bias?\n[09:10] Professor: The consensus is evolving. Regulatory bodies emphasize transparency, auditability, and data governance as the main pillars of risk mitigation.`,
  },
];

const DEFAULT_NOTES: Note[] = [
  {
    _id: 'mock-n1',
    title: 'Key Definition',
    type: 'text',
    content: 'Wave-Particle Duality states that every particle or quantum entity may be described as either a particle or a wave.',
  },
  {
    _id: 'mock-n2',
    title: 'Calculus Topics to Review',
    type: 'list',
    listContent: [
      'Limits and continuity proofs',
      'Integration by parts method',
      'Taylor series expansion formulas',
    ],
  },
  {
    _id: 'mock-n3',
    title: 'Study Checklist',
    type: 'checklist',
    checklistContent: [
      { text: 'Read Quantum Physics Intro PDF', checked: true },
      { text: 'Complete homework exercise 4', checked: false },
      { text: 'Review lecture transcript audio', checked: false },
    ],
  },
];

const SPACE_COLORS = [
  { bg: 'from-violet-600 to-purple-700', accent: 'violet', dot: 'bg-violet-400' },
  { bg: 'from-blue-600 to-indigo-700', accent: 'blue', dot: 'bg-blue-400' },
  { bg: 'from-emerald-600 to-teal-700', accent: 'emerald', dot: 'bg-emerald-400' },
  { bg: 'from-rose-600 to-pink-700', accent: 'rose', dot: 'bg-rose-400' },
  { bg: 'from-amber-500 to-orange-600', accent: 'amber', dot: 'bg-amber-400' },
  { bg: 'from-cyan-600 to-sky-700', accent: 'cyan', dot: 'bg-cyan-400' },
];

const DEFAULT_SPACES: StudySpace[] = [
  {
    id: 'space-default',
    name: 'My Study Space',
    description: 'General study materials, notes, and AI chat. Your default learning environment.',
    emoji: '📚',
    color: 'from-violet-600 to-purple-700',
    createdAt: new Date().toISOString(),
    lastOpened: new Date().toISOString(),
  },
];

// ==========================================
// STUDY SPACE WORKSPACE (previous root page)
// ==========================================
function StudySpaceWorkspace({
  space,
  onBack,
}: {
  space: StudySpace;
  onBack: () => void;
}) {
  // Backend connection status
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [loadingSources, setLoadingSources] = useState<boolean>(true);
  const [loadingNotes, setLoadingNotes] = useState<boolean>(true);

  // Application Data States
  const [sources, setSources] = useState<Source[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am your AI Study Assistant for "${space.name}". Select one or more sources on the left panel, and ask me questions about your materials. I will formulate answers grounded directly in your selected studies.`,
      timestamp: new Date(),
    },
  ]);

  // Selected Sources for grounding chat
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

  // Source categorization & UI layout states
  const [sourceCategory, setSourceCategory] = useState<string>('all');
  const [sourceViewMode, setSourceViewMode] = useState<'list' | 'grid'>('list');
  const [previewSource, setPreviewSource] = useState<Source | null>(null);

  // Sidebar active menus
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Chat form input & typing state
  const [chatInput, setChatInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [showAddSourceModal, setShowAddSourceModal] = useState<boolean>(false);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form states - Add Source
  const [newSourceTitle, setNewSourceTitle] = useState<string>('');
  const [newSourceType, setNewSourceType] = useState<'pdf' | 'doc' | 'audio' | 'video' | 'url'>('pdf');
  const [newSourceUrl, setNewSourceUrl] = useState<string>('');
  const [newSourceContent, setNewSourceContent] = useState<string>('');

  // Form states - Add/Edit Note
  const [noteFormTitle, setNoteFormTitle] = useState<string>('');
  const [noteFormType, setNoteFormType] = useState<'text' | 'list' | 'checklist'>('text');
  const [noteFormTextContent, setNoteFormTextContent] = useState<string>('');
  const [noteFormListItems, setNoteFormListItems] = useState<string[]>(['']);
  const [noteFormChecklistItems, setNoteFormChecklistItems] = useState<{ text: string; checked: boolean }[]>([
    { text: '', checked: false },
  ]);

  // localStorage keys scoped to this space
  const lsKeySource = `lg_sources_${space.id}`;
  const lsKeyNotes = `lg_notes_${space.id}`;

  // ==========================================
  // FETCH APIs AND INITIAL LOAD
  // ==========================================
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const res = await fetch(`${API_BASE}/sources`);
      if (res.ok) {
        setBackendOnline(true);
        fetchSources();
        fetchNotes();
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.warn('Backend is offline. Using local storage / fallback mockup data.');
      setBackendOnline(false);

      const localSources = localStorage.getItem(lsKeySource);
      const localNotes = localStorage.getItem(lsKeyNotes);

      if (localSources) {
        setSources(JSON.parse(localSources));
      } else {
        setSources(DEFAULT_SOURCES);
        localStorage.setItem(lsKeySource, JSON.stringify(DEFAULT_SOURCES));
      }

      if (localNotes) {
        setNotes(JSON.parse(localNotes));
      } else {
        setNotes(DEFAULT_NOTES);
        localStorage.setItem(lsKeyNotes, JSON.stringify(DEFAULT_NOTES));
      }
      setLoadingSources(false);
      setLoadingNotes(false);
    }
  };

  const fetchSources = async () => {
    try {
      setLoadingSources(true);
      const res = await fetch(`${API_BASE}/sources`);
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setLoadingSources(false);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoadingNotes(true);
      const res = await fetch(`${API_BASE}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const syncLocalData = (updatedSources?: Source[], updatedNotes?: Note[]) => {
    if (!backendOnline) {
      if (updatedSources) {
        setSources(updatedSources);
        localStorage.setItem(lsKeySource, JSON.stringify(updatedSources));
      }
      if (updatedNotes) {
        setNotes(updatedNotes);
        localStorage.setItem(lsKeyNotes, JSON.stringify(updatedNotes));
      }
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // ==========================================
  // SOURCE ACTIONS
  // ==========================================
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceTitle.trim()) return;

    const payload = {
      title: newSourceTitle,
      type: newSourceType,
      url: newSourceUrl || `https://example.com/mock-${Date.now()}`,
      content: newSourceContent,
    };

    if (backendOnline) {
      try {
        const res = await fetch(`${API_BASE}/sources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setSources([created, ...sources]);
        }
      } catch (err) {
        console.error('Failed to save source:', err);
      }
    } else {
      const mockCreated: Source = {
        _id: `mock-s-${Date.now()}`,
        ...payload,
        content: payload.content || `# ${payload.title}\n\nThis is static mock content for local study. Add more concepts or explanations here.`,
      };
      const updated = [mockCreated, ...sources];
      syncLocalData(updated, undefined);
    }

    setNewSourceTitle('');
    setNewSourceType('pdf');
    setNewSourceUrl('');
    setNewSourceContent('');
    setShowAddSourceModal(false);
  };

  const handleDeleteSource = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this source?')) return;

    setSelectedSourceIds(selectedSourceIds.filter(sId => sId !== id));
    if (previewSource?._id === id) setPreviewSource(null);

    if (backendOnline) {
      try {
        const res = await fetch(`${API_BASE}/sources/${id}`, { method: 'DELETE' });
        if (res.ok) setSources(sources.filter(s => s._id !== id));
      } catch (err) {
        console.error('Failed to delete source:', err);
      }
    } else {
      syncLocalData(sources.filter(s => s._id !== id), undefined);
    }
  };

  const toggleSourceSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSourceIds.includes(id)) {
      setSelectedSourceIds(selectedSourceIds.filter(sId => sId !== id));
    } else {
      setSelectedSourceIds([...selectedSourceIds, id]);
    }
  };

  const selectAllSources = () => {
    const filtered = getFilteredSources();
    const filteredIds = filtered.map(s => s._id);
    const allSelected = filteredIds.every(id => selectedSourceIds.includes(id));
    if (allSelected) {
      setSelectedSourceIds(selectedSourceIds.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedSourceIds(Array.from(new Set([...selectedSourceIds, ...filteredIds])));
    }
  };

  const getFilteredSources = () => {
    if (sourceCategory === 'all') return sources;
    if (sourceCategory === 'media') return sources.filter(s => s.type === 'audio' || s.type === 'video');
    return sources.filter(s => s.type === sourceCategory);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
      case 'doc': return <FileCode className="w-5 h-5 text-blue-400" />;
      case 'audio': return <Music className="w-5 h-5 text-emerald-400" />;
      case 'video': return <Video className="w-5 h-5 text-purple-400" />;
      case 'url': return <Link2 className="w-5 h-5 text-amber-400" />;
      default: return <File className="w-5 h-5 text-zinc-400" />;
    }
  };

  // ==========================================
  // CHAT ACTIONS
  // ==========================================
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsgText = chatInput;
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    if (backendOnline) {
      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsgText, sourceIds: selectedSourceIds }),
        });
        if (res.ok) {
          const data = await res.json();
          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              { id: `ai-${Date.now()}`, sender: 'ai', text: data.message, timestamp: new Date() },
            ]);
            setIsTyping(false);
          }, 800);
        } else {
          throw new Error('Failed to fetch AI response');
        }
      } catch (err) {
        console.error('Chat error:', err);
        setIsTyping(false);
      }
    } else {
      setTimeout(() => {
        const count = selectedSourceIds.length;
        const reply =
          count > 0
            ? `[Local Offline Mock] Grounded in your ${count} selected source(s):\n\nI scanned the materials regarding "${userMsgText}". Key concepts show that integrating study materials with immediate sticky notes yields higher test retention rates. Wave-particle duality suggests that matter has dual characteristics, while biology studies confirm chloroplast cells drive solar energy conversion.`
            : `[Local Offline Mock] I received: "${userMsgText}".\n\nPlease select one or more sources on the left panel (check the circle/checkbox on the source items) to ground my response in specific documents.`;
        setMessages(prev => [
          ...prev,
          { id: `ai-${Date.now()}`, sender: 'ai', text: reply, timestamp: new Date() },
        ]);
        setIsTyping(false);
      }, 1000);
    }
  };

  // ==========================================
  // NOTES CRUD ACTIONS
  // ==========================================
  const openAddNoteModal = () => {
    setEditingNote(null);
    setNoteFormTitle('');
    setNoteFormType('text');
    setNoteFormTextContent('');
    setNoteFormListItems(['']);
    setNoteFormChecklistItems([{ text: '', checked: false }]);
    setShowNoteModal(true);
  };

  const openEditNoteModal = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNote(note);
    setNoteFormTitle(note.title || '');
    setNoteFormType(note.type);
    if (note.type === 'text') {
      setNoteFormTextContent(note.content || '');
    } else if (note.type === 'list') {
      setNoteFormListItems(note.listContent && note.listContent.length > 0 ? [...note.listContent] : ['']);
    } else if (note.type === 'checklist') {
      setNoteFormChecklistItems(
        note.checklistContent && note.checklistContent.length > 0
          ? note.checklistContent.map(item => ({ text: item.text, checked: item.checked }))
          : [{ text: '', checked: false }]
      );
    }
    setShowNoteModal(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    let payload: Partial<Note> = { title: noteFormTitle, type: noteFormType };
    if (noteFormType === 'text') payload.content = noteFormTextContent;
    else if (noteFormType === 'list') payload.listContent = noteFormListItems.filter(item => item.trim() !== '');
    else if (noteFormType === 'checklist') payload.checklistContent = noteFormChecklistItems.filter(item => item.text.trim() !== '');

    if (editingNote) {
      if (backendOnline) {
        try {
          const res = await fetch(`${API_BASE}/notes/${editingNote._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const updated = await res.json();
            setNotes(notes.map(n => (n._id === editingNote._id ? updated : n)));
          }
        } catch (err) {
          console.error('Failed to update note:', err);
        }
      } else {
        const updatedNotes = notes.map(n =>
          n._id === editingNote._id ? ({ ...n, ...payload, updatedAt: new Date().toISOString() } as Note) : n
        );
        syncLocalData(undefined, updatedNotes);
      }
    } else {
      if (backendOnline) {
        try {
          const res = await fetch(`${API_BASE}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const created = await res.json();
            setNotes([created, ...notes]);
          }
        } catch (err) {
          console.error('Failed to create note:', err);
        }
      } else {
        const mockCreated: Note = {
          _id: `mock-n-${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Note;
        syncLocalData(undefined, [mockCreated, ...notes]);
      }
    }

    setShowNoteModal(false);
    setEditingNote(null);
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;
    if (backendOnline) {
      try {
        const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
        if (res.ok) setNotes(notes.filter(n => n._id !== id));
      } catch (err) {
        console.error('Failed to delete note:', err);
      }
    } else {
      syncLocalData(undefined, notes.filter(n => n._id !== id));
    }
  };

  const handleToggleChecklistCheckbox = async (noteId: string, itemIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const note = notes.find(n => n._id === noteId);
    if (!note || note.type !== 'checklist' || !note.checklistContent) return;
    const updatedChecklist = [...note.checklistContent];
    updatedChecklist[itemIndex] = { ...updatedChecklist[itemIndex], checked: !updatedChecklist[itemIndex].checked };
    const updatedNotes = notes.map(n => (n._id === noteId ? { ...n, checklistContent: updatedChecklist } : n));
    setNotes(updatedNotes);
    if (backendOnline) {
      try {
        await fetch(`${API_BASE}/notes/${noteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checklistContent: updatedChecklist }),
        });
      } catch (err) {
        console.error('Failed to sync checklist update:', err);
      }
    } else {
      syncLocalData(undefined, updatedNotes);
    }
  };

  // ==========================================
  // DYNAMIC INPUT FIELDS HELPERS
  // ==========================================
  const handleAddListRow = () => setNoteFormListItems([...noteFormListItems, '']);
  const handleRemoveListRow = (index: number) => {
    const updated = [...noteFormListItems];
    updated.splice(index, 1);
    setNoteFormListItems(updated.length > 0 ? updated : ['']);
  };
  const handleListRowChange = (index: number, val: string) => {
    const updated = [...noteFormListItems];
    updated[index] = val;
    setNoteFormListItems(updated);
  };
  const handleAddChecklistRow = () => setNoteFormChecklistItems([...noteFormChecklistItems, { text: '', checked: false }]);
  const handleRemoveChecklistRow = (index: number) => {
    const updated = [...noteFormChecklistItems];
    updated.splice(index, 1);
    setNoteFormChecklistItems(updated.length > 0 ? updated : [{ text: '', checked: false }]);
  };
  const handleChecklistRowChange = (index: number, fields: Partial<{ text: string; checked: boolean }>) => {
    const updated = [...noteFormChecklistItems];
    updated[index] = { ...updated[index], ...fields };
    setNoteFormChecklistItems(updated);
  };

  // ==========================================
  // WORKSPACE RENDER
  // ==========================================
  return (
    <div className="flex flex-col h-screen w-screen bg-[#090b11] text-zinc-100 overflow-hidden font-sans select-none antialiased">
      {/* ================= HEADER ================= */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-[#0f121d]/90 border-b border-zinc-900 z-10">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={onBack}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition duration-150 mr-1"
            title="Back to LetsGeek Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="p-2 bg-violet-600/10 border border-violet-500/20 rounded-xl text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)] animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-zinc-500 text-sm font-normal">LetsGeek /</span>
              {space.emoji} {space.name}
            </h1>
            <p className="text-xxs text-zinc-400 -mt-0.5">AI-powered study workspace</p>
          </div>
        </div>

        {/* Server status indicator */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${
            backendOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            {backendOnline ? 'API Connected' : 'Offline Mode (Local Fallbacks)'}
            <button
              onClick={checkBackendConnection}
              className="ml-1 p-0.5 hover:bg-white/10 rounded-md transition duration-150"
              title="Refresh connection"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= DASHBOARD MAIN LAYOUT ================= */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ================= LEFT PANEL: SOURCE MANAGEMENT ================= */}
        <aside className="w-80 flex flex-col bg-[#0b0e16] border-r border-zinc-900/60 overflow-hidden">
          {/* Header Action */}
          <div className="p-4 border-b border-zinc-900/40 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Sources</h2>
              <p className="text-xs text-zinc-400">{sources.length} items available</p>
            </div>
            <button
              onClick={() => setShowAddSourceModal(true)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-xl transition duration-150 shadow-[0_4px_12px_rgba(109,40,217,0.3)]"
            >
              <Plus className="w-4 h-4" /> Add Source
            </button>
          </div>

          {/* Filtering Tabs & Display controls */}
          <div className="px-4 py-2 border-b border-zinc-900/30 flex items-center justify-between gap-1">
            <div className="flex bg-[#121624] p-0.5 rounded-lg border border-zinc-900/60 overflow-x-auto select-none no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'pdf', label: 'PDF' },
                { id: 'doc', label: 'Docs' },
                { id: 'media', label: 'Media' },
                { id: 'url', label: 'Links' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSourceCategory(tab.id)}
                  className={`px-2 py-1 rounded-md text-xxs font-medium transition duration-150 ${
                    sourceCategory === tab.id
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[#121624] p-0.5 rounded-lg border border-zinc-900/60">
              <button
                onClick={() => setSourceViewMode('list')}
                className={`p-1 rounded transition duration-150 ${sourceViewMode === 'list' ? 'bg-zinc-800 text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSourceViewMode('grid')}
                className={`p-1 rounded transition duration-150 ${sourceViewMode === 'grid' ? 'bg-zinc-800 text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Grid Cards View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Grounding Status Summary */}
          <div className="px-4 py-2 bg-violet-950/10 border-b border-violet-950/20 flex items-center justify-between text-xs text-violet-300/90 font-medium">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-400" />
              {selectedSourceIds.length} source(s) selected
            </span>
            <button
              onClick={selectAllSources}
              className="text-xxs text-violet-400 hover:text-violet-300 transition"
            >
              {getFilteredSources().every(s => selectedSourceIds.includes(s._id)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Source List / Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {loadingSources ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <RefreshCw className="w-6 h-6 text-zinc-600 animate-spin" />
                <span className="text-xs text-zinc-500">Loading sources...</span>
              </div>
            ) : getFilteredSources().length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-zinc-900 rounded-2xl p-4 text-center">
                <BookOpen className="w-8 h-8 text-zinc-700 mb-2" />
                <span className="text-xs text-zinc-400 font-medium">No sources found</span>
                <span className="text-xxs text-zinc-500 mt-1">Upload files or documents to begin studying</span>
              </div>
            ) : sourceViewMode === 'list' ? (
              <div className="space-y-2">
                {getFilteredSources().map(source => {
                  const isChecked = selectedSourceIds.includes(source._id);
                  return (
                    <div
                      key={source._id}
                      onClick={(e) => toggleSourceSelection(source._id, e)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                        isChecked
                          ? 'bg-violet-950/15 border-violet-500/35 hover:bg-violet-950/20'
                          : 'bg-[#10131f] border-zinc-900 hover:bg-[#131726] hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-violet-500" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500" />
                          )}
                        </div>
                        <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg flex-shrink-0">
                          {getSourceIcon(source.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-white transition-colors">{source.title}</p>
                          <p className="text-xxs text-zinc-500 capitalize">{source.type}</p>
                        </div>
                      </div>

                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === source._id ? null : source._id);
                          }}
                          className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 rounded-md transition"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {activeMenuId === source._id && (
                          <div className="absolute right-0 mt-1 w-44 bg-[#141724] border border-zinc-800 rounded-xl py-1.5 shadow-xl z-20 text-xs text-zinc-300">
                            <button
                              onClick={() => { setPreviewSource(source); setActiveMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-violet-600 hover:text-white transition text-left"
                            >
                              <BookOpen className="w-3.5 h-3.5" /> Preview Split-Pane
                            </button>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setActiveMenuId(null)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-violet-600 hover:text-white transition text-left"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                            </a>
                            <div className="h-px bg-zinc-800/80 my-1" />
                            <button
                              onClick={(e) => { handleDeleteSource(source._id, e); setActiveMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-600 hover:text-white text-red-400 transition text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Source
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {getFilteredSources().map(source => {
                  const isChecked = selectedSourceIds.includes(source._id);
                  return (
                    <div
                      key={source._id}
                      onClick={(e) => toggleSourceSelection(source._id, e)}
                      className={`group relative p-3 rounded-2xl border flex flex-col justify-between h-28 cursor-pointer transition-all duration-200 ${
                        isChecked
                          ? 'bg-violet-950/15 border-violet-500/35 shadow-[0_0_15px_rgba(139,92,246,0.08)]'
                          : 'bg-[#10131f] border-zinc-900 hover:border-zinc-800 hover:bg-[#131726]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                          {getSourceIcon(source.type)}
                        </div>
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <div className="opacity-0 group-hover:opacity-100 transition duration-150">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === source._id ? null : source._id); }}
                              className="p-1 bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-md transition"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </button>
                          </div>
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-violet-500" />
                          ) : (
                            <div className="w-4 h-4 rounded border border-zinc-700 bg-[#090b11] group-hover:border-zinc-500" />
                          )}
                        </div>
                      </div>

                      {activeMenuId === source._id && (
                        <div className="absolute right-3 top-9 w-40 bg-[#141724] border border-zinc-800 rounded-xl py-1 shadow-2xl z-20 text-xxs text-zinc-300">
                          <button
                            onClick={() => { setPreviewSource(source); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-violet-600 hover:text-white transition text-left"
                          >
                            <BookOpen className="w-3 h-3" /> Preview Pane
                          </button>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setActiveMenuId(null)}
                            className="w-full flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-violet-600 hover:text-white transition text-left"
                          >
                            <ExternalLink className="w-3 h-3" /> New Tab
                          </a>
                          <div className="h-px bg-zinc-800 my-1" />
                          <button
                            onClick={(e) => { handleDeleteSource(source._id, e); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-red-600 text-red-400 hover:text-white transition text-left"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}

                      <div className="mt-2 min-w-0">
                        <p className="text-xxs font-medium text-zinc-200 truncate group-hover:text-white transition">{source.title}</p>
                        <p className="text-[10px] text-zinc-500 capitalize">{source.type}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ================= MIDDLE PANEL: CHAT INTERFACE ================= */}
        <section className="flex-1 flex flex-col bg-[#07090f] overflow-hidden relative">

          <div className="px-6 py-4 border-b border-zinc-900/50 bg-[#07090f]/75 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-zinc-200">AI Study Chat</h2>
            </div>
            <div className="text-xxs text-zinc-400 flex items-center gap-1">
              <span>Grounding status:</span>
              <span className={`px-1.5 py-0.5 rounded font-medium ${
                selectedSourceIds.length > 0 ? 'bg-violet-500/10 text-violet-400 border border-violet-500/15' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {selectedSourceIds.length > 0 ? `${selectedSourceIds.length} source(s) active` : 'No sources selected'}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
                <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-3xl mb-4 text-zinc-600">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-300">Ask your materials anything</h3>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  Upload study source files, check them in the list, and chat with AI to extract topics, outline guides, or run study tests.
                </p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2.5 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-semibold ${
                      msg.sender === 'user'
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-900 border border-zinc-800 text-violet-400 shadow-[0_2px_8px_rgba(139,92,246,0.08)]'
                    }`}>
                      {msg.sender === 'user' ? 'U' : <Sparkles className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm border ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white border-violet-500/30 rounded-tr-none'
                        : 'bg-[#10131f] text-zinc-200 border-zinc-900 rounded-tl-none whitespace-pre-wrap'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-zinc-900 border border-zinc-800 text-violet-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-[#10131f] border border-zinc-900 text-zinc-500 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="p-4 border-t border-zinc-900/50 bg-[#07090f]/75">
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2 bg-[#10131f] border border-zinc-900/80 rounded-2xl px-4 py-2 hover:border-zinc-800 focus-within:border-violet-500/50 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.05)] transition duration-200">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  selectedSourceIds.length > 0
                    ? `Ask a question about your ${selectedSourceIds.length} source(s)...`
                    : 'Select sources to chat'
                }
                className="flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder-zinc-500 py-1.5"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className={`p-2 rounded-xl transition duration-150 flex items-center justify-center ${
                  chatInput.trim()
                    ? 'bg-violet-600 text-white hover:bg-violet-700 active:scale-95'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* ================= SLIDING SPLIT-PANE PREVIEW DRAWER ================= */}
          {previewSource && (
            <div className="absolute top-0 right-0 h-full w-96 bg-[#0f121d] border-l border-zinc-900 shadow-2xl flex flex-col z-30 animate-in slide-in-from-right duration-200">
              <div className="p-4 border-b border-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 bg-zinc-900 border border-zinc-800 rounded">
                    {getSourceIcon(previewSource.type)}
                  </div>
                  <h3 className="text-xs font-semibold text-white truncate" title={previewSource.title}>
                    {previewSource.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewSource(null)}
                  className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 text-xs text-zinc-300 leading-relaxed font-sans custom-scrollbar select-text selection:bg-violet-600/30 selection:text-white">
                <div className="prose prose-invert max-w-none">
                  {previewSource.content ? (
                    previewSource.content.split('\n').map((line, idx) => {
                      if (line.startsWith('# ')) return <h1 key={idx} className="text-lg font-bold text-white mb-3 mt-1">{line.replace('# ', '')}</h1>;
                      if (line.startsWith('## ')) return <h2 key={idx} className="text-sm font-semibold text-zinc-100 mb-2 mt-4">{line.replace('## ', '')}</h2>;
                      if (line.match(/^\d+\.\s/)) return <div key={idx} className="pl-4 py-0.5 list-decimal text-zinc-300">{line}</div>;
                      if (line.startsWith('- ')) return <div key={idx} className="pl-4 py-0.5 list-disc text-zinc-300">{line}</div>;
                      if (!line.trim()) return <div key={idx} className="h-2" />;
                      return <p key={idx} className="mb-2.5 text-zinc-300">{line}</p>;
                    })
                  ) : (
                    <div className="text-center py-20 text-zinc-500">No content available for preview.</div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-zinc-900/50 bg-[#0b0e16]/80 flex gap-2">
                <a
                  href={previewSource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#141724] border border-zinc-800 hover:bg-[#191d2d] text-zinc-300 py-2 rounded-xl text-xxs font-semibold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                </a>
                <button
                  onClick={() => {
                    if (!selectedSourceIds.includes(previewSource._id)) {
                      setSelectedSourceIds([...selectedSourceIds, previewSource._id]);
                    }
                  }}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-xl text-xxs font-semibold transition"
                >
                  Ground Chat In This
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ================= RIGHT PANEL: STICKY NOTES WORKSPACE ================= */}
        <aside className="w-96 flex flex-col bg-[#0b0e16] border-l border-zinc-900/60 overflow-hidden">
          <div className="p-4 border-b border-zinc-900/40 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Notes Workspace</h2>
              <p className="text-xs text-zinc-400">{notes.length} notes saved</p>
            </div>
            <button
              onClick={openAddNoteModal}
              className="flex items-center gap-1 bg-violet-600/10 border border-violet-500/20 text-violet-300 hover:bg-violet-600/20 px-3 py-2 rounded-xl text-xs font-semibold transition duration-150"
            >
              <Plus className="w-3.5 h-3.5" /> Add Note
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loadingNotes ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <RefreshCw className="w-6 h-6 text-zinc-600 animate-spin" />
                <span className="text-xs text-zinc-500">Loading notes...</span>
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border border-dashed border-zinc-900 rounded-2xl p-6 text-center">
                <CheckSquare className="w-8 h-8 text-zinc-700 mb-2" />
                <span className="text-xs text-zinc-400 font-medium">Workspace is empty</span>
                <p className="text-xxs text-zinc-500 mt-1 leading-relaxed">
                  Create study notes, checklist items, or research bullets directly to structure your study plan.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {notes.map(note => {
                  let accentClass = 'border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.02)]';
                  let headerDotColor = 'bg-amber-400';
                  if (note.type === 'list') {
                    accentClass = 'border-sky-500/40 shadow-[0_4px_20px_rgba(14,165,233,0.02)]';
                    headerDotColor = 'bg-sky-400';
                  } else if (note.type === 'checklist') {
                    accentClass = 'border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.02)]';
                    headerDotColor = 'bg-emerald-400';
                  }

                  return (
                    <div
                      key={note._id}
                      onClick={(e) => openEditNoteModal(note, e)}
                      className={`group p-3.5 bg-[#111422] border-t-4 rounded-xl flex flex-col justify-between hover:bg-[#13182a] hover:scale-[1.01] hover:border-t-5 border-x border-b border-zinc-900/60 transition-all duration-200 cursor-pointer ${accentClass}`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${headerDotColor}`} />
                          <h3 className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                            {note.title || 'Untitled Note'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={(e) => openEditNoteModal(note, e)}
                            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition"
                            title="Edit Note"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteNote(note._id, e)}
                            className="p-1 hover:bg-red-950/20 hover:text-red-400 text-zinc-400 rounded transition"
                            title="Delete Note"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xxs text-zinc-400 flex-1 leading-relaxed selection:bg-none">
                        {note.type === 'text' && (
                          <p className="whitespace-pre-wrap">{note.content || 'Empty note content.'}</p>
                        )}
                        {note.type === 'list' && (
                          <ul className="space-y-1 pl-1">
                            {note.listContent?.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-violet-400/70 select-none">•</span>
                                <span className="truncate">{item}</span>
                              </li>
                            ))}
                            {(!note.listContent || note.listContent.length === 0) && (
                              <li className="text-zinc-600 italic">No list items.</li>
                            )}
                          </ul>
                        )}
                        {note.type === 'checklist' && (
                          <div className="space-y-1 pl-0.5">
                            {note.checklistContent?.map((item, idx) => (
                              <div
                                key={idx}
                                onClick={(e) => handleToggleChecklistCheckbox(note._id, idx, e)}
                                className="flex items-center gap-2 py-0.5 hover:bg-zinc-800/30 rounded px-1 transition duration-100"
                              >
                                <button className="focus:outline-none flex-shrink-0 text-emerald-400">
                                  {item.checked ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-zinc-700" />
                                  )}
                                </button>
                                <span className={`truncate ${item.checked ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                                  {item.text}
                                </span>
                              </div>
                            ))}
                            {(!note.checklistContent || note.checklistContent.length === 0) && (
                              <div className="text-zinc-600 italic">No checklist items.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ==========================================
          MODAL: ADD SOURCE
          ========================================== */}
      {showAddSourceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f121d] border border-zinc-800/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-zinc-900/60 flex items-center justify-between bg-[#0b0e16]">
              <h3 className="text-sm font-semibold text-white">Add Study Source</h3>
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSource} className="p-5 space-y-4">
              <div>
                <label className="block text-xxs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Source Type</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['pdf', 'doc', 'audio', 'video', 'url'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewSourceType(type)}
                      className={`py-2 rounded-xl text-[10px] font-semibold uppercase border transition flex flex-col items-center justify-center gap-1 ${
                        newSourceType === type
                          ? 'bg-violet-600/10 border-violet-500 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.1)]'
                          : 'bg-[#121624] border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      {getSourceIcon(type)}
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xxs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Title / Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Textbook Chapter 1"
                  value={newSourceTitle}
                  onChange={(e) => setNewSourceTitle(e.target.value)}
                  className="w-full bg-[#121624] border border-zinc-900 focus:border-violet-500/50 outline-none text-xs rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-600 transition"
                />
              </div>

              <div>
                <label className="block text-xxs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Reference URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/materials/quantum.pdf"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  className="w-full bg-[#121624] border border-zinc-900 focus:border-violet-500/50 outline-none text-xs rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-600 transition"
                />
              </div>

              <div>
                <label className="block text-xxs font-medium text-zinc-400 mb-1 uppercase tracking-wider">
                  Text Contents (Optional - For Split-Pane Preview)
                </label>
                <textarea
                  placeholder="Write or paste the source text here..."
                  rows={4}
                  value={newSourceContent}
                  onChange={(e) => setNewSourceContent(e.target.value)}
                  className="w-full bg-[#121624] border border-zinc-900 focus:border-violet-500/50 outline-none text-xs rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-600 transition resize-none custom-scrollbar"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setShowAddSourceModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-transparent text-zinc-400 hover:text-zinc-200 text-xs rounded-xl transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-xl transition font-semibold"
                >
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ADD / EDIT STICKY NOTE
          ========================================== */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f121d] border border-zinc-800/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-zinc-900/60 flex items-center justify-between bg-[#0b0e16]">
              <h3 className="text-sm font-semibold text-white">
                {editingNote ? 'Edit Study Note' : 'Add Note to Workspace'}
              </h3>
              <button
                onClick={() => { setShowNoteModal(false); setEditingNote(null); }}
                className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-5 space-y-4">
              <div>
                <label className="block text-xxs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Note Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'text', label: 'Standard Text', color: 'text-amber-400' },
                    { id: 'list', label: 'Bullet List', color: 'text-sky-400' },
                    { id: 'checklist', label: 'Checklist', color: 'text-emerald-400' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={editingNote !== null}
                      onClick={() => setNoteFormType(opt.id as any)}
                      className={`py-2 px-1.5 rounded-xl border text-[10px] font-semibold text-center capitalize transition ${
                        editingNote !== null ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        noteFormType === opt.id
                          ? 'bg-violet-600/10 border-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.1)]'
                          : 'bg-[#121624] border-zinc-900 text-zinc-500 hover:border-zinc-800'
                      }`}
                    >
                      <span className={`inline-block mr-1 font-bold ${opt.color}`}>•</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xxs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Heading / Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Equations reference"
                  value={noteFormTitle}
                  onChange={(e) => setNoteFormTitle(e.target.value)}
                  className="w-full bg-[#121624] border border-zinc-900 focus:border-violet-500/50 outline-none text-xs rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-600 transition"
                />
              </div>

              {noteFormType === 'text' && (
                <div>
                  <label className="block text-xxs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Note Content</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Write your study note detail..."
                    value={noteFormTextContent}
                    onChange={(e) => setNoteFormTextContent(e.target.value)}
                    className="w-full bg-[#121624] border border-zinc-900 focus:border-violet-500/50 outline-none text-xs rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-600 transition resize-none custom-scrollbar"
                  />
                </div>
              )}

              {noteFormType === 'list' && (
                <div className="space-y-2">
                  <label className="block text-xxs font-medium text-zinc-400 mb-1 uppercase tracking-wider flex justify-between items-center">
                    <span>List Bullet Points</span>
                    <button type="button" onClick={handleAddListRow} className="text-xxs text-violet-400 hover:text-violet-300 font-semibold">
                      + Add Bullet
                    </button>
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {noteFormListItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-zinc-600 font-bold">•</span>
                        <input
                          type="text"
                          required
                          value={item}
                          placeholder={`Bullet item #${idx + 1}`}
                          onChange={(e) => handleListRowChange(idx, e.target.value)}
                          className="flex-1 bg-[#121624] border border-zinc-900 focus:border-violet-500/50 outline-none text-xs rounded-xl px-3 py-1.5 text-zinc-100 placeholder-zinc-600"
                        />
                        <button type="button" onClick={() => handleRemoveListRow(idx)} className="p-1 text-zinc-600 hover:text-red-400 rounded-md transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {noteFormType === 'checklist' && (
                <div className="space-y-2">
                  <label className="block text-xxs font-medium text-zinc-400 mb-1 uppercase tracking-wider flex justify-between items-center">
                    <span>Checklist Items</span>
                    <button type="button" onClick={handleAddChecklistRow} className="text-xxs text-violet-400 hover:text-violet-300 font-semibold">
                      + Add Check Item
                    </button>
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {noteFormChecklistItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => handleChecklistRowChange(idx, { checked: e.target.checked })}
                          className="w-3.5 h-3.5 accent-violet-600 border-zinc-700 bg-zinc-900 rounded"
                        />
                        <input
                          type="text"
                          required
                          value={item.text}
                          placeholder={`Checklist item #${idx + 1}`}
                          onChange={(e) => handleChecklistRowChange(idx, { text: e.target.value })}
                          className="flex-1 bg-[#121624] border border-zinc-900 focus:border-violet-500/50 outline-none text-xs rounded-xl px-3 py-1.5 text-zinc-100 placeholder-zinc-600"
                        />
                        <button type="button" onClick={() => handleRemoveChecklistRow(idx)} className="p-1 text-zinc-600 hover:text-red-400 rounded-md transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => { setShowNoteModal(false); setEditingNote(null); }}
                  className="px-4 py-2 border border-zinc-800 bg-transparent text-zinc-400 hover:text-zinc-200 text-xs rounded-xl transition font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-xl transition font-semibold">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// HOME PAGE — Study Space Card Gallery
// ==========================================
function HomePage({ onOpenSpace }: { onOpenSpace: (space: StudySpace) => void }) {
  const [spaces, setSpaces] = useState<StudySpace[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDesc, setNewSpaceDesc] = useState('');
  const [newSpaceEmoji, setNewSpaceEmoji] = useState('📚');
  const [newSpaceColorIdx, setNewSpaceColorIdx] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const EMOJI_OPTIONS = ['📚', '🧪', '💻', '🧠', '🎯', '🌍', '🔬', '📐', '🎨', '🏛️', '📊', '🚀'];

  useEffect(() => {
    const saved = localStorage.getItem('lg_spaces');
    if (saved) {
      setSpaces(JSON.parse(saved));
    } else {
      setSpaces(DEFAULT_SPACES);
      localStorage.setItem('lg_spaces', JSON.stringify(DEFAULT_SPACES));
    }
  }, []);

  const saveSpaces = (updated: StudySpace[]) => {
    setSpaces(updated);
    localStorage.setItem('lg_spaces', JSON.stringify(updated));
  };

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    const newSpace: StudySpace = {
      id: `space-${Date.now()}`,
      name: newSpaceName.trim(),
      description: newSpaceDesc.trim() || 'A new study space for organized learning.',
      emoji: newSpaceEmoji,
      color: SPACE_COLORS[newSpaceColorIdx].bg,
      createdAt: new Date().toISOString(),
    };
    saveSpaces([...spaces, newSpace]);
    setNewSpaceName('');
    setNewSpaceDesc('');
    setNewSpaceEmoji('📚');
    setNewSpaceColorIdx(0);
    setShowCreateModal(false);
  };

  const handleOpenSpace = (space: StudySpace) => {
    // Update last opened
    const updated = spaces.map(s =>
      s.id === space.id ? { ...s, lastOpened: new Date().toISOString() } : s
    );
    saveSpaces(updated);
    onOpenSpace(space);
  };

  const handleDeleteSpace = (id: string) => {
    saveSpaces(spaces.filter(s => s.id !== id));
    setDeleteConfirmId(null);
    // Also clean up localStorage
    localStorage.removeItem(`lg_sources_${id}`);
    localStorage.removeItem(`lg_notes_${id}`);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen w-screen bg-[#090b11] text-zinc-100 font-sans antialiased overflow-x-hidden">
      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-30 border-b border-zinc-900/70 bg-[#090b11]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#090b11]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                Lets<span className="text-violet-400">Geek</span>
              </h1>
              <p className="text-[10px] text-zinc-500 -mt-0.5 tracking-wide">AI Study Platform</p>
            </div>
          </div>

          {/* Right Nav */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{spaces.length} space{spaces.length !== 1 ? 's' : ''}</span>
            </div>
            <button
              id="create-space-btn"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition duration-150 shadow-[0_4px_16px_rgba(109,40,217,0.35)]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Space</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-8">
        <div className="flex flex-col items-start gap-4 mb-12">
          {/* Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered learning workspace
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Your Study<br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Spaces
            </span>
          </h2>
          <p className="text-zinc-400 text-base max-w-xl leading-relaxed">
            Organize your learning into focused spaces. Each space has its own sources, notes, and AI chat — perfectly segmented for every subject or project.
          </p>
        </div>

        {/* ================= SPACES GRID ================= */}
        {spaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-800 rounded-3xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mb-4 text-3xl">
              📭
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-1">No study spaces yet</h3>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
              Create your first space to start organizing your study materials, notes, and AI conversations.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-[0_4px_16px_rgba(109,40,217,0.35)]"
            >
              <Plus className="w-4 h-4" /> Create First Space
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* Create New Card */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-200 text-zinc-500 hover:text-violet-400 min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">New Study Space</p>
                <p className="text-xs mt-0.5 text-zinc-600 group-hover:text-violet-500/60 transition-colors">Create a focused environment</p>
              </div>
            </button>

            {/* Space Cards */}
            {spaces.map(space => {
              const colorConfig = SPACE_COLORS.find(c => c.bg === space.color) || SPACE_COLORS[0];
              const srcCount = (() => {
                try {
                  const data = localStorage.getItem(`lg_sources_${space.id}`);
                  return data ? JSON.parse(data).length : 3;
                } catch { return 0; }
              })();
              const noteCount = (() => {
                try {
                  const data = localStorage.getItem(`lg_notes_${space.id}`);
                  return data ? JSON.parse(data).length : 3;
                } catch { return 0; }
              })();

              return (
                <div
                  key={space.id}
                  className="group relative rounded-2xl bg-[#0e1118] border border-zinc-800/60 hover:border-zinc-700/80 overflow-hidden transition-all duration-250 hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 cursor-pointer flex flex-col min-h-[220px]"
                  onClick={() => handleOpenSpace(space)}
                >
                  {/* Card gradient header */}
                  <div className={`h-24 bg-gradient-to-br ${space.color} relative overflow-hidden flex-shrink-0`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_70%)]" />
                    {/* Emoji */}
                    <div className="absolute bottom-3 left-4 text-4xl select-none drop-shadow-lg">
                      {space.emoji}
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(space.id); }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 bg-black/30 hover:bg-red-600/80 text-white/70 hover:text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150"
                      title="Delete space"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-violet-200 transition-colors truncate mb-1">
                      {space.name}
                    </h3>
                    <p className="text-xxs text-zinc-500 leading-relaxed line-clamp-2 flex-1">
                      {space.description}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-800/60">
                      <div className="flex items-center gap-1 text-zinc-500 text-[10px]">
                        <BookMarked className="w-3 h-3" />
                        <span>{srcCount} sources</span>
                      </div>
                      <div className="flex items-center gap-1 text-zinc-500 text-[10px]">
                        <FileText className="w-3 h-3" />
                        <span>{noteCount} notes</span>
                      </div>
                      {space.lastOpened && (
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px] ml-auto">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(space.lastOpened)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Open button shimmer on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-gradient-to-t from-violet-600/5 to-transparent" />
                </div>
              );
            })}
          </div>
        )}

        {/* ================= BOTTOM STATS ================= */}
        {spaces.length > 0 && (
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg">
            {[
              { label: 'Study Spaces', value: spaces.length, icon: <LayoutGrid className="w-4 h-4" />, color: 'text-violet-400' },
              { label: 'Last Active', value: formatDate(spaces.slice().sort((a, b) => (b.lastOpened || '').localeCompare(a.lastOpened || ''))[0]?.lastOpened), icon: <Clock className="w-4 h-4" />, color: 'text-blue-400' },
              { label: 'Created', value: formatDate(spaces[0]?.createdAt), icon: <Calendar className="w-4 h-4" />, color: 'text-emerald-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#0e1118] border border-zinc-800/60 rounded-xl p-3.5">
                <div className={`${stat.color} mb-1.5`}>{stat.icon}</div>
                <p className="text-white font-bold text-sm">{stat.value}</p>
                <p className="text-zinc-500 text-[10px] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL: CREATE NEW STUDY SPACE
          ========================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e1118] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-zinc-800/60 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Create Study Space</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Set up a new focused learning environment</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="p-6 space-y-5">
              {/* Emoji selector */}
              <div>
                <label className="block text-xxs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Space Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewSpaceEmoji(emoji)}
                      className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center border transition-all duration-150 ${
                        newSpaceEmoji === emoji
                          ? 'bg-violet-600/20 border-violet-500 scale-110 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xxs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Color Theme
                </label>
                <div className="flex gap-2">
                  {SPACE_COLORS.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewSpaceColorIdx(idx)}
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.bg} transition-all duration-150 ${
                        newSpaceColorIdx === idx
                          ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-[#0e1118] scale-110'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xxs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Space Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Machine Learning Research"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] outline-none text-sm rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-600 transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xxs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What will you be studying in this space?"
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-violet-500/60 outline-none text-sm rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-600 transition resize-none"
                />
              </div>

              {/* Preview card */}
              <div>
                <label className="block text-xxs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Preview</label>
                <div className="rounded-xl overflow-hidden border border-zinc-800 w-48">
                  <div className={`h-16 bg-gradient-to-br ${SPACE_COLORS[newSpaceColorIdx].bg} relative flex items-end p-2`}>
                    <span className="text-2xl">{newSpaceEmoji}</span>
                  </div>
                  <div className="p-2.5 bg-[#0e1118]">
                    <p className="text-xs font-bold text-white truncate">{newSpaceName || 'Space Name'}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{newSpaceDesc || 'Description...'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-transparent text-zinc-400 hover:text-zinc-200 text-sm rounded-xl transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition font-semibold shadow-[0_4px_14px_rgba(109,40,217,0.3)]"
                >
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: DELETE CONFIRM
          ========================================== */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e1118] border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Delete Study Space?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                All sources and notes for "<span className="text-zinc-200 font-medium">{spaces.find(s => s.id === deleteConfirmId)?.name}</span>" stored locally will be permanently deleted. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 border border-zinc-800 bg-transparent text-zinc-400 hover:text-zinc-200 text-sm rounded-xl transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSpace(deleteConfirmId)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-xl transition font-semibold"
              >
                Delete Space
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ROOT APP — Router
// ==========================================
export default function App() {
  const [activeSpace, setActiveSpace] = useState<StudySpace | null>(null);

  if (activeSpace) {
    return (
      <StudySpaceWorkspace
        space={activeSpace}
        onBack={() => setActiveSpace(null)}
      />
    );
  }

  return <HomePage onOpenSpace={setActiveSpace} />;
}
