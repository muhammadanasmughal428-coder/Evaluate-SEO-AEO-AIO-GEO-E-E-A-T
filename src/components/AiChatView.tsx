import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Camera,
  Send,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Globe2,
  X,
  Search,
  Bot,
  User as UserIcon,
  Image as ImageIcon,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  BookmarkPlus,
  Zap,
  Calculator,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { ChatSession, ChatMessage } from '../types/index.ts';
import { PHYSICS_SI_UNITS, PHYSICAL_CONSTANTS, PhysicsSiUnit } from '../data/physicsSiUnits.ts';
import { removeDollarSigns } from '../utils/mathSanitizer.ts';

const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect Language', native: 'Automatic', dir: 'ltr' },
  { code: 'en', name: 'English', native: 'English', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', native: 'اردو', dir: 'rtl' },
  { code: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl' },
  { code: 'fa', name: 'Persian', native: 'فارسی', dir: 'rtl' },
  { code: 'he', name: 'Hebrew', native: 'עברית', dir: 'rtl' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', native: '中文', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', native: '日本語', dir: 'ltr' },
  { code: 'ko', name: 'Korean', native: '한국어', dir: 'ltr' },
  { code: 'es', name: 'Spanish', native: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'French', native: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', native: 'Deutsch', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', native: 'Português', dir: 'ltr' },
  { code: 'it', name: 'Italian', native: 'Italiano', dir: 'ltr' },
  { code: 'ru', name: 'Russian', native: 'Русский', dir: 'ltr' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', dir: 'ltr' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', dir: 'ltr' },
  { code: 'th', name: 'Thai', native: 'ไทย', dir: 'ltr' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', dir: 'ltr' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', dir: 'ltr' },
  { code: 'pl', name: 'Polish', native: 'Polski', dir: 'ltr' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', dir: 'ltr' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', dir: 'ltr' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', dir: 'ltr' },
  { code: 'da', name: 'Danish', native: 'Dansk', dir: 'ltr' },
  { code: 'no', name: 'Norwegian', native: 'Norsk', dir: 'ltr' },
  { code: 'fi', name: 'Finnish', native: 'Suomi', dir: 'ltr' },
  { code: 'ro', name: 'Romanian', native: 'Română', dir: 'ltr' },
  { code: 'cs', name: 'Czech', native: 'Čeština', dir: 'ltr' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar', dir: 'ltr' },
];

export const AiChatView: React.FC = () => {
  const { idToken } = useAuth();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [answerDepth, setAnswerDepth] = useState<'auto' | 'short' | 'long'>('auto');
  const [selectedPersona, setSelectedPersona] = useState<string>('auto');
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<number | null>(null);

  // SI Units Quick Explorer Modal
  const [showSiModal, setShowSiModal] = useState(false);
  const [siModalFilter, setSiModalFilter] = useState<'all' | 'base' | 'mechanics' | 'electricity' | 'constants'>('all');
  const [siModalSearch, setSiModalSearch] = useState('');
  const [copiedSiSymbol, setCopiedSiSymbol] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const selectedLangObj = LANGUAGES.find((l) => l.code === selectedLanguage);
  const isRTLChar = (text: string) =>
    /[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

  const isRTL = selectedLangObj?.dir === 'rtl' || isRTLChar(inputPrompt);

  // Load chat sessions
  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats', {
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        if (data.length > 0 && !activeChatId) {
          setActiveChatId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching chats:', e);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [idToken]);

  // Load messages for active chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chats/${activeChatId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (e) {
        console.error('Error fetching messages:', e);
      }
    };

    fetchMessages();
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleNewChat = async () => {
    try {
      const res = await fetch('/api/chats/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ title: 'New Conversation' }),
      });
      if (res.ok) {
        const created = await res.json();
        setChats([created, ...chats]);
        setActiveChatId(created.id);
        setMessages([]);
      }
    } catch (e) {
      console.error('Error creating chat:', e);
    }
  };

  const handleDeleteChat = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      const updated = chats.filter((c) => c.id !== id);
      setChats(updated);
      if (activeChatId === id) {
        setActiveChatId(updated[0]?.id || null);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  const handleRenameChat = async (id: number) => {
    if (!editingTitle.trim()) return;
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle }),
      });
      if (res.ok) {
        const updated = await res.json();
        setChats(chats.map((c) => (c.id === id ? updated : c)));
        setEditingChatId(null);
      }
    } catch (err) {
      console.error('Error renaming chat:', err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Image must be under 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clipboard paste support for screenshots
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  // Voice speech-to-text
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang =
      selectedLanguage === 'ur'
        ? 'ur-PK'
        : selectedLanguage === 'ar'
        ? 'ar-SA'
        : selectedLanguage === 'hi'
        ? 'hi-IN'
        : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
      textareaRef.current?.focus();
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Text-to-speech for answers
  const handleSpeak = (id: number, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanMath = removeDollarSigns(text);
    const cleanText = cleanMath
      .replace(/[#*`_$\\[\]]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .slice(0, 1500);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Save directly to study notes
  const handleSaveToStudyNotes = async (msg: ChatMessage) => {
    try {
      const cleanContent = removeDollarSigns(msg.content);
      const title =
        cleanContent
          .slice(0, 50)
          .replace(/[#*`\n]/g, ' ')
          .trim() || 'AI Concept Note';
      const res = await fetch('/api/student/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          title,
          content: cleanContent,
          tags: 'ChatGPT, Concept, AutoSave',
        }),
      });
      if (res.ok) {
        setSavedNoteId(msg.id);
        setTimeout(() => setSavedNoteId(null), 3000);
      }
    } catch (e) {
      console.error('Failed to save to study notes', e);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    let promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend && !imagePreview) return;

    // Automatically append concept answer style if user has selected short or long mode
    if (answerDepth === 'short' && !promptToSend.toLowerCase().includes('short')) {
      promptToSend = `${promptToSend}\n[Note: Please provide a direct, concise, conceptual short answer (2-4 marks style with definition & formula/law if applicable).]`;
    } else if (
      answerDepth === 'long' &&
      !promptToSend.toLowerCase().includes('long') &&
      !promptToSend.toLowerCase().includes('detail')
    ) {
      promptToSend = `${promptToSend}\n[Note: Please provide a comprehensive, detailed explanation with clear headings, governing principles, step-by-step derivation/analysis, and summary (8-10 marks / thesis style).]`;
    }

    const currentImage = imagePreview;
    const currentPrompt = promptToSend;
    setInputPrompt('');
    setImagePreview(null);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      chatId: activeChatId || 0,
      role: 'user',
      content: (customPrompt || inputPrompt).trim() || '[Sent Image]',
      imageUrl: currentImage || undefined,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          chatId: activeChatId,
          imageUrl: currentImage,
          language: selectedLanguage,
          persona: selectedPersona,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      if (!activeChatId) {
        setActiveChatId(data.chatId);
        fetchChats();
      }

      const cleanMsg = data.message
        ? {
            ...data.message,
            content: removeDollarSigns(data.message.content),
          }
        : data.message;

      setMessages((prev) => [...prev, cleanMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        chatId: activeChatId || 0,
        role: 'assistant',
        content: `**Error:** ${err.message || 'AI service unavailable. Please retry.'}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  };

  const handleCopy = (content: string, id: number) => {
    navigator.clipboard.writeText(removeDollarSigns(content));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950">
      {/* Left Chat Sidebar */}
      <div className="w-72 shrink-0 border-r border-slate-800 bg-slate-900/60 p-3 flex flex-col justify-between hidden sm:flex">
        <div className="space-y-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition active:scale-95"
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>New Conversation</span>
            </div>
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Recent list */}
          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-17rem)]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 block">
              Recent Chats
            </span>
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs cursor-pointer transition ${
                  activeChatId === chat.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {editingChatId === chat.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleRenameChat(chat.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameChat(chat.id)}
                    autoFocus
                    className="w-full bg-slate-950 border border-indigo-500 rounded px-1 text-xs text-white"
                  />
                ) : (
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </div>
                )}

                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingChatId(chat.id);
                      setEditingTitle(chat.title);
                    }}
                    className="p-1 hover:text-white"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="p-1 hover:text-rose-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {filteredChats.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-slate-500">No chats found.</p>
            )}
          </div>
        </div>

        {/* Multilingual Selector Badge */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <Globe2 className="h-3.5 w-3.5 text-indigo-400" /> Language
            </span>
            {isRTL && (
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1 rounded">
                RTL Active
              </span>
            )}
          </div>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.native})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Messages list */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 ${
            isRTL ? 'text-right' : 'text-left'
          }`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                  <Sparkles className="h-7 w-7 text-cyan-400" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Universal AI Assistant & Concept Engine</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                  Conceptual problem solving and in-depth explanations across all worldwide subjects — from Pakistan 9th class (Matric) up to PhD doctoral research.
                </p>
              </div>

              {/* Academic Level Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 py-1 max-w-xl">
                {[
                  { label: '🎒 9th & 10th Matric', query: 'Explain Newton\'s 2nd Law of Motion (F=ma): Short definition + derivation for 9th class Physics' },
                  { label: '🔬 11th-12th Inter (FSc / ICS)', query: 'Explain the 4 Pillars of OOP (Encapsulation, Abstraction, Inheritance, Polymorphism) with real examples for ICS' },
                  { label: '🎓 University (BS / MS)', query: 'Explain how Gradient Descent and Backpropagation work in Deep Learning with mathematical intuition' },
                  { label: '🏛️ PhD Research Level', query: 'How to formulate a rigorous theoretical framework and research methodology for a doctoral dissertation?' },
                  { label: '🇵🇰 مطالعہ پاکستان / اسلامیات', query: 'نظریہ پاکستان (Two-Nation Theory) کا بنیادی تصور اور تاریخی پس منظر مختصر بیان کریں' },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.query)}
                    className="rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800 transition"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Starter prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-xs">
                {[
                  'Explain Kinetic Energy vs Potential Energy: Formulas & real-world concept (Matric Physics)',
                  'Photosynthesis ka light reaction aur dark reaction ka conceptual farq (Biology)',
                  'Explain Time Complexity Big-O notation with simple array search examples (CS)',
                  'Explain how to optimize for Perplexity and ChatGPT Search (AEO & GEO)',
                ].map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(promptText)}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left hover:border-indigo-500/40 hover:bg-slate-900 transition text-slate-300"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user'
                  ? isRTL
                    ? 'mr-auto flex-row-reverse'
                    : 'ml-auto flex-row-reverse'
                  : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-cyan-400 border border-slate-700'
                }`}
              >
                {msg.role === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`rounded-2xl p-4 text-xs space-y-2 max-w-2xl ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}
              >
                {/* Uploaded image if present */}
                {msg.imageUrl && (
                  <div className="mb-2">
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded query"
                      className="max-h-60 rounded-xl border border-slate-700 object-contain bg-slate-950"
                    />
                  </div>
                )}

                {/* Markdown text representation */}
                <div
                  dir={isRTLChar(msg.content) ? 'rtl' : 'ltr'}
                  className={`whitespace-pre-wrap leading-relaxed font-sans ${
                    isRTLChar(msg.content) ? 'text-right' : 'text-left'
                  }`}
                >
                  {removeDollarSigns(msg.content)}
                </div>

                {/* Controls for assistant message */}
                {msg.role === 'assistant' && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <button
                      onClick={() => handleCopy(removeDollarSigns(msg.content), msg.id)}
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Listen / Read Aloud */}
                    <button
                      onClick={() => handleSpeak(msg.id, msg.content)}
                      className={`flex items-center gap-1 transition ${
                        speakingId === msg.id
                          ? 'text-cyan-400 font-medium'
                          : 'hover:text-white'
                      }`}
                      title="Listen to Answer (Speech)"
                    >
                      {speakingId === msg.id ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                          <span className="text-rose-400">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>

                    {/* Save to Study Notes */}
                    <button
                      onClick={() => handleSaveToStudyNotes(msg)}
                      className="flex items-center gap-1 hover:text-indigo-300 transition"
                      title="Save directly into your Study Notes notebook"
                    >
                      {savedNoteId === msg.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Saved to Notes</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-3.5 w-3.5" />
                          <span>Save Note</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        handleSendMessage(messages[messages.indexOf(msg) - 1]?.content || '')
                      }
                      className="flex items-center gap-1 hover:text-white transition ml-auto"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Regenerate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 max-w-3xl mr-auto">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-cyan-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                <span>Formulating conceptual response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-800 bg-slate-900/90 p-3 sm:p-4">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Academic & Professional Persona Level Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl bg-slate-950/90 p-1.5 border border-slate-800 text-[11px]">
              <span className="px-1 text-slate-500 font-semibold uppercase text-[9px] shrink-0">Persona Level:</span>
              {[
                { id: 'auto', label: '🎓 Auto-Calibrated' },
                { id: 'secondary', label: '🎒 9th-10th (Matric)' },
                { id: 'higher_secondary', label: '🔬 11th-12th (FSc/ICS)' },
                { id: 'university', label: '🏛️ University (BS/MS)' },
                { id: 'phd', label: '📜 Doctoral (PhD)' },
                { id: 'professional', label: '💼 Professional' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPersona(p.id)}
                  className={`rounded-lg px-2 py-0.5 transition font-medium whitespace-nowrap ${
                    selectedPersona === p.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Quick Answer Depth & Question Quick-Taps */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              {/* Answer Depth Mode */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-950/80 p-1 border border-slate-800 text-[11px]">
                <span className="px-1.5 text-slate-500 font-semibold uppercase text-[9px]">Format:</span>
                {[
                  { id: 'auto', label: '⚡ Auto' },
                  { id: 'short', label: '🎯 Short (2-4 Marks)' },
                  { id: 'long', label: '📚 Long Detailed' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setAnswerDepth(mode.id as any)}
                    className={`rounded-lg px-2 py-0.5 transition font-medium ${
                      answerDepth === mode.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* SI Units Quick Explorer Button */}
              <button
                type="button"
                onClick={() => setShowSiModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-950/90 to-indigo-950/90 border border-cyan-500/40 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:border-cyan-400 hover:text-white transition shadow-sm shrink-0"
              >
                <Calculator className="h-3.5 w-3.5 text-cyan-400" />
                <span>⚡ All World SI Units</span>
                <span className="rounded bg-emerald-500/20 text-emerald-300 px-1 py-0.2 text-[9px] font-bold">100% Free</span>
              </button>

              {/* Fast Example Prompts / Popular Pakistani & Global Subjects */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400 py-0.5 scrollbar-thin">
                <span className="hidden sm:inline text-slate-500 text-[10px] shrink-0 font-medium">Popular Subjects (9th-PhD):</span>
                {[
                  { label: '⚡ SI Units: Newton (قوت)', prompt: 'Explain the SI Unit Newton (N): its derivation in base SI units (kg·m/s²), dimensional formula [M L T⁻²], and physical meaning.' },
                  { label: '⚡ SI Units: Joule & Watt (توانائی و پاور)', prompt: 'Explain Joule and Watt in SI units, dimensional analysis, and conversion between Joules, eV, and kWh.' },
                  { label: '⚡ 7 Base SI Units (7 بنیادی اکائیاں)', prompt: 'List all 7 Fundamental Base SI Units with their definitions, symbols, and dimensions.' },
                  { label: '⚛️ Physics (طبیعیات)', prompt: 'State Newton\'s Second Law of Motion and derive F = ma with units and concept.' },
                  { label: '🧪 Chemistry (کیمسٹری)', prompt: 'Explain the mechanism of SN1 and SN2 reactions in Organic Chemistry with reaction coordinates.' },
                  { label: '🧬 Biology (حیاتیات)', prompt: 'فوٹوسنتھیسس کے لائٹ اور ڈارک ری ایکشنز کا مرحلہ وار تصور اردو میں سمجھائیں۔' },
                  { label: '📐 Math (ریاضی)', prompt: 'Derive the quadratic formula by completing the square method step-by-step.' },
                  { label: '💻 Computer Science (کمپیوٹر)', prompt: 'Explain Database Normalization (1NF, 2NF, 3NF) with real-world examples and anomalies.' },
                  { label: '🇵🇰 Pak Studies (مطالعہ پاکستان)', prompt: '1973 کے آئین پاکستان کی اہم خصوصیات اور اسلامی دفعات کی وضاحت کریں۔' },
                  { label: '📖 Urdu (اردو ادب و گرائمر)', prompt: 'علمِ بیان میں تشبیہ، استعارہ اور کنایہ کا تصور مع جامع امثلہ واضح کریں۔' },
                  { label: '💼 Accounting (اکاؤنٹنگ)', prompt: 'Prepare a Bank Reconciliation Statement explaining the reasons for discrepancy between Cash Book and Pass Book.' },
                  { label: '🩺 Medical (MBBS/BDS)', prompt: 'Explain the Renin-Angiotensin-Aldosterone System (RAAS) in human blood pressure regulation.' },
                  { label: '📜 PhD Research (تحقیق)', prompt: 'Formulate a publication-grade PhD research problem statement, epistemological gap, and theoretical framework.' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-0.5 text-slate-300 hover:border-cyan-500 hover:text-white transition whitespace-nowrap text-[11px]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Preview Banner */}
            {imagePreview && (
              <div className="flex items-center justify-between rounded-xl border border-indigo-500/30 bg-slate-950 p-2">
                <div className="flex items-center gap-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-12 w-12 rounded-lg object-cover border border-slate-800"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200">Image Attached for AI Inspection</span>
                    <p className="text-[11px] text-slate-400">Pasted screenshot, homework equation or diagram</p>
                  </div>
                </div>
                <button
                  onClick={() => setImagePreview(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Voice Listening Feedback Alert */}
            {isListening && (
              <div className="flex items-center gap-2 rounded-xl bg-indigo-950/60 border border-indigo-500/50 px-3 py-1.5 text-xs text-indigo-200 animate-pulse">
                <Mic className="h-4 w-4 text-rose-400 animate-bounce" />
                <span>Listening to your voice... Speak your question now in Urdu or English!</span>
              </div>
            )}

            {/* Input field */}
            <div
              className={`relative flex items-end rounded-2xl border border-slate-700 bg-slate-950 p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                dir={isRTL ? 'rtl' : 'ltr'}
                placeholder={
                  isRTL
                    ? 'یہاں سوال لکھیں، بولیں یا تصویر چسپاں کریں... (Ctrl+V supported)'
                    : 'Ask anything, speak (🎙️), or paste screenshot (Ctrl+V)... (Enter to send)'
                }
                className="w-full resize-none bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none max-h-32"
              />

              <div className="flex items-center gap-1 pb-1">
                {/* Voice speech recognition button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  title={isListening ? 'Stop listening' : 'Speak your question (Voice input)'}
                  className={`rounded-xl p-2 transition ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-rose-400'
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Hidden file input for camera/photo */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload / Take Photo (Camera)"
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition"
                >
                  <Camera className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={loading || (!inputPrompt.trim() && !imagePreview)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40 active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                Automatic Voice (🎙️) + Screenshot Paste (Ctrl+V) + 9th to PhD Concept Engine
              </span>
              <span className="text-slate-500">Auto-Optimized AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* SI Units & Constants Explorer Modal */}
      {showSiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[88vh] rounded-2xl border border-cyan-500/30 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">All World Physics SI Units & Physical Constants</h3>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-bold text-emerald-300">
                      100% مفت علمی رسائی • بغیر کسی فیس کے • Free Education
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    BIPM & International System of Units standards with dimensions, formulas, and Urdu explanations.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSiModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search any SI unit, symbol, formula, or dimension (e.g. Newton, N, جول, [M L T⁻²], Farad, c)..."
                  value={siModalSearch}
                  onChange={(e) => setSiModalSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-[11px] shrink-0">
                {[
                  { id: 'all', label: 'All Units' },
                  { id: 'base', label: '7 Base' },
                  { id: 'mechanics', label: 'Mechanics' },
                  { id: 'electricity', label: 'Electricity' },
                  { id: 'constants', label: 'Constants' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSiModalFilter(f.id as any)}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      siModalFilter === f.id
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body: Units & Constants List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4 max-h-[60vh] scrollbar-thin">
              {siModalFilter !== 'constants' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PHYSICS_SI_UNITS.filter((u) => {
                    if (siModalFilter === 'base' && u.category !== 'base') return false;
                    if (siModalFilter === 'mechanics' && u.category !== 'derived_mechanics') return false;
                    if (siModalFilter === 'electricity' && u.category !== 'derived_electromagnetism') return false;
                    if (siModalSearch.trim()) {
                      const q = siModalSearch.toLowerCase();
                      return (
                        u.name.toLowerCase().includes(q) ||
                        u.urduName.includes(siModalSearch) ||
                        u.symbol.toLowerCase().includes(q) ||
                        u.quantity.toLowerCase().includes(q) ||
                        u.urduQuantity.includes(siModalSearch) ||
                        u.dimension.toLowerCase().includes(q) ||
                        u.formula.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  }).map((unit) => (
                    <div
                      key={unit.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-col justify-between hover:border-cyan-500/40 transition text-xs space-y-2.5"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-bold text-sm">
                              {unit.symbol}
                            </span>
                            <div>
                              <h4 className="font-bold text-white text-xs">{unit.name}</h4>
                              <span className="text-[10px] text-slate-400">{unit.urduQuantity}</span>
                            </div>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {unit.dimension}
                          </span>
                        </div>

                        <div className="rounded-lg bg-slate-900/80 p-2 space-y-1 font-mono text-[11px] text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Formula:</span>
                            <span className="text-amber-300">{unit.formula}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Base Units:</span>
                            <span className="text-purple-300">{unit.baseUnitsEquivalent}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{unit.description}</p>
                        <p className="text-[10px] text-cyan-200/80 mt-1 font-sans">🇵🇰 {unit.urduDescription}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${unit.name} (${unit.symbol}) - Formula: ${unit.formula}, Dimension: ${unit.dimension}, Base Units: ${unit.baseUnitsEquivalent}`);
                            setCopiedSiSymbol(unit.id);
                            setTimeout(() => setCopiedSiSymbol(null), 1500);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-800 py-1 text-[11px] text-slate-300 hover:text-white"
                        >
                          {copiedSiSymbol === unit.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedSiSymbol === unit.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const prompt = `Explain the SI unit ${unit.name} (${unit.urduName}): its complete physical derivation from 7 base SI units [${unit.baseUnitsEquivalent}], dimensional formula ${unit.dimension}, SI prefixes, and 3 board exam numerical questions with step-by-step solutions.`;
                            setInputPrompt(prompt);
                            setShowSiModal(false);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-1 text-[11px] font-semibold text-white transition shadow-sm"
                        >
                          <Sparkles className="h-3 w-3 text-cyan-300" />
                          <span>Ask AI (0$ Free)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Physical Constants Table */}
              {(siModalFilter === 'constants' || siModalFilter === 'all') && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="text-amber-400 font-serif font-bold">π</span>
                      <span>Fundamental Physical Constants (کائناتی مستقلات)</span>
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-mono">100% Free</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                          <th className="py-1.5 px-2">Symbol</th>
                          <th className="py-1.5 px-2">Name & Urdu</th>
                          <th className="py-1.5 px-2">Value</th>
                          <th className="py-1.5 px-2">Unit</th>
                          <th className="py-1.5 px-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {PHYSICAL_CONSTANTS.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/60 transition">
                            <td className="py-2 px-2 font-mono font-bold text-amber-400">{c.symbol}</td>
                            <td className="py-2 px-2">
                              <span className="font-semibold text-slate-200 block text-[11px]">{c.name}</span>
                              <span className="text-[10px] text-slate-400">{c.urduName}</span>
                            </td>
                            <td className="py-2 px-2 font-mono text-cyan-300 text-[11px]">{c.value}</td>
                            <td className="py-2 px-2 font-mono text-emerald-400 text-[11px]">{c.siUnit}</td>
                            <td className="py-2 px-2 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setInputPrompt(`Explain the physical constant ${c.name} (symbol ${c.symbol} = ${c.value} ${c.siUnit}): how it was experimentally determined, its role in modern physics equations, and how it is tested in board exams.`);
                                  setShowSiModal(false);
                                }}
                                className="rounded bg-indigo-600 hover:bg-indigo-500 px-2 py-0.5 text-[10px] font-medium text-white transition"
                              >
                                Ask AI
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

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>All 7 Base Units + Derived Mechanics, Electricity, Optics & Modern Physics</span>
              <span className="text-emerald-400 font-semibold">100% مفت علمی رسائی / کوئی فیس نہیں • Free Access</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
