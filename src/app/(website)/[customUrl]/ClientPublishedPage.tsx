"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, Edit, AlertCircle, Clock, ArrowLeft, Loader2, Check, 
  Volume2, VolumeX, MoreHorizontal, Palette, Type, ChevronLeft, 
  ChevronRight, Maximize2 
} from "lucide-react";
import Link from "next/link";
import { obfuscate, deobfuscate } from "@/utils/stealth";

interface ClientPublishedPageProps {
  customUrl: string;
  initialData: PublishedPageData | null;
}

interface PublishedPageData {
  id: string;
  customUrl: string;
  content: string;
  isEditable: boolean;
  expiresAt: string | null;
  isDeleted: boolean;
  authorId?: string | null;
  ip?: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

const THEMES = [
  { id: "light", name: "Light Mode", color: "#ffffff" },
  { id: "dark", name: "Dark Mode", color: "#222222" },
  { id: "sepia", name: "Sepia Paper", color: "#f4ecd8" },
  { id: "midnight", name: "Midnight Sky", color: "#0f172a" },
  { id: "forest", name: "Forest Deep", color: "#111b1a" },
  { id: "ocean", name: "Ocean Depths", color: "#061e26" },
  { id: "rose", name: "Rose Noir", color: "#1c1114" },
  { id: "coffee", name: "Coffee House", color: "#1a1614" },
];

const FONTS = [
  { id: "draft", name: "Draft Sans" },
  { id: "classic", name: "Classic Serif" },
  { id: "modern", name: "Modern Mono" },
];

export default function ClientPublishedPage({ customUrl, initialData }: ClientPublishedPageProps) {
  const [pageData, setPageData] = useState<PublishedPageData | null>(initialData);
  const [content, setContent] = useState(initialData?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(!initialData);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Premium Customizer States
  const [theme, setTheme] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("app-theme") || "light" : "light"));
  const [fontStyle, setFontStyle] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("font-style") || "classic" : "classic"));
  const [soundEnabled, setSoundEnabled] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("typewriter-sound") === "true" : false));
  const [wordCount, setWordCount] = useState(0);

  // Settings Menu Dropdown States
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuView, setMenuView] = useState("main");
  const [clientIp, setClientIp] = useState("");

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioPool = useRef<Record<string, HTMLAudioElement>>({});
  const hasLoadedRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const stripHtml = (html: string) => {
    if (typeof window === "undefined") return html;
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const getWordCount = (html: string) => {
    const text = stripHtml(html);
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  // 1. Apply Theme Classes & Attributes Globally
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.removeAttribute('data-theme');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // 2. Click outside settings dropdown listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setMenuView("main");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Dynamic Word Count Calculator & Fetch IP
  useEffect(() => {
    if (content) {
      setWordCount(getWordCount(content));
    }
  }, [content]);

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const res = await fetch('/api/sync');
        const data = await res.json();
        if (data.session) {
          setClientIp(atob(data.session));
        }
      } catch (err) {
        console.error('Sync failed:', err);
      }
    };
    fetchIp();
  }, []);

  // Load content into editor when it is mounted and loaded
  useEffect(() => {
    if (editorRef.current && !hasLoadedRef.current && content) {
      editorRef.current.innerHTML = content;
      hasLoadedRef.current = true;
    }
  }, [content]);

  // 5. Expiration Timer calculation
  useEffect(() => {
    if (!pageData || !pageData.expiresAt) return;

    const expiresAt = pageData.expiresAt;

    const updateTimer = () => {
      const difference = new Date(expiresAt).getTime() - Date.now();
      
      if (difference <= 0) {
        setTimeLeft("Expired");
        setError(true); // Treat as 404/Not Found once it expires in real-time!
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [pageData]);

  // 6. Typewriter Sound System
  const playTypewriterSound = () => {
    if (!soundEnabled) return;
    const sounds = ["/sounds/kbs1.mp3", "/sounds/kbs2.mp3", "/sounds/kbs3.mp3", "/sounds/kbs4.mp3"];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    if (!audioPool.current[randomSound]) {
      audioPool.current[randomSound] = new Audio(randomSound);
    }
    const audio = audioPool.current[randomSound];
    audio.currentTime = 0;
    audio.volume = 0.8;
    audio.play().catch(() => { });
  };

  // 7. Debounced Auto-save and sound trigger
  const triggerAutosave = (newContent: string) => {
    if (!pageData || !pageData.isEditable) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);

    // Set new timeout to save after 1.5 seconds of silence
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/pages/${customUrl}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newContent, ip: clientIp }),
        });
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    playTypewriterSound();
    triggerAutosave(newContent);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      playTypewriterSound();
      triggerAutosave(newContent);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Error/404 Page (Stealth deletion/expiration!)
  if (error || !pageData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--editor-bg)] text-[var(--editor-text)] px-6 text-center transition-colors duration-300">
        <div className="max-w-[400px] flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
            <AlertCircle size={28} />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-[20px] font-extrabold tracking-tight">Page Not Found</h1>
            <p className="text-[12px] opacity-45 leading-relaxed px-4">
              This page has expired, been removed, or the link is incorrect. It is no longer accessible.
            </p>
          </div>
          <Link 
            href="/"
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-[12px] font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{ background: "var(--accent-color)", color: "var(--editor-bg)" }}
          >
            <ArrowLeft size={14} /> Create Your Own Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main 
      className="min-h-screen bg-[var(--editor-bg)] flex flex-col items-center cursor-text transition-colors duration-300 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && pageData.isEditable) editorRef.current?.focus();
      }}
    >
      
      {/* Top Header Bar */}
      <header 
        className="w-full h-14 border-b flex items-center justify-between px-6 md:px-12 fixed top-0 left-0 backdrop-blur-md z-50 transition-colors duration-300"
        style={{ 
          background: "var(--navbar-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-55 hover:opacity-100 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} strokeWidth={2} className="text-[var(--editor-text)]" />
          </Link>
          <span className="text-[12px] font-extrabold tracking-wider uppercase opacity-40 text-[var(--editor-text)]">
            Blank Page Shared
          </span>
        </div>

        {/* Action Controls & Metadata Tags */}
        <div className="flex items-center gap-4 text-[#666] dark:text-[#aaa]">
          {/* Expiration Tag */}
          {pageData.expiresAt && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold">
              <Clock size={12} />
              <span>{timeLeft || "Calculating..."}</span>
            </div>
          )}

          {/* Access Control Status Tag */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ${
            pageData.isEditable 
              ? "bg-green-500/10 text-green-600" 
              : "bg-indigo-500/10 text-indigo-500"
          }`}>
            {pageData.isEditable ? <Edit size={12} /> : <Shield size={12} />}
            <span>{pageData.isEditable ? "Editable" : "View Only"}</span>
          </div>

          {/* Auto-saving Status Tag */}
          {pageData.isEditable && (
            <div className={`flex items-center gap-1.5 text-[10px] font-semibold transition-opacity duration-300 ${
              isSaving ? "opacity-100 text-indigo-500" : "opacity-35 text-[var(--editor-text)]"
            }`}>
              {isSaving ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={12} />
                  <span>Synced</span>
                </>
              )}
            </div>
          )}

          {/* Separator line */}
          <div className="h-4 w-[1px] bg-[var(--border-color)] mx-1" />

          {/* Keyboard typewriter sound toggle */}
          {pageData.isEditable && (
            <button
              onClick={() => {
                const val = !soundEnabled;
                setSoundEnabled(val);
                localStorage.setItem("typewriter-sound", String(val));
              }}
              className="hover:text-black dark:hover:text-white transition-colors duration-200 cursor-pointer opacity-70 hover:opacity-100 text-[var(--editor-text)]"
              title={soundEnabled ? "Disable sound" : "Enable sound"}
            >
              {soundEnabled ? <Volume2 size={18} strokeWidth={1.5} /> : <VolumeX size={18} strokeWidth={1.5} />}
            </button>
          )}

          {/* Word Count display */}
          <span className="text-[13px] font-medium tracking-tight opacity-70 select-none text-[var(--editor-text)]">
            {wordCount} words
          </span>

          {/* Settings/Themes/Fonts Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)} 
              className="hover:text-black dark:hover:text-white transition-colors duration-200 cursor-pointer text-[var(--editor-text)] opacity-70 hover:opacity-100"
            >
              <MoreHorizontal size={19} strokeWidth={1.5} />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-[var(--navbar-bg)] backdrop-blur-2xl border border-[var(--border-color)] rounded-2xl shadow-2xl py-2 z-[60] overflow-hidden animate-in fade-in zoom-in duration-200">
                {menuView === "main" ? (
                  <>
                    <button 
                      onClick={() => { 
                        if (!document.fullscreenElement) document.documentElement.requestFullscreen(); 
                        else document.exitFullscreen(); 
                        setShowDropdown(false); 
                        setMenuView("main");
                      }} 
                      className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--editor-text)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center group cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-3"><Maximize2 size={15} /> Full screen</span>
                    </button>
                    <button 
                      onClick={() => setMenuView("themes")} 
                      className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--editor-text)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center group cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-3"><Palette size={15} /> Themes</span>
                      <ChevronRight size={14} className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                    </button>
                    <button 
                      onClick={() => setMenuView("fonts")} 
                      className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--editor-text)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center group cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-3"><Type size={15} /> Font style</span>
                      <ChevronRight size={14} className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                    </button>
                  </>
                ) : menuView === "themes" ? (
                  <>
                    <button 
                      onClick={() => setMenuView("main")} 
                      className="w-full text-left px-4 py-2.5 text-[13px] font-bold opacity-30 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center gap-3 transition-all cursor-pointer text-[var(--editor-text)]"
                    >
                      <ChevronLeft size={14} /> Themes
                    </button>
                    <div className="h-[1px] bg-[var(--border-color)] my-1.5" />
                    {THEMES.map((t) => (
                      <button 
                        key={t.id} 
                        onClick={() => { setTheme(t.id); localStorage.setItem("app-theme", t.id); setShowDropdown(false); setMenuView("main"); }} 
                        className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--editor-text)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center justify-between group cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-full border border-[var(--border-color)] shadow-sm" style={{ background: t.color }} />
                          {t.name}
                        </div>
                        {theme === t.id && <Check size={14} className="text-[var(--accent-color)]" />}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setMenuView("main")} 
                      className="w-full text-left px-4 py-2.5 text-[13px] font-bold opacity-30 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center gap-3 transition-all cursor-pointer text-[var(--editor-text)]"
                    >
                      <ChevronLeft size={14} /> Font style
                    </button>
                    <div className="h-[1px] bg-[var(--border-color)] my-1.5" />
                    {FONTS.map((font) => (
                      <button 
                        key={font.id} 
                        onClick={() => { setFontStyle(font.id); localStorage.setItem("font-style", font.id); setShowDropdown(false); setMenuView("main"); }} 
                        className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--editor-text)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center justify-between group cursor-pointer transition-colors"
                      >
                        {font.name} {fontStyle === font.id && <Check size={14} className="text-[var(--accent-color)]" />}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Shared Document Content Viewport */}
      <div className="w-full max-w-4xl px-8 md:px-20 py-24 mt-12 flex-1">
        <div
          ref={editorRef}
          contentEditable={pageData.isEditable}
          onInput={handleInput}
          onPaste={handlePaste}
          suppressContentEditableWarning
          className={`w-full outline-none text-[18px] md:text-[22px] leading-[1.8] font-${fontStyle} text-[var(--editor-text)] whitespace-pre-wrap transition-all duration-500 selection:bg-[var(--accent-color)] selection:text-[var(--editor-bg)]`}
          style={{ 
            caretColor: 'var(--accent-color)',
          }}
          spellCheck="false"
          data-placeholder="Start writing..."
        />
      </div>

      <style jsx global>{`
        .font-draft { font-family: 'Inter', sans-serif; }
        .font-classic { font-family: 'Merriweather', serif; }
        .font-modern { font-family: 'Courier Prime', monospace; }
        .font-typewriter { font-family: 'Courier Prime', monospace; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--editor-text);
          opacity: 0.3;
          cursor: text;
        }
      `}</style>
    </main>
  );
}
