"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";

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
      
      setToolbarPos({
        top: rect.top + window.scrollY - 50,
        left: rect.left + rect.width / 2,
        show: true
      });
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
      sound.play().catch(() => {});
    }
  };

  const applyColor = (color: string) => {
    document.execCommand("foreColor", false, color);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
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
          className="fixed z-[100] -translate-x-1/2 flex items-center gap-3 p-2.5 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-200"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
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
