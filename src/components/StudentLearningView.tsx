import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Camera,
  BookOpen,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Send,
  Loader2,
  Plus,
  Tag,
  RotateCw,
  X,
  FileCode,
  Calculator,
  Terminal,
  Search,
  Globe,
  GraduationCap,
  Volume2,
  VolumeX,
  Copy,
  Check,
  BookmarkPlus,
  Mic,
  MicOff,
  Filter,
  Layers,
  ChevronRight,
  BookCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { FlashcardItem, StudyNoteItem } from '../types/index.ts';
import { ALL_STUDENT_SUBJECTS, StudentSubject } from '../data/studentSubjects.ts';
import { PHYSICS_SI_UNITS, PHYSICAL_CONSTANTS, PhysicsSiUnit, PhysicalConstant } from '../data/physicsSiUnits.ts';
import { removeDollarSigns, cleanFormulaSnippet } from '../utils/mathSanitizer.ts';

export const StudentLearningView: React.FC = () => {
  const { idToken } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'solver' | 'units' | 'notes' | 'flashcards'>('solver');

  // Sanitized SI Units & Constants through universal formula & currency filter
  const sanitizedUnits = useMemo<PhysicsSiUnit[]>(() => {
    return PHYSICS_SI_UNITS.map((u) => ({
      ...u,
      name: removeDollarSigns(u.name),
      urduName: removeDollarSigns(u.urduName),
      symbol: removeDollarSigns(u.symbol),
      quantity: removeDollarSigns(u.quantity),
      urduQuantity: removeDollarSigns(u.urduQuantity),
      formula: cleanFormulaSnippet(u.formula),
      dimension: cleanFormulaSnippet(u.dimension),
      baseUnitsEquivalent: cleanFormulaSnippet(u.baseUnitsEquivalent),
      description: removeDollarSigns(u.description),
      urduDescription: removeDollarSigns(u.urduDescription),
      commonConversions: removeDollarSigns(u.commonConversions),
    }));
  }, []);

  const sanitizedConstants = useMemo<PhysicalConstant[]>(() => {
    return PHYSICAL_CONSTANTS.map((c) => ({
      ...c,
      name: removeDollarSigns(c.name),
      urduName: removeDollarSigns(c.urduName),
      symbol: removeDollarSigns(c.symbol),
      value: removeDollarSigns(c.value),
      siUnit: cleanFormulaSnippet(c.siUnit),
      description: removeDollarSigns(c.description),
    }));
  }, []);

  // SI Units Explorer State
  const [siSearchQuery, setSiSearchQuery] = useState('');
  const [siCategoryFilter, setSiCategoryFilter] = useState<'all' | 'base' | 'derived_mechanics' | 'derived_electromagnetism' | 'derived_thermo_optics' | 'derived_nuclear' | 'constants'>('all');
  const [copiedUnitSymbol, setCopiedUnitSymbol] = useState<string | null>(null);

  // SI Converter State
  const [converterType, setConverterType] = useState<'energy' | 'pressure' | 'temp' | 'power' | 'force'>('energy');
  const [converterInput, setConverterInput] = useState<number>(1);

  // Filters for Subjects Directory
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'matric' | 'inter' | 'university' | 'phd'>('all');
  const [selectedMedium, setSelectedMedium] = useState<'all' | 'english' | 'urdu'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Subject State
  const [currentSubjectId, setCurrentSubjectId] = useState<string>('matric_physics');

  // Solver Input State
  const [questionText, setQuestionText] = useState('');
  const [solverImage, setSolverImage] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);
  const [solverError, setSolverError] = useState<string | null>(null);

  // Audio / Speech / Interaction states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedAsNote, setSavedAsNote] = useState(false);

  // Notes State
  const [notes, setNotes] = useState<StudyNoteItem[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Flashcards State
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Active Subject object
  const activeSubject = useMemo(() => {
    return ALL_STUDENT_SUBJECTS.find((s) => s.id === currentSubjectId) || ALL_STUDENT_SUBJECTS[0];
  }, [currentSubjectId]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    ALL_STUDENT_SUBJECTS.forEach((s) => set.add(s.category));
    return ['All', ...Array.from(set)];
  }, []);

  // Filtered subjects list
  const filteredSubjects = useMemo(() => {
    return ALL_STUDENT_SUBJECTS.filter((sub) => {
      // Level filter
      if (selectedLevel !== 'all' && sub.level !== selectedLevel && sub.level !== 'all') {
        return false;
      }
      // Medium filter
      if (selectedMedium !== 'all' && !sub.mediums.includes(selectedMedium)) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'All' && sub.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = sub.name.toLowerCase().includes(q);
        const matchesUrdu = sub.urduName.includes(searchQuery);
        const matchesDesc = sub.description.toLowerCase().includes(q);
        const matchesCat = sub.category.toLowerCase().includes(q);
        return matchesName || matchesUrdu || matchesDesc || matchesCat;
      }
      return true;
    });
  }, [selectedLevel, selectedMedium, selectedCategory, searchQuery]);

  // Fetch initial notes and flashcards
  useEffect(() => {
    fetchNotes();
    fetchFlashcards();

    // Setup speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedMedium === 'urdu' ? 'ur-PK' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuestionText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      speechRecognitionRef.current = recognition;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [idToken, selectedMedium]);

  const toggleVoice = () => {
    if (!speechRecognitionRef.current) {
      setSolverError('Speech recognition is not supported in this browser. Please type your query or attach an image.');
      return;
    }
    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      speechRecognitionRef.current.lang = selectedMedium === 'urdu' ? 'ur-PK' : 'en-US';
      speechRecognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleSpeechPlayback = () => {
    if (!solution || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanSpeechText = removeDollarSigns(solution);
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = selectedMedium === 'urdu' ? 'ur' : 'en-US';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleCopySolution = () => {
    if (!solution) return;
    navigator.clipboard.writeText(removeDollarSigns(solution));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSolutionAsNote = async () => {
    if (!solution) return;
    setSavingNote(true);
    try {
      const cleanNoteContent = removeDollarSigns(solution);
      const res = await fetch('/api/student/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          title: `${activeSubject.name}: ${questionText ? removeDollarSigns(questionText).slice(0, 50) : 'Problem Walkthrough'}...`,
          content: cleanNoteContent,
          tags: `${activeSubject.category}, ${activeSubject.levelLabel}`,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setNotes([created, ...notes]);
        setSavedAsNote(true);
        setTimeout(() => setSavedAsNote(false), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/student/notes', {
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFlashcards = async () => {
    try {
      const res = await fetch('/api/student/flashcards', {
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSolverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => setSolverImage(reader.result as string);
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleSolve = async () => {
    if (!questionText.trim() && !solverImage) return;

    setSolving(true);
    setSolverError(null);
    setSolution(null);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    try {
      const res = await fetch('/api/student/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          questionText,
          imageUrl: solverImage,
          subject: `${activeSubject.name} (${activeSubject.urduName})`,
          academicLevel: activeSubject.level,
          medium: selectedMedium === 'all' ? (activeSubject.mediums.includes('urdu') ? 'both' : 'english') : selectedMedium,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to solve problem');
      }

      setSolution(removeDollarSigns(data.solution));
    } catch (err: any) {
      setSolverError(err.message || 'Error occurred while solving');
    } finally {
      setSolving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch('/api/student/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          title: newNoteTitle,
          content: newNoteContent,
          tags: newNoteTag || activeSubject.category,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setNotes([created, ...notes]);
        setNewNoteTitle('');
        setNewNoteContent('');
        setNewNoteTag('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  const handleCreateFlashcard = async () => {
    if (!newCardFront.trim() || !newCardBack.trim()) return;
    try {
      const res = await fetch('/api/student/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          deckName: `${activeSubject.name} (${activeSubject.levelLabel})`,
          front: newCardFront,
          back: newCardBack,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setFlashcards([created, ...flashcards]);
        setNewCardFront('');
        setNewCardBack('');
        setShowAddCard(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" onPaste={handlePaste}>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Global & Pakistani Academic Learning Hub
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
              9th Class to PhD (English & Urdu Medium)
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Concept-first pedagogical solver covering all Pakistani boards (Matric/FSc/ICS/I.Com) & global curricula (O/A-Levels, BS, MS, PhD research).
          </p>
        </div>

        {/* Sub-nav tabs */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs shrink-0 flex-wrap gap-1">
          <button
            onClick={() => setActiveSubTab('solver')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeSubTab === 'solver'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Problem & Concept Solver</span>
          </button>
          <button
            onClick={() => setActiveSubTab('units')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeSubTab === 'units'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="h-3.5 w-3.5 text-cyan-400" />
            <span>⚡ Physics SI Units (All World)</span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300">
              100% Free
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeSubTab === 'flashcards'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Flashcards ({flashcards.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeSubTab === 'notes'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Study Notes ({notes.length})</span>
          </button>
        </div>
      </div>

      {/* Main Solver Tab */}
      {activeSubTab === 'solver' && (
        <div className="space-y-6">
          {/* Level & Medium Filter Panel */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4 shadow-xl">
            {/* Row 1: Academic Level Selector */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  Academic Level:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {[
                    { id: 'all', label: '🎓 All Levels (تمام درجات)' },
                    { id: 'matric', label: '🎒 9th-10th Class (Matric / میٹرک)' },
                    { id: 'inter', label: '🔬 11th-12th Class (Inter / FSc / ICS)' },
                    { id: 'university', label: '🏛️ University (BS / MS / Engineering / MBBS)' },
                    { id: 'phd', label: '📜 Doctoral & Research (PhD / MPhil)' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedLevel(lvl.id as any)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        selectedLevel === lvl.id
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 1 Right: Medium Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <Globe className="h-3.5 w-3.5 text-emerald-400" />
                  Instruction Medium:
                </span>
                <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-0.5 text-xs">
                  {[
                    { id: 'all', label: '🌐 All Mediums' },
                    { id: 'english', label: '🇬🇧 English Medium' },
                    { id: 'urdu', label: '🇵🇰 اردو میڈیم (Urdu)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMedium(m.id as any)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        selectedMedium === m.id
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Search & Category filter */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2 border-t border-slate-800/80">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search subject or concept in English or اردو (e.g. Physics, کیمسٹری, Calculus, لینیئر الجبرا, RAAS, PhD)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-semibold text-slate-400 shrink-0">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Horizontal Subject Carousel / Quick-Select Cards */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">
                  Select Subject ({filteredSubjects.length} available):
                </span>
                <span className="text-slate-500 font-mono">
                  Active: <strong className="text-cyan-400">{activeSubject.name}</strong>
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                {filteredSubjects.map((sub) => {
                  const isSelected = sub.id === currentSubjectId;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setCurrentSubjectId(sub.id)}
                      className={`flex flex-col text-left p-2.5 rounded-xl border transition min-w-[200px] max-w-[240px] shrink-0 ${
                        isSelected
                          ? 'border-cyan-500 bg-gradient-to-b from-cyan-950/60 to-slate-950 text-white shadow-md shadow-cyan-500/20'
                          : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 truncate">
                          {sub.levelLabel.split(' ')[0]}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                          {sub.mediums.includes('urdu') ? 'EN + UR' : 'EN'}
                        </span>
                      </div>
                      <span className="text-xs font-bold truncate text-slate-100">{sub.name}</span>
                      <span className="text-[11px] text-slate-400 truncate font-sans">{sub.urduName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Subject Banner & Quick Sample Questions */}
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/30 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <BookCheck className="h-4 w-4 text-cyan-400" />
                    <span>{activeSubject.name}</span>
                    <span className="text-slate-400 font-normal">| {activeSubject.urduName}</span>
                  </h3>
                  <span className="rounded-md bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 text-[10px] text-indigo-300 font-semibold">
                    {activeSubject.levelLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{activeSubject.description}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Target Persona:</span>
                <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] text-emerald-300 font-medium">
                  {activeSubject.level === 'matric'
                    ? 'Secondary Educator (9th-10th)'
                    : activeSubject.level === 'inter'
                    ? 'Collegiate Lecturer (FSc/ICS)'
                    : activeSubject.level === 'university'
                    ? 'Discipline Authority (BS/MS)'
                    : activeSubject.level === 'phd'
                    ? 'Doctoral Investigator (PhD)'
                    : 'Universal Academic'}
                </span>
              </div>
            </div>

            {/* Quick-Tap Sample Questions */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Quick Tap:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                {activeSubject.sampleQuestions.map((sq, i) => (
                  <React.Fragment key={i}>
                    {/* English question tap */}
                    <button
                      type="button"
                      onClick={() => setQuestionText(sq.en)}
                      className="rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white hover:border-cyan-500 transition whitespace-nowrap"
                    >
                      🇬🇧 {sq.en.slice(0, 45)}...
                    </button>
                    {/* Urdu question tap */}
                    <button
                      type="button"
                      onClick={() => setQuestionText(sq.ur)}
                      className="rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white hover:border-cyan-500 transition whitespace-nowrap font-sans"
                    >
                      🇵🇰 {sq.ur.slice(0, 40)}...
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Solver Workspace: Input & Solution Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Input Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Camera className="h-4 w-4 text-cyan-400" />
                    <span>Upload Problem or Enter Query</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Ctrl+V to paste screenshot
                  </span>
                </div>

                {/* Camera / Image Preview Area */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageCapture}
                    className="hidden"
                  />

                  {solverImage ? (
                    <div className="relative rounded-xl border border-indigo-500/40 overflow-hidden bg-slate-950">
                      <img
                        src={solverImage}
                        alt="Uploaded problem"
                        className="max-h-56 w-full object-contain"
                      />
                      <button
                        onClick={() => setSolverImage(null)}
                        className="absolute top-2 right-2 rounded-lg bg-slate-900/80 p-1.5 text-white hover:bg-rose-600 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/50 p-6 text-center cursor-pointer hover:border-indigo-500/60 transition group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition">
                        <Camera className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 mt-2">
                        Click to take photo, select file or paste image (Ctrl+V)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Textbook problems, board exam papers, derivations, diagrams, code errors
                      </p>
                    </div>
                  )}
                </div>

                {/* Question Text with Voice Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Specific Question or Topic
                    </label>
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-3 w-3" />
                          <span>Listening...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3 w-3 text-cyan-400" />
                          <span>Voice Ask</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder={
                      selectedMedium === 'urdu'
                        ? 'اپنا سوال یا موضوع یہاں لکھیں (مثال: نیوٹن کے دوسرے قانون کا ریاضیاتی ثبوت یا کیمسٹری کا سوال)...'
                        : `Enter your question, mathematical equation, or research topic in ${activeSubject.name}...`
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>

                {solverError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                    {solverError}
                  </div>
                )}

                <button
                  onClick={handleSolve}
                  disabled={solving || (!questionText.trim() && !solverImage)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 p-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-cyan-500 hover:to-purple-500 transition disabled:opacity-40"
                >
                  {solving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Formulating Concept-First Pedagogical Solution...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-cyan-300" />
                      <span>Solve Conceptually with Gemini AI ({activeSubject.levelLabel.split(' ')[0]})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Solution Column */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 min-h-[480px] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Concept-First Pedagogical Walkthrough</h3>
                      <p className="text-[10px] text-slate-400">
                        {activeSubject.name} • {selectedMedium === 'urdu' ? 'Urdu Medium' : 'English Medium'}
                      </p>
                    </div>
                  </div>

                  {solution && (
                    <div className="flex items-center gap-1.5">
                      {/* Listen Button */}
                      <button
                        onClick={toggleSpeechPlayback}
                        title="Listen to solution"
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                          isSpeaking
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                        <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                      </button>

                      {/* Copy Button */}
                      <button
                        onClick={handleCopySolution}
                        title="Copy solution text"
                        className="flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white transition"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      {/* Save to Notes Button */}
                      <button
                        onClick={handleSaveSolutionAsNote}
                        disabled={savingNote}
                        title="Save to Study Notes"
                        className="flex items-center gap-1 rounded-lg bg-indigo-600/80 border border-indigo-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-600 transition"
                      >
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        <span>{savedAsNote ? 'Saved!' : 'Save Note'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {solution ? (
                  <div className="flex-1 overflow-y-auto text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 whitespace-pre-wrap font-sans selection:bg-cyan-500 selection:text-slate-950">
                    {removeDollarSigns(solution)}
                  </div>
                ) : solving ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    <p className="text-xs font-semibold text-slate-300">
                      Analyzing problem in {activeSubject.name}...
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm">
                      Formulating conceptual anchor, governing laws, step-by-step mathematical working, and exam synthesis.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 text-slate-500">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400">
                      <Calculator className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-300">Ready to Solve Any Academic Problem</h4>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-md">
                        Select any Pakistani or international subject from the top bar (9th class to PhD). Upload a photo of homework, paste a diagram, or type your question.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SI Units & Physical Constants Tab */}
      {activeSubTab === 'units' && (
        <div className="space-y-6">
          {/* Header & Free Access Banner */}
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-indigo-950/40 p-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Calculator className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    All World Physics SI Units & Physical Constants
                  </h2>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                    100% مفت علمی رسائی • بغیر کسی فیس کے • Free Education
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Comprehensive reference for all 7 Base SI Units, Supplementary & Derived Units (Mechanics, Electricity, Optics, Nuclear), and Universal Constants with dimensions, formulas, and Urdu explanations.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2 text-xs text-slate-300 shrink-0">
                <span className="text-[11px] font-mono text-cyan-400">Total Units: {PHYSICS_SI_UNITS.length}</span>
                <span className="text-slate-600">|</span>
                <span className="text-[11px] font-mono text-amber-400">Constants: {PHYSICAL_CONSTANTS.length}</span>
                <span className="text-slate-600">|</span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Formula Filter: Active (Zero '$')
                </span>
              </div>
            </div>

            {/* Quick Interactive Converter Box */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  Live SI Unit Quick Converter (لائیو یونٹ کنورٹر):
                </span>
                <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs">
                  {[
                    { id: 'energy', label: 'Energy (جول / eV)' },
                    { id: 'pressure', label: 'Pressure (پاسکل / atm)' },
                    { id: 'temp', label: 'Temp (کیلون / °C)' },
                    { id: 'power', label: 'Power (واٹ / hp)' },
                    { id: 'force', label: 'Force (نیوٹن / dynes)' },
                  ].map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setConverterType(conv.id as any)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                        converterType === conv.id
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {conv.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Converter Display Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-3 flex items-center gap-2">
                  <label className="text-[11px] text-slate-400 font-medium">Input Value:</label>
                  <input
                    type="number"
                    value={converterInput}
                    onChange={(e) => setConverterInput(parseFloat(e.target.value) || 0)}
                    className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white font-mono"
                  />
                </div>

                <div className="md:col-span-9 flex flex-wrap items-center gap-2 text-slate-200">
                  {converterType === 'energy' && (
                    <>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-cyan-300">
                        {converterInput} Joules (J)
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-amber-300">
                        {(converterInput * 6.242e18).toExponential(3)} eV (Electron-volts)
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-emerald-300">
                        {(converterInput * 0.239006).toFixed(4)} Calories (cal)
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-purple-300">
                        {(converterInput / 3.6e6).toExponential(4)} kWh
                      </span>
                    </>
                  )}

                  {converterType === 'pressure' && (
                    <>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-cyan-300">
                        {converterInput} Pascals (Pa / N·m⁻²)
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-amber-300">
                        {(converterInput / 101325).toFixed(5)} atm
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-emerald-300">
                        {(converterInput / 1e5).toFixed(5)} bar
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-purple-300">
                        {(converterInput * 0.00750062).toFixed(3)} mmHg (torr)
                      </span>
                    </>
                  )}

                  {converterType === 'temp' && (
                    <>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-cyan-300">
                        {converterInput} °Celsius (°C)
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-amber-300">
                        {(converterInput + 273.15).toFixed(2)} Kelvin (K - SI Unit)
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-emerald-300">
                        {((converterInput * 9) / 5 + 32).toFixed(2)} °Fahrenheit (°F)
                      </span>
                    </>
                  )}

                  {converterType === 'power' && (
                    <>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-cyan-300">
                        {converterInput} Watts (W = J/s)
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-amber-300">
                        {(converterInput / 746).toFixed(4)} Horsepower (hp)
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-emerald-300">
                        {(converterInput / 1000).toFixed(3)} kW
                      </span>
                    </>
                  )}

                  {converterType === 'force' && (
                    <>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-cyan-300">
                        {converterInput} Newtons (N = kg·m/s²)
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-amber-300">
                        {(converterInput * 1e5).toLocaleString()} dynes
                      </span>
                      <span className="text-slate-500">=</span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-emerald-300">
                        {(converterInput * 0.224809).toFixed(4)} lbf (Pound-force)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search SI unit, symbol, formula, or dimension (e.g. Newton, جول, N·m, [M L T⁻²], Farad, Pascal)..."
                value={siSearchQuery}
                onChange={(e) => setSiSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
              />
              {siSearchQuery && (
                <button
                  onClick={() => setSiSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'all', label: 'All Units (تمام)' },
                { id: 'base', label: '7 Base Units (بنیادی)' },
                { id: 'derived_mechanics', label: 'Mechanics (میکانیات)' },
                { id: 'derived_electromagnetism', label: 'Electricity (برقیات)' },
                { id: 'derived_thermo_optics', label: 'Thermo & Optics (حرارت و نور)' },
                { id: 'derived_nuclear', label: 'Nuclear (تابکاری)' },
                { id: 'constants', label: 'Constants (کائناتی مستقلات)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSiCategoryFilter(cat.id as any)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    siCategoryFilter === cat.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid: SI Units */}
          {siCategoryFilter !== 'constants' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sanitizedUnits.filter((u) => {
                if (siCategoryFilter !== 'all' && u.category !== siCategoryFilter) return false;
                if (siSearchQuery.trim()) {
                  const q = siSearchQuery.toLowerCase();
                  return (
                    u.name.toLowerCase().includes(q) ||
                    u.urduName.includes(siSearchQuery) ||
                    u.symbol.toLowerCase().includes(q) ||
                    u.quantity.toLowerCase().includes(q) ||
                    u.urduQuantity.includes(siSearchQuery) ||
                    u.dimension.toLowerCase().includes(q) ||
                    u.formula.toLowerCase().includes(q)
                  );
                }
                return true;
              }).map((unit) => (
                <div
                  key={unit.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 hover:border-cyan-500/50 transition shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Top Row: Symbol & Category */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-base font-bold">
                          {unit.symbol}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-white">{unit.name}</h3>
                          <span className="text-[11px] text-slate-400 font-sans">{unit.urduName}</span>
                        </div>
                      </div>

                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                        {unit.level}
                      </span>
                    </div>

                    {/* Quantity & Formula */}
                    <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-2.5 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500 text-[10px]">Physical Quantity:</span>
                        <span className="text-cyan-300 font-sans text-right text-[11px]">{unit.quantity}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500 text-[10px]">Governing Formula:</span>
                        <span className="text-amber-300 font-semibold">{unit.formula}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500 text-[10px]">Dimensional Formula:</span>
                        <span className="text-emerald-400 font-bold">{unit.dimension}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500 text-[10px]">Base Units Equivalent:</span>
                        <span className="text-purple-300">{unit.baseUnitsEquivalent}</span>
                      </div>
                    </div>

                    {/* Urdu & English Description */}
                    <div className="space-y-1 text-xs text-slate-300 leading-relaxed">
                      <p className="text-[11px] text-slate-400">{unit.description}</p>
                      <p className="text-[11px] text-cyan-200/90 font-sans pt-1 border-t border-slate-800/60">
                        🇵🇰 {unit.urduDescription}
                      </p>
                    </div>

                    {/* Conversions */}
                    <div className="rounded-lg bg-slate-950/60 p-2 text-[10px] text-slate-400 font-mono">
                      <span className="text-slate-500 font-bold block mb-0.5">Conversions:</span>
                      {unit.commonConversions}
                    </div>
                  </div>

                  {/* Actions: Copy & Ask AI */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${unit.name} (${unit.symbol}) - Formula: ${unit.formula}, Dimension: ${unit.dimension}`);
                        setCopiedUnitSymbol(unit.id);
                        setTimeout(() => setCopiedUnitSymbol(null), 1500);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-800 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition"
                    >
                      {copiedUnitSymbol === unit.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedUnitSymbol === unit.id ? 'Copied' : 'Copy Data'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setQuestionText(`Explain the Physics SI Unit ${unit.name} (${unit.urduName}) in detail: its derivation from base units [${unit.baseUnitsEquivalent}], dimensional formula ${unit.dimension}, SI prefixes, and 3 board exam numerical applications.`);
                        setActiveSubTab('solver');
                      }}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 py-1.5 text-xs font-semibold text-white transition shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                      <span>Ask AI (Free • مفت)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fundamental Physical Constants Table (When constants filter active or included) */}
          {(siCategoryFilter === 'constants' || siCategoryFilter === 'all') && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-serif font-bold text-sm">
                    π
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">Universal Physical Constants (کائناتی مستقلات)</h3>
                    <p className="text-[10px] text-slate-400">Fixed international scientific values defined by CODATA and BIPM.</p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                  100% Free Educational Reference
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Constant Name & Urdu</th>
                      <th className="py-2.5 px-3">Standard Numerical Value</th>
                      <th className="py-2.5 px-3">SI Unit</th>
                      <th className="py-2.5 px-3">Physics Role / Equation</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {sanitizedConstants.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400 text-sm">{c.symbol}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-white block">{c.name}</span>
                          <span className="text-[11px] text-slate-400 font-sans">{c.urduName}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-cyan-300 font-semibold">{c.value}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{c.siUnit}</td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-300 max-w-xs">{c.description}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setQuestionText(`Explain the physical constant ${c.name} (symbol ${c.symbol} = ${c.value} ${c.siUnit}): how it was experimentally determined, its role in modern physics equations, and how it is tested in board exams.`);
                              setActiveSubTab('solver');
                            }}
                            className="rounded-lg bg-indigo-600/70 hover:bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white transition"
                          >
                            Explore in AI
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Flashcards Tab */}
      {activeSubTab === 'flashcards' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Academic & Research Revision Cards</h3>
              <p className="text-xs text-slate-400">Master core concepts, definitions, and formulas across your subjects.</p>
            </div>
            <button
              onClick={() => setShowAddCard(!showAddCard)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Card</span>
            </button>
          </div>

          {showAddCard && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <input
                type="text"
                placeholder="Front (Question / Concept / Formula Name)"
                value={newCardFront}
                onChange={(e) => setNewCardFront(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
              />
              <textarea
                placeholder="Back (Answer / Derivation / Key Points)"
                value={newCardBack}
                onChange={(e) => setNewCardBack(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddCard(false)}
                  className="px-3 py-1 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFlashcard}
                  className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  Save Card
                </button>
              </div>
            </div>
          )}

          {flashcards.length > 0 ? (
            <div className="space-y-4">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="min-h-[220px] rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-8 flex flex-col justify-between cursor-pointer hover:border-indigo-500/50 transition shadow-xl text-center select-none"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-indigo-400">
                    Card {currentCardIndex + 1} of {flashcards.length}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <RotateCw className="h-3 w-3" /> Click to flip
                  </span>
                </div>

                <div className="py-6">
                  {isFlipped ? (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                        Answer / Concept
                      </span>
                      <p className="text-sm font-medium text-slate-200 whitespace-pre-wrap">
                        {removeDollarSigns(flashcards[currentCardIndex]?.back || '')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                        Question / Flashcard
                      </span>
                      <h4 className="text-base font-bold text-white">
                        {removeDollarSigns(flashcards[currentCardIndex]?.front || '')}
                      </h4>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-500">
                  Deck: {flashcards[currentCardIndex]?.deckName || 'General Academic'}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  disabled={currentCardIndex === 0}
                  onClick={() => {
                    setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                    setIsFlipped(false);
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-30"
                >
                  Previous Card
                </button>

                <button
                  disabled={currentCardIndex === flashcards.length - 1}
                  onClick={() => {
                    setCurrentCardIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
                    setIsFlipped(false);
                  }}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-30"
                >
                  Next Card
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl p-6">
              <BookOpen className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No revision flashcards created yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">Add flashcards for quick revision before exams.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. Study Notes Tab */}
      {activeSubTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Capture Study Note</h3>
              <input
                type="text"
                placeholder="Note Title (e.g. 9th Physics Newton Laws or FSc Reaction Mechanism)"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Tags (e.g. Physics, 9th Class, Urdu Medium, Formulas)"
                value={newNoteTag}
                onChange={(e) => setNewNoteTag(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
              />
              <textarea
                rows={6}
                placeholder="Detailed study content, formulas, derivations, or key observations..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote || !newNoteTitle.trim()}
                className="w-full rounded-xl bg-indigo-600 p-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-40"
              >
                {savingNote ? 'Saving to Database...' : 'Save Study Note'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-sm font-bold text-white">Saved Study Notes ({notes.length})</h3>
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{removeDollarSigns(note.title)}</h4>
                    {note.tags && (
                      <span className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                        <Tag className="h-2.5 w-2.5" /> {removeDollarSigns(note.tags)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap">{removeDollarSigns(note.content)}</p>
                  <p className="text-[10px] text-slate-500">
                    Saved: {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="py-12 text-center text-xs text-slate-500">No study notes saved yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
