"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Copy, Check, Languages, Loader2, RefreshCw, X } from "lucide-react";

const DB_NAME = "EditorDB";
const STORE_NAME = "Documents";
const DB_VERSION = 4;

// Define Document Interface
interface EditorDocument {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  pinned?: boolean;
  wasRenamed?: boolean;
}

// Pure Helpers - Outside component
const getDB = (): Promise<IDBDatabase> => {
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

const saveDoc = async (id: string, content: string, title: string) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const data = (getReq.result as EditorDocument) || { id, title: "Untitled", content: "", lastModified: Date.now(), wasRenamed: false };
      data.content = content;
      // Only update title if it hasn't been manually renamed
      if (!data.wasRenamed) {
        data.title = title;
      }
      data.lastModified = Date.now();
      store.put(data);
    };
  } catch (err) {
    console.error("Save Doc Error:", err);
  }
};

const getDoc = async (id: string): Promise<EditorDocument | null> => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result as EditorDocument);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
};

export default function Banner() {
  const [content, setContent] = useState("");
  const [fontStyle, setFontStyle] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("font-style") || "draft" : "draft"));
  const [activeId, setActiveId] = useState<string | null>(() => (typeof window !== "undefined" ? localStorage.getItem("active_doc_id") : null));
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number; show: boolean }>({ top: 0, left: 0, show: false });
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("typewriter-sound") === "true" : false));

  const editorRef = useRef<HTMLDivElement>(null);
  const audioPool = useRef<Record<string, HTMLAudioElement>>({});
  const isInitialLoad = useRef(true);

  // AI Translation State
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState("");
  const [showTranslateOptions, setShowTranslateOptions] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const LANGUAGES = ["English", "Bengali", "Arabic", "Hindi", "Spanish", "French", "German"];
  const MODELS = [
    { id: "m1", label: "Fast Mode" },
    { id: "m2", label: "Pro Mode" }
  ];
  const [selectedModel, setSelectedModel] = useState("m1");
  const API_SECRET = "blank_page_secret_token_2026_secure";

  const stripHtml = (html: string) => {
    if (typeof window === "undefined") return html;
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const generateTitle = (html: string) => {
    const text = stripHtml(html);
    const firstLine = text.trim().split("\n")[0];
    if (!firstLine) return "Untitled";
    const words = firstLine.split(/\s+/).slice(0, 10).join(" ");
    return words.length > 50 ? words.substring(0, 50) + "..." : words;
  };

  const loadDocument = async (id: string) => {
    if (!id) return;
    const doc = await getDoc(id);
    if (doc) {
      isInitialLoad.current = true;
      const loadedContent = doc.content || "";
      setContent(loadedContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = loadedContent;
      }
      setActiveId(id);
      localStorage.setItem("active_doc_id", id);

      const words = stripHtml(loadedContent).trim() ? stripHtml(loadedContent).trim().split(/\s+/).length : 0;
      window.dispatchEvent(new CustomEvent("word-count-update", { detail: words }));

      setTimeout(() => {
        isInitialLoad.current = false;
        editorRef.current?.focus();
      }, 50);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (isInitialLoad.current || !activeId) return;

    const currentTitle = generateTitle(content);
    saveDoc(activeId, content, currentTitle);

    const timeoutId = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("title-updated", { detail: { id: activeId, title: currentTitle } }));
      const words = stripHtml(content).trim() ? stripHtml(content).trim().split(/\s+/).length : 0;
      window.dispatchEvent(new CustomEvent("word-count-update", { detail: words }));
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [content, activeId]);

  // Selection handling for toolbar
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !editorRef.current?.contains(selection.anchorNode)) {
        setToolbarPos((prev) => ({ ...prev, show: false }));
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;

      setToolbarPos({
        top: isMobile ? 64 : rect.top + window.scrollY - 50,
        left: isMobile ? window.innerWidth / 2 : rect.left + rect.width / 2,
        show: true
      });

      // Reset translation state on new selection
      setShowTranslateOptions(false);
      setTranslationResult("");
    };

    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  // Main Communication and Init
  useEffect(() => {
    const channel = new BroadcastChannel('editor-sync');
    channel.onmessage = (event) => {
      if (event.data.type === 'SWITCH_DOC' && event.data.id) {
        loadDocument(event.data.id);
      }
    };

    const handleFontStyle = (e: Event) => {
      const style = (e as CustomEvent).detail || "draft";
      setFontStyle(style);
    };
    window.addEventListener("font-style-update", handleFontStyle);

    const handleSoundUpdate = (e: Event) => {
      setSoundEnabled((e as CustomEvent).detail);
    };
    window.addEventListener("editor-sound-update", handleSoundUpdate);

    const savedId = localStorage.getItem("active_doc_id");
    if (savedId) {
      setTimeout(() => loadDocument(savedId), 0);
    }

    // Pre-load kbs.im samples
    const samples = ["kbs1", "kbs2", "kbs3", "kbs4"];
    samples.forEach(s => {
      const audio = new Audio(`/sounds/${s}.mp3`);
      audio.preload = "auto";
      audioPool.current[s] = audio;
    });

    return () => {
      channel.close();
      window.removeEventListener("font-style-update", handleFontStyle);
      window.removeEventListener("editor-sound-update", handleSoundUpdate);
    };
  }, []);

  const playASMRSound = (type: "regular" | "space" | "enter" | "backspace") => {
    if (!soundEnabled) return;

    let sample = "kbs1";
    if (type === "space") sample = "kbs2";
    else if (type === "enter") sample = "kbs3";
    else if (type === "backspace") sample = "kbs4";

    const baseAudio = audioPool.current[sample];
    if (!baseAudio) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as Window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaElementSource(baseAudio.cloneNode() as HTMLAudioElement);
      const gainNode = audioCtx.createGain();

      // Boost volume (2.0 = 200%, 3.0 = 300%)
      gainNode.gain.setValueAtTime(type === "space" ? 2.5 : 1.8, audioCtx.currentTime);

      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      (source.mediaElement as HTMLAudioElement).play();

      // Clean up context after sound finishes
      setTimeout(() => audioCtx.close(), 1000);
    } catch (e) {
      // Fallback to simple playback if Web Audio fails
      const sound = baseAudio.cloneNode() as HTMLAudioElement;
      sound.volume = 1.0;
      sound.play().catch(() => { });
    }
  };

  const applyColor = (color: string) => {
    document.execCommand("foreColor", false, color);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleTranslate = async (targetLang: string) => {
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) return;

    const text = selection.toString().trim();
    setIsTranslating(true);
    setShowTranslateOptions(false);

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
          targetLang
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

  const applyTranslation = () => {
    if (!translationResult) return;
    document.execCommand("insertHTML", false, translationResult);
    setTranslationResult("");
    setToolbarPos(prev => ({ ...prev, show: false }));
    if (editorRef.current) setContent(editorRef.current.innerHTML);
  };

  const handleCopy = async () => {
    const selection = window.getSelection();
    if (selection) {
      const text = selection.toString();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setContent(e.currentTarget.innerHTML);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let type: "regular" | "space" | "enter" | "backspace" = "regular";
    if (e.key === " ") type = "space";
    else if (e.key === "Enter") type = "enter";
    else if (e.key === "Backspace") type = "backspace";

    playASMRSound(type);
  };

  return (
    <main
      className="relative w-full min-h-screen bg-[var(--editor-bg)] flex flex-col items-center cursor-text transition-colors duration-300 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) editorRef.current?.focus();
      }}
    >
      {/* Floating Toolbar */}
      {toolbarPos.show && (
        <div
          className="fixed z-[100] -translate-x-1/2 flex items-center gap-3 p-2.5 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 animate-in fade-in zoom-in slide-in-from-top-2 md:slide-in-from-bottom-2 duration-200"
          style={{
            top: toolbarPos.top,
            left: toolbarPos.left,
            maxWidth: "90vw"
          }}
        >
          <div className="flex items-center gap-2 border-r border-gray-100 dark:border-white/10 pr-3 mr-1">
            {[
              { color: "inherit", label: "Default" },
              { color: "#ef4444", label: "Red" },
              { color: "#3b82f6", label: "Blue" },
              { color: "#10b981", label: "Green" },
              { color: "#f59e0b", label: "Amber" },
              { color: "#8b5cf6", label: "Purple" },
            ].map((item) => (
              <button
                key={item.color}
                onClick={() => applyColor(item.color)}
                className="w-5 h-5 rounded-full border border-gray-200 dark:border-white/20 hover:scale-125 transition-transform cursor-pointer"
                style={{ backgroundColor: item.color === "inherit" ? "transparent" : item.color }}
                title={item.label}
              />
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gray-500 dark:text-gray-400"
            title="Copy selection"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowTranslateOptions(!showTranslateOptions)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gray-500 dark:text-gray-400 flex items-center gap-1"
              title="Translate"
            >
              {isTranslating ? <Loader2 size={16} className="animate-spin text-accent-color" /> : <Languages size={16} />}
            </button>

            {showTranslateOptions && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 py-2 z-[110] animate-in fade-in zoom-in duration-200">
                <div className="px-3 mb-2 pb-2 border-b border-gray-100 dark:border-white/10">
                  <span className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">AI Model</span>
                  <div className="flex gap-1 mt-1">
                    {MODELS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedModel(m.id)}
                        className={`flex-1 py-1 text-[9px] rounded-md transition-all ${selectedModel === m.id ? 'bg-[var(--accent-color)] text-black cursor-pointer font-bold' : 'hover:bg-gray-100 dark:hover:bg-white/5 opacity-60 cursor-pointer '}`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="px-3 text-[10px] font-bold opacity-30 uppercase tracking-tighter">Target Language</span>
                <div className="mt-1">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => handleTranslate(lang)}
                      className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Translation Result Modal */}
      {translationResult && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-[400px] bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-[10px] font-bold tracking-widest uppercase opacity-40">Translation Result</h4>
            <button 
              onClick={() => setTranslationResult("")}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer opacity-40 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[14px] leading-relaxed mb-6 text-[var(--editor-text)]">{translationResult}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setTranslationResult("")}
              className="flex-1 py-2.5 text-[12px] font-medium rounded-xl border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={applyTranslation}
              className="flex-1 py-2.5 text-[12px] font-bold rounded-xl bg-[var(--accent-color)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-black cursor-pointer"
            >
              <RefreshCw size={14} /> Replace Text
            </button>
          </div>
        </div>
      )}

      <section className="w-full max-w-[900px] px-6 relative z-10 flex flex-col pt-20 pb-40">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none outline-none resize-none leading-[1.7] text-[var(--editor-text)] placeholder:empty:before:content-[attr(data-placeholder)] placeholder:empty:before:text-[#aaa] dark:placeholder:empty:before:text-[#444] no-scrollbar overflow-hidden transition-colors duration-200 min-h-[50vh]"
          data-placeholder="Start writing..."
          spellCheck={false}
          style={{
            fontFamily: fontStyle === "classic" ? "var(--font-lora), serif" : fontStyle === "modern" ? "var(--font-cousine), monospace" : "var(--font-ibm-plex-sans), sans-serif",
            fontSize: fontStyle === "classic" ? "20px" : fontStyle === "modern" ? "20px" : "22px",
          }}
        />
      </section>
    </main>
  );
}
