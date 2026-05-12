"use client";

import { useState, useEffect, useRef } from "react";
import { 
  AlignLeft, MoreHorizontal, Moon, Sun, Type, Maximize2, 
  EyeOff, Eye, X, Plus, FileText, Settings, Trash2, ChevronLeft, Check, Clock 
} from "lucide-react";

const DB_NAME = "EditorDB";
const STORE_NAME = "Documents";
const DB_VERSION = 3;

interface EditorDocument {
  id: string;
  title: string;
  content: string;
  lastModified: number;
}

// --- DATABASE HELPERS ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const fetchAllDocs = async (): Promise<EditorDocument[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const docs = (request.result as EditorDocument[]).sort((a, b) => b.lastModified - a.lastModified);
        resolve(docs);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) { return []; }
};

const createDocInDB = async (title: string): Promise<EditorDocument> => {
  const db = await openDB();
  const id = crypto.randomUUID();
  const now = Date.now();
  const newDoc: EditorDocument = { id, title, content: "", lastModified: now };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.add(newDoc);
    tx.oncomplete = () => resolve(newDoc);
    tx.onerror = () => reject(tx.error);
  });
};

const removeDocFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const ShortcutHint = ({ children }: { children: string }) => (
  <span className="text-[10px] opacity-40 font-mono border border-[var(--border-color)] px-1.5 py-0.5 rounded ml-auto group-hover:opacity-70 transition-opacity uppercase">
    {children}
  </span>
);

