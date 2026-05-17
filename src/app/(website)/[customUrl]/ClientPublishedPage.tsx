"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Shield, Edit, AlertCircle, Clock, ArrowLeft, Loader2, Check,
  Volume2, VolumeX, MoreHorizontal, Palette, Type, ChevronLeft,
  ChevronRight, Maximize2, Eye, EyeOff
} from "lucide-react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { obfuscate, deobfuscate } from "@/utils/stealth";
import FloatingToolbar from "@/components/website/PageSections/HomePage/Editor/FloatingToolbar";
import TranslationModal from "@/components/website/PageSections/HomePage/Editor/TranslationModal";

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
  isProtected?: boolean;
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

const LANGUAGES = ["English", "Bengali", "Arabic", "Hindi", "Spanish", "French", "German"];
const MODELS = [
  { id: "m1", label: "Fast Mode" },
  { id: "m2", label: "Pro Mode" }
];
const API_SECRET = "blank_page_secret_token_2026_secure";

export default function ClientPublishedPage({ customUrl, initialData }: ClientPublishedPageProps) {
  const [pageData, setPageData] = useState<PublishedPageData | null>(initialData);
  const [content, setContent] = useState(initialData?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(!initialData);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const [isLocked, setIsLocked] = useState(initialData?.isProtected || false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // Premium Customizer States
  const [theme, setTheme] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("app-theme") || "light" : "light"));
  const [fontStyle, setFontStyle] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("font-style") || "classic" : "classic"));
  const [soundEnabled, setSoundEnabled] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("typewriter-sound") === "true" : false));
  const [wordCount, setWordCount] = useState(0);

  // AI Translation & Selection States
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number; show: boolean }>({ top: 0, left: 0, show: false });
  const [copied, setCopied] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState("");
  const [showTranslateOptions, setShowTranslateOptions] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectedModel, setSelectedModel] = useState("m1");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [resultCopied, setResultCopied] = useState(false);
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  // Settings Menu Dropdown States
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuView, setMenuView] = useState("main");
  const [clientIp, setClientIp] = useState("");

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioPool = useRef<Record<string, HTMLAudioElement>>({});
  const hasLoadedRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Setup Socket.IO for Live Tracking
  useEffect(() => {
    // Determine the server URL (ensure it matches the backend)
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    
    // Skip connecting if serverUrl is local but the site is accessed from a public production domain
    const isLocalServer = serverUrl ? (serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1')) : false;
    const isPublicDomain = typeof window !== 'undefined' && 
                           window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1';
    
    if (!serverUrl || (isLocalServer && isPublicDomain)) {
      // Do not connect if serverUrl is missing or local server is called from a public domain
      return;
    }

    const socket = io(serverUrl);
    socketRef.current = socket;

    socket.emit("join-page", customUrl);

    socket.on("page-updated", (newContent: string) => {
      // Update React state
      setContent(newContent);

      // Update DOM directly if the user is a viewer, or carefully if editor.
      if (editorRef.current && editorRef.current.innerHTML !== newContent) {
        // Save current selection to restore cursor if possible
        const selection = window.getSelection();
        let cursorOffset = 0;
        if (selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
          // A very basic cursor preservation attempt (flawed for rich HTML but works for simple text)
          const range = selection.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(editorRef.current);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          cursorOffset = preCaretRange.toString().length;
        }

        editorRef.current.innerHTML = newContent;

        // Try to restore cursor (this is very basic and won't work perfectly for complex HTML diffs, but it's better than jumping to start)
        if (cursorOffset > 0 && pageData?.isEditable) {
          try {
            const range = document.createRange();
            const sel = window.getSelection();

            let currentOffset = 0;
            let found = false;

            const traverseNodes = (node: Node) => {
              if (found) return;
              if (node.nodeType === Node.TEXT_NODE) {
                const length = node.textContent?.length || 0;
                if (currentOffset + length >= cursorOffset) {
                  range.setStart(node, cursorOffset - currentOffset);
                  range.collapse(true);
                  found = true;
                } else {
                  currentOffset += length;
                }
              } else {
                for (let i = 0; i < node.childNodes.length; i++) {
                  traverseNodes(node.childNodes[i]);
                }
              }
            };

            traverseNodes(editorRef.current);

            if (found && sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
          } catch (e) {
            console.log("Cursor restoration failed after live update");
          }
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [customUrl, pageData?.isEditable, isLocked]);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setAuthError("");
    
    try {
      const res = await fetch(`/api/pages/${customUrl}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Incorrect secret key");
      
      setPageData(data.data);
      setContent(data.data.content || "");
      setIsLocked(false);
    } catch (err: any) {
      setAuthError(err.message);
      setPasswordInput("");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
    } finally {
      setIsVerifying(false);
    }
  };

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
    if (editorRef.current && !hasLoadedRef.current && content && !isLocked) {
      editorRef.current.innerHTML = content;
      hasLoadedRef.current = true;
    }
  }, [content, isLocked]);

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

    // Emit live to socket
    if (socketRef.current) {
      socketRef.current.emit("edit-page", { customUrl, content: newContent });
    }

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

      // Emit live to socket
      if (socketRef.current) {
        socketRef.current.emit("edit-page", { customUrl, content: newContent });
      }

      triggerAutosave(newContent);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Selection handling for toolbar
  useEffect(() => {
    const handleSelection = () => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.closest('.floating-toolbar')) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !editorRef.current?.contains(selection.anchorNode)) {
        setToolbarPos((prev) => ({ ...prev, show: false }));
        setShowTranslateOptions(false);
        return;
      }

      const text = selection.toString().trim();
      if (text) setSelectedText(text);

      const range = selection.getRangeAt(0);
      setSavedRange(range);
      const rect = range.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;

      const toolbarTop = rect.top - 60 < 10 ? rect.bottom + 10 : rect.top - 60;

      setToolbarPos({
        top: isMobile ? 64 : toolbarTop,
        left: isMobile ? window.innerWidth / 2 : rect.left + rect.width / 2,
        show: true
      });
    };

    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  // Visual Selection Highlight
  useEffect(() => {
    if (showTranslateOptions && selectedText) {
      try {
        document.execCommand("hiliteColor", false, "rgba(255, 230, 0, 0.3)");
      } catch (e) { }
    } else if (!showTranslateOptions && !isTranslating) {
      try {
        document.execCommand("hiliteColor", false, "transparent");
      } catch (e) { }
    }
  }, [showTranslateOptions, selectedText, isTranslating]);

  const handleCopy = () => {
    const selection = window.getSelection();
    if (selection) {
      navigator.clipboard.writeText(selection.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTranslate = async (targetLang: string) => {
    if (!selectedText) return;

    const text = selectedText;
    const currentInstruction = customInstruction;
    setCustomInstruction("");
    setSelectedLanguage(targetLang);
    setIsTranslating(true);
    setShowTranslateOptions(false);
    setTranslationResult("");

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-m-id": selectedModel,
          "x-api-secret": API_SECRET
        },
        body: JSON.stringify({
          text,
          targetLang,
          customInstruction: currentInstruction
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Server Error");
      }

      setTranslationResult(data.result || "Translation failed");
    } catch (error) {
      console.error("Translation Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to translate";
      setTranslationResult(`Error: ${errorMessage}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleResultCopy = () => {
    if (!translationResult) return;
    navigator.clipboard.writeText(translationResult);
    setResultCopied(true);
    setTimeout(() => setResultCopied(false), 2000);
  };

  const applyTranslation = () => {
    if (!translationResult || !pageData?.isEditable) return;

    if (savedRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }
    }

    document.execCommand("insertHTML", false, translationResult);
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      
      if (socketRef.current) {
        socketRef.current.emit("edit-page", { customUrl, content: newContent });
      }

      triggerAutosave(newContent);
    }
    setTranslationResult("");
  };

  const applyColor = (color: string) => {
    if (!pageData?.isEditable) return;
    document.execCommand("foreColor", false, color);
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      
      if (socketRef.current) {
        socketRef.current.emit("edit-page", { customUrl, content: newContent });
      }

      triggerAutosave(newContent);
    }
  };

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
        if (e.target === e.currentTarget && pageData?.isEditable) editorRef.current?.focus();
      }}
    >
      {/* Password Protection Modal Overlay */}
      {isLocked && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] animate-in fade-in duration-300 px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-2xl" />
          
          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              15% { transform: translateX(-8px); }
              30% { transform: translateX(8px); }
              45% { transform: translateX(-6px); }
              60% { transform: translateX(6px); }
              75% { transform: translateX(-3px); }
              90% { transform: translateX(3px); }
            }
            .shake { animation: shake 0.5s ease-in-out; }
          `}</style>

          <form
            onSubmit={handleVerifyPassword}
            className={`relative w-full max-w-[380px] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ${isShaking ? 'shake' : ''}`}
            style={{ background: "var(--editor-bg)", border: "1px solid var(--border-color)" }}
          >
            {/* Top gradient accent bar */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 40%, transparent))" }} />

            <div className="p-8">
              {/* Icon + Title */}
              <div className="flex flex-col items-center text-center gap-4 mb-8">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "color-mix(in srgb, var(--accent-color) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-color) 25%, transparent)" }}
                >
                  <Shield size={24} style={{ color: "var(--accent-color)" }} />
                </div>
                <div>
                  <h2 className="text-[18px] font-extrabold tracking-tight mb-1" style={{ color: "var(--editor-text)" }}>Protected Page</h2>
                  <p className="text-[12px] leading-relaxed opacity-50" style={{ color: "var(--editor-text)" }}>Enter the secret key to unlock this page</p>
                </div>
              </div>

              {/* Input */}
              <div className="relative mb-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setAuthError(""); }}
                  placeholder="Secret key..."
                  autoComplete="new-password"
                  className="w-full outline-none px-4 py-3.5 rounded-2xl text-[14px] font-medium pr-12 transition-all"
                  style={{
                    background: authError
                      ? "color-mix(in srgb, #ef4444 6%, transparent)"
                      : "color-mix(in srgb, var(--editor-text) 6%, transparent)",
                    border: authError ? "1.5px solid rgba(239,68,68,0.4)" : "1.5px solid transparent",
                    color: "var(--editor-text)",
                  }}
                  disabled={isVerifying}
                  autoFocus
                />
                {passwordInput && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ color: "var(--editor-text)" }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>

              {/* Error message */}
              {authError && (
                <div className="flex items-center gap-2 mt-2 mb-1 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-red-500 text-[11px] font-semibold">{authError}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <Link
                  href="/"
                  className="flex-1 py-3 text-[13px] font-medium rounded-2xl cursor-pointer transition-all hover:opacity-70 text-center"
                  style={{ border: "1px solid var(--border-color)", color: "var(--editor-text)" }}
                >
                  Go Back
                </Link>
                <button
                  type="submit"
                  disabled={isVerifying || !passwordInput}
                  className="flex-1 py-3 text-[13px] font-bold rounded-2xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40"
                  style={{ background: "var(--accent-color)", color: "var(--editor-bg)" }}
                >
                  {isVerifying
                    ? <Loader2 size={15} className="animate-spin mx-auto" />
                    : "Unlock"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}


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
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ${pageData.isEditable
            ? "bg-green-500/10 text-green-600"
            : "bg-indigo-500/10 text-indigo-500"
            }`}>
            {pageData.isEditable ? <Edit size={12} /> : <Shield size={12} />}
            <span>{pageData.isEditable ? "Editable" : "View Only"}</span>
          </div>

          {/* Auto-saving Status Tag */}
          {pageData.isEditable && (
            <div className={`flex items-center gap-1.5 text-[10px] font-semibold transition-opacity duration-300 ${isSaving ? "opacity-100 text-indigo-500" : "opacity-35 text-[var(--editor-text)]"
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

      {/* Floating Toolbar */}
      <FloatingToolbar
        show={toolbarPos.show}
        top={toolbarPos.top}
        left={toolbarPos.left}
        copied={copied}
        isTranslating={isTranslating}
        showTranslateOptions={showTranslateOptions}
        selectedModel={selectedModel}
        models={MODELS}
        languages={LANGUAGES}
        onCopy={handleCopy}
        onToggleTranslate={() => setShowTranslateOptions(!showTranslateOptions)}
        onSetModel={setSelectedModel}
        onTranslate={handleTranslate}
        onApplyColor={pageData?.isEditable ? applyColor : () => {}}
      />

      {/* Shared Document Content Viewport */}
      <div className="w-full max-w-6xl px-8 md:px-20 py-20 mt-12 flex-1">
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

      {/* Translation Result Modal */}
      <TranslationModal
        translationResult={translationResult}
        resultCopied={resultCopied}
        onClose={() => { setTranslationResult(""); setIsTranslating(false); }}
        onCopy={handleResultCopy}
        onApply={pageData?.isEditable ? applyTranslation : undefined}
        customInstruction={customInstruction}
        onSetCustomInstruction={setCustomInstruction}
        onRetranslate={() => handleTranslate(selectedLanguage)}
        isTranslating={isTranslating}
      />

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
