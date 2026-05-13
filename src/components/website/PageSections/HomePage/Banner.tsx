"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import FloatingToolbar from "./Editor/FloatingToolbar";
import TranslationModal from "./Editor/TranslationModal";

const DB_NAME = "EditorDB";
const STORE_NAME = "Documents";
const DB_VERSION = 4;

const LANGUAGES = ["English", "Bengali", "Arabic", "Hindi", "Spanish", "French", "German"];
const MODELS = [
  { id: "m1", label: "Fast Mode" },
  { id: "m2", label: "Pro Mode" }
];
const API_SECRET = "blank_page_secret_token_2026_secure";

interface EditorDocument {
  id: string;
  content: string;
  title: string;
  updatedAt: number;
}

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

const getDocument = async (id: string) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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
  const [customInstruction, setCustomInstruction] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectedModel, setSelectedModel] = useState("m1");
  const [resultCopied, setResultCopied] = useState(false);

  const stripHtml = (html: string) => {
    if (typeof window === "undefined") return html;
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const generateTitle = (html: string) => {
    const text = stripHtml(html);
    const firstLine = text.trim().split("\n")[0];
    if (!firstLine) return "Untitled";
    return firstLine.slice(0, 30) + (firstLine.length > 30 ? "..." : "");
  };

  const saveDocument = async (html: string) => {
    if (!activeId) return;
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      await store.put({
        id: activeId,
        content: html,
        title: generateTitle(html),
        lastModified: Date.now()
      });
      window.dispatchEvent(new CustomEvent('editor-content-updated'));
    } catch (err) {
      console.error("Save Error:", err);
    }
  };

  const loadDocument = async (id: string) => {
    const doc = await getDocument(id) as EditorDocument | null;
    if (doc) {
      setContent(doc.content);
      if (editorRef.current) {
        editorRef.current.innerHTML = doc.content;
      }
      setActiveId(id);
      localStorage.setItem("active_doc_id", id);
    }
  };

  useLayoutEffect(() => {
    if (activeId) {
      loadDocument(activeId);
    }
  }, [activeId]);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    const timeout = setTimeout(() => saveDocument(content), 1000);
    return () => clearTimeout(timeout);
  }, [content, activeId]);

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
        setTranslationResult("");
        return;
      }

      const text = selection.toString().trim();
      if (text) setSelectedText(text);

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;

      setToolbarPos({
        top: isMobile ? 64 : rect.top + window.scrollY - 50,
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
      loadDocument(savedId);
    }

    return () => {
      channel.close();
      window.removeEventListener("font-style-update", handleFontStyle);
      window.removeEventListener("editor-sound-update", handleSoundUpdate);
    };
  }, []);

  const playTypewriterSound = () => {
    if (!soundEnabled) return;
    const sounds = ["/sounds/key1.mp3", "/sounds/key2.mp3", "/sounds/key3.mp3"];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    if (!audioPool.current[randomSound]) {
      audioPool.current[randomSound] = new Audio(randomSound);
    }
    const audio = audioPool.current[randomSound];
    audio.currentTime = 0;
    audio.volume = 0.2;
    audio.play().catch(() => { });
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    playTypewriterSound();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

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
          targetLang,
          customInstruction
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
    if (!translationResult) return;
    document.execCommand("insertHTML", false, translationResult);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
    setTranslationResult("");
  };

  const applyColor = (color: string) => {
    document.execCommand("foreColor", false, color);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  return (
    <main
      className="relative w-full min-h-screen bg-[var(--editor-bg)] flex flex-col items-center cursor-text transition-colors duration-300 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) editorRef.current?.focus();
      }}
    >
      {/* Floating Toolbar */}
      <FloatingToolbar
        show={toolbarPos.show}
        top={toolbarPos.top}
        left={toolbarPos.left}
        copied={copied}
        isTranslating={isTranslating}
        showTranslateOptions={showTranslateOptions}
        customInstruction={customInstruction}
        selectedModel={selectedModel}
        models={MODELS}
        languages={LANGUAGES}
        onCopy={handleCopy}
        onToggleTranslate={() => setShowTranslateOptions(!showTranslateOptions)}
        onSetCustomInstruction={setCustomInstruction}
        onSetModel={setSelectedModel}
        onTranslate={handleTranslate}
        onApplyColor={applyColor}
      />

      {/* Editor Surface */}
      <div className="w-full max-w-6xl px-6 md:px-20 py-20">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          className={`w-full min-h-[60vh] outline-none text-[18px] md:text-[22px] leading-[1.8] font-${fontStyle} text-[var(--editor-text)] whitespace-pre-wrap transition-all duration-500 selection:bg-[var(--accent-color)] selection:text-black`}
          style={{ caretColor: 'var(--accent-color)' }}
          spellCheck="false"
          data-placeholder="Start writing..."
        />
      </div>

      {/* Translation Result Modal */}
      <TranslationModal
        translationResult={translationResult}
        resultCopied={resultCopied}
        onClose={() => setTranslationResult("")}
        onCopy={handleResultCopy}
        onApply={applyTranslation}
      />

      <style jsx global>{`
        .font-draft { font-family: 'Inter', sans-serif; }
        .font-classic { font-family: 'Merriweather', serif; }
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