export default function Navbar() {
  const [theme, setTheme] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("theme") || "light" : "light"));
  const [showCounter, setShowCounter] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("show-counter") !== "false" : true));
  const [showThemeIcon, setShowThemeIcon] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("show-theme-icon") !== "false" : true));
  const [currentFont, setCurrentFont] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("font-style") || "draft" : "draft"));

  const [wordCount, setWordCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [documents, setDocuments] = useState<EditorDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [menuView, setMenuView] = useState("main"); 
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const refreshDocs = async () => {
    const docs = await fetchAllDocs();
    setDocuments(docs);
    const savedActiveId = localStorage.getItem("active_doc_id");
    if (docs.length === 0) {
      handleCreateNewDoc("First Draft");
    } else if (!savedActiveId || !docs.find(d => d.id === savedActiveId)) {
      handleSwitchDoc(docs[0].id);
    } else {
      setActiveDocId(savedActiveId);
    }
  };

  const handleCreateNewDoc = async (title = "Untitled") => {
    try {
      const newDoc = await createDocInDB(title);
      handleSwitchDoc(newDoc.id);
      setShowSidebar(false);
    } catch (err) { console.error(err); }
  };

  const handleDeleteDoc = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await removeDocFromDB(id);
      if (activeDocId === id) localStorage.removeItem("active_doc_id");
      refreshDocs();
    } catch (err) { console.error(err); }
  };

  const handleSwitchDoc = (id: string) => {
    setActiveDocId(id);
    localStorage.setItem("active_doc_id", id);
    window.dispatchEvent(new CustomEvent("active-doc-update", { detail: id }));
    refreshDocs();
  };

  const toggleTheme = (e: React.MouseEvent) => {
    const newTheme = theme === "light" ? "dark" : "light";
    if (!document.startViewTransition) {
      setTheme(newTheme);
      updateThemeDOM(newTheme);
      return;
    }
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(() => {
      setTheme(newTheme);
      updateThemeDOM(newTheme);
    });
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 500, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
      );
    });
  };

  const updateThemeDOM = (newTheme: string) => {
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const changeFont = (font: string) => {
    setCurrentFont(font);
    localStorage.setItem("font-style", font);
    window.dispatchEvent(new CustomEvent("font-style-update", { detail: font }));
    setShowDropdown(false);
    setMenuView("main");
  };

  // Optimized Effect Handler
  useEffect(() => {
    // 1. Initial DOM Setup (Theme)
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    // 2. Async Data Fetch (Wrapped in timeout to avoid sync cascading renders)
    const dataTimer = setTimeout(() => {
      refreshDocs();
    }, 0);

    // 3. Event Listeners
    const handleWordCount = (e: Event) => setWordCount((e as CustomEvent).detail || 0);
    const handleTitleUpdate = () => refreshDocs();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setMenuView("main");
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && showSidebar) setShowSidebar(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      const key = e.key.toLowerCase();
      if (key === "n") { e.preventDefault(); handleCreateNewDoc(); }
      if (key === "m") { e.preventDefault(); setShowSidebar(true); refreshDocs(); }
      if (key === "escape") { setShowDropdown(false); setShowSidebar(false); setMenuView("main"); }
    };

    window.addEventListener("word-count-update", handleWordCount);
    window.addEventListener("title-updated", handleTitleUpdate);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      clearTimeout(dataTimer);
      window.removeEventListener("word-count-update", handleWordCount);
      window.removeEventListener("title-updated", handleTitleUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSidebar, theme]); // Added dependencies to keep it fresh

  return (
    <>
      {showSidebar && <div className="fixed inset-0 bg-black/5 dark:bg-black/20 backdrop-blur-[2px] z-[90] transition-all duration-300" />}

      <div ref={sidebarRef} className={`fixed top-0 left-0 h-full w-[280px] bg-[var(--editor-bg)] border-r border-[var(--border-color)] z-[100] transform transition-transform duration-300 ease-out shadow-2xl ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10">
            <span className="text-[14px] font-bold tracking-widest uppercase opacity-40">Blank Page</span>
            <button onClick={() => setShowSidebar(false)} className="text-[#666] hover:text-black dark:hover:text-white transition-colors">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          <button onClick={() => handleCreateNewDoc()} className="flex items-center justify-center gap-3 w-full py-3.5 mb-10 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.03] dark:bg-white/[0.03] text-[14px] font-semibold text-black dark:text-white transition-all hover:bg-black/[0.08] dark:hover:bg-white/[0.08] active:scale-[0.98] cursor-pointer group">
            <Plus size={18} className="opacity-60 group-hover:opacity-100 transition-opacity" /> New Document
          </button>

          <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar flex-1 pr-2">
            <div className="flex items-center justify-between px-4 mb-4">
              <span className="text-[14px] font-bold opacity-30">Active Tabs</span>
            </div>
            {documents.map((doc) => (
              <div key={doc.id} className="group relative flex items-center mb-2 cursor-pointer">
                <button onClick={() => handleSwitchDoc(doc.id)} className={`flex items-start gap-3 px-4 py-3 rounded-xl text-[14px] transition-all text-left flex-1 min-w-0 pr-12 cursor-pointer ${activeDocId === doc.id ? 'bg-black/5 dark:bg-white/5 text-black dark:text-white font-medium' : 'text-[#666] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] hover:text-black dark:hover:text-white'}`}>
                  <FileText size={16} className={`shrink-0 mt-0.5 ${activeDocId === doc.id ? 'opacity-100 text-black dark:text-white' : 'opacity-30 group-hover:opacity-100'}`} />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate flex-1 overflow-hidden whitespace-nowrap">{doc.title}</span>
                    <span className="text-[10px] opacity-40 mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> {formatTime(doc.lastModified)}
                    </span>
                  </div>
                  {activeDocId === doc.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-black dark:bg-white rounded-r-full" />}
                </button>
                <button onClick={(e) => handleDeleteDoc(e, doc.id)} className="absolute right-2 p-2 text-[#666] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 z-10 cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <nav className="w-full h-14 bg-transparent flex items-center justify-between px-6 fixed top-0 left-0 z-50 transition-all duration-300 md:pointer-events-none">
        <div className="flex items-center gap-5 md:pointer-events-auto">
          <button onClick={() => { setShowSidebar(true); refreshDocs(); }} className="text-[#666] hover:text-black dark:hover:text-white transition-colors duration-200">
            <AlignLeft size={22} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-center gap-6 text-[#666] md:pointer-events-auto">
          {showCounter && <span className="text-[13px] font-medium tracking-tight opacity-70 select-none">{wordCount} words</span>}
          <div className="flex items-center gap-5 relative">
            {showThemeIcon && (
              <button onClick={toggleTheme} className="hover:text-black dark:hover:text-white transition-colors duration-200">
                {theme === "light" ? <Moon size={19} strokeWidth={1.5} /> : <Sun size={19} strokeWidth={1.5} />}
              </button>
            )}

            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowDropdown(!showDropdown)} className="hover:text-black dark:hover:text-white transition-colors duration-200">
                <MoreHorizontal size={19} strokeWidth={1.5} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-[var(--navbar-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl py-1.5 z-[60] overflow-hidden animate-in fade-in zoom-in duration-200">
                  {menuView === "main" ? (
                    <>
                      <button onClick={() => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); setShowDropdown(false); }} className="w-full text-left px-4 py-2 text-[13px] text-[var(--editor-text)] hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center group">
                        <div className="flex items-center gap-3"><Maximize2 size={15} /> Full screen</div>
                        <ShortcutHint>F</ShortcutHint>
                      </button>
                      <button onClick={() => setMenuView("fonts")} className="w-full text-left px-4 py-2 text-[13px] text-[var(--editor-text)] hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center group">
                        <div className="flex items-center gap-3"><Type size={15} /> Font style</div>
                      </button>
                      <div className="h-[1px] bg-[var(--border-color)] my-1" />
                      <button onClick={() => { const val = !showCounter; setShowCounter(val); localStorage.setItem("show-counter", String(val)); }} className="w-full text-left px-4 py-2 text-[13px] text-[var(--editor-text)] hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center group">
                        <div className="flex items-center gap-3">{showCounter ? <EyeOff size={15} /> : <Eye size={15} />} {showCounter ? "Hide counter" : "Show counter"}</div>
                        <ShortcutHint>C</ShortcutHint>
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setMenuView("main")} className="w-full text-left px-4 py-2 text-[13px] opacity-40 hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center gap-3 transition-all">
                        <ChevronLeft size={14} /> Back
                      </button>
                      <div className="h-[1px] bg-[var(--border-color)] my-1" />
                      {["draft", "classic", "modern"].map((font) => (
                        <button key={font} onClick={() => changeFont(font)} className="w-full text-left px-4 py-2 text-[13px] text-[var(--editor-text)] hover:bg-[#f5f5f5] dark:hover:bg-[#222] flex items-center justify-between group capitalize">
                          {font} {currentFont === font && <Check size={14} className="text-black dark:text-white" />}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}