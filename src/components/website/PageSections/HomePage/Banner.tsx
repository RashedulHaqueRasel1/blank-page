"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import FloatingToolbar from "./Editor/FloatingToolbar";
import TranslationModal from "./Editor/TranslationModal";
import FirstVisitCelebration from "@/components/website/Common/FirstVisitCelebration";
import DrawOverlay from "@/components/website/Common/DrawOverlay";
import { TYPING_LANGUAGES } from "@/lib/typing-test";
import { copyCodeBlockFromTarget, createCodeBlockHtml, deleteCodeBlockFromTarget, initializeCodeBlocks, isLikelyCodeSnippet, syncCodeBlockScroll, updateCodeBlockPresentation } from "@/lib/code-blocks";
import { getTextareaSelectionRect } from "@/lib/textarea-selection";

const DB_NAME = "EditorDB";
const STORE_NAME = "Documents";
const DB_VERSION = 4;

const LANGUAGES = TYPING_LANGUAGES.map((language) => language.label);
const MODELS = [
  { id: "m1", label: "Fast Mode" },
  { id: "m2", label: "Pro Mode" }
];
const API_SECRET = "blank_page_secret_token_2026_secure";

interface EditorDocument {
  id: string;
  content: string;
  title: string;
  lastModified: number;
  wasRenamed?: boolean;
  publishedUrl?: string;
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
  const socketRef = useRef<Socket | null>(null);
  const lastLiveSyncRef = useRef<Record<string, string>>({});

  // AI Translation State
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState("");
  const [showTranslateOptions, setShowTranslateOptions] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectedModel, setSelectedModel] = useState("m1");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [resultCopied, setResultCopied] = useState(false);
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [selectedCodeEditor, setSelectedCodeEditor] = useState<HTMLTextAreaElement | null>(null);
  const [drawActive, setDrawActive] = useState(false);
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [drawMode, setDrawMode] = useState<"draw" | "erase">("draw");
  const [drawClearSignal, setDrawClearSignal] = useState(0);

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

  const getOrCreateWriterId = (): string => {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem("writer-id");
    if (!id) {
      const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
      let randomStr = "";
      for (let i = 0; i < 6; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      id = `user-${randomStr}`;
      localStorage.setItem("writer-id", id);
    }
    return id;
  };

  const syncLiveDocument = async (doc: EditorDocument, html: string, title: string) => {
    if (!doc.publishedUrl) return;
    if (lastLiveSyncRef.current[doc.publishedUrl] === html) return;

    const authorId = getOrCreateWriterId();
    if (!authorId) return;

    const response = await fetch(`/api/pages/${doc.publishedUrl}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId, content: html, title }),
    });

    if (!response.ok) {
      throw new Error("Failed to auto update live page");
    }

    lastLiveSyncRef.current[doc.publishedUrl] = html;
    socketRef.current?.emit("edit-page", { customUrl: doc.publishedUrl, content: html });
    window.dispatchEvent(new CustomEvent('published-page-auto-synced', { detail: doc.publishedUrl }));
  };

  const saveDocument = async (html: string) => {
    if (!activeId) return;
    try {
      const db = await openDB();

      // First, get the current doc to check if it was manually renamed
      const currentDoc = await getDocument(activeId) as EditorDocument | null;
      const wasRenamed = currentDoc?.wasRenamed || false;
      const existingTitle = currentDoc?.title || "Untitled";
      const nextTitle = wasRenamed ? existingTitle : generateTitle(html);

      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      await store.put({
        ...currentDoc,
        id: activeId,
        content: html,
        title: nextTitle,
        lastModified: Date.now()
      });
      window.dispatchEvent(new CustomEvent('editor-content-updated'));

      if (currentDoc?.publishedUrl) {
        await syncLiveDocument(currentDoc, html, nextTitle);
      }
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
        initializeCodeBlocks(editorRef.current, true);
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

    // Dispatch word count update
    const text = stripHtml(content);
    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    window.dispatchEvent(new CustomEvent('word-count-update', { detail: count }));

    return () => clearTimeout(timeout);
  }, [content, activeId]);

  // Selection handling for toolbar
  useEffect(() => {
    const handleSelection = () => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.closest('.floating-toolbar')) {
        return;
      }

      const activeCodeEditor =
        document.activeElement instanceof HTMLTextAreaElement &&
        document.activeElement.matches("[data-code-editor]")
          ? document.activeElement
          : null;

      if (activeCodeEditor && editorRef.current?.contains(activeCodeEditor)) {
        const start = activeCodeEditor.selectionStart;
        const end = activeCodeEditor.selectionEnd;
        if (start === end) {
          setSelectedCodeEditor(null);
          setToolbarPos((prev) => ({ ...prev, show: false }));
          setShowTranslateOptions(false);
          return;
        }

        const text = activeCodeEditor.value.slice(start, end).trim();
        if (!text) {
          setSelectedCodeEditor(null);
          setToolbarPos((prev) => ({ ...prev, show: false }));
          setShowTranslateOptions(false);
          return;
        }

        setSelectedCodeEditor(activeCodeEditor);
        setSelectedText(text);
        setSavedRange(null);

        const rect = getTextareaSelectionRect(activeCodeEditor) || activeCodeEditor.getBoundingClientRect();
        const isMobile = window.innerWidth < 768;
        const toolbarTop = rect.top - 60 < 10 ? rect.bottom + 10 : rect.top - 60;

        setToolbarPos({
          top: isMobile ? 64 : toolbarTop,
          left: isMobile ? window.innerWidth / 2 : rect.left + rect.width / 2,
          show: true,
        });
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !editorRef.current?.contains(selection.anchorNode)) {
        setSelectedCodeEditor(null);
        setToolbarPos((prev) => ({ ...prev, show: false }));
        setShowTranslateOptions(false);
        return;
      }

      const text = selection.toString().trim();
      if (text) setSelectedText(text);
      setSelectedCodeEditor(null);

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

  useEffect(() => {
    const editorNode = editorRef.current;
    if (!editorNode) return;

    initializeCodeBlocks(editorNode, true);

    const handleCodeActions = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const copyButton = target?.closest("[data-code-copy-button]") as HTMLElement | null;
      if (copyButton && editorNode.contains(copyButton)) {
        event.preventDefault();
        await copyCodeBlockFromTarget(copyButton);
        return;
      }

      const deleteButton = target?.closest("[data-code-delete-button]") as HTMLElement | null;
      if (!deleteButton || !editorNode.contains(deleteButton)) return;

      event.preventDefault();
      if (!deleteCodeBlockFromTarget(deleteButton)) return;
      initializeCodeBlocks(editorNode, true);
      setContent(editorNode.innerHTML);
      editorNode.focus();
    };

    const handleCodeInput = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const codeEditor = target?.closest("[data-code-editor]") as HTMLTextAreaElement | null;
      if (!codeEditor) return;

      const codeBlock = codeEditor.closest("[data-code-block]") as HTMLElement | null;
      if (!codeBlock) return;

      updateCodeBlockPresentation(codeBlock);
      setContent(editorNode.innerHTML);
    };

    const handleCodeScroll = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const codeEditor = target?.closest("[data-code-editor]") as HTMLTextAreaElement | null;
      if (!codeEditor) return;
      syncCodeBlockScroll(codeEditor);
    };

    editorNode.addEventListener("click", handleCodeActions);
    editorNode.addEventListener("input", handleCodeInput, true);
    editorNode.addEventListener("scroll", handleCodeScroll, true);
    return () => {
      editorNode.removeEventListener("click", handleCodeActions);
      editorNode.removeEventListener("input", handleCodeInput, true);
      editorNode.removeEventListener("scroll", handleCodeScroll, true);
    };
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

    const handleDrawUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ active: boolean; color: string; mode?: "draw" | "erase" }>).detail;
      setDrawActive(Boolean(detail?.active));
      if (detail?.color) setDrawColor(detail.color);
      if (detail?.mode) setDrawMode(detail.mode);
    };
    const handleDrawClear = () => setDrawClearSignal((value) => value + 1);
    window.addEventListener("editor-draw-update", handleDrawUpdate);
    window.addEventListener("editor-draw-clear", handleDrawClear);

    const serverUrl = process.env.NEXT_PUBLIC_API_URL;
    if (serverUrl) {
      let socketUrl = serverUrl;
      try {
        if (serverUrl.startsWith("http://") || serverUrl.startsWith("https://")) {
          socketUrl = new URL(serverUrl).origin;
        }
      } catch (e) {
        console.error("Invalid serverUrl for socket:", e);
      }
      socketRef.current = io(socketUrl);
    }

    const savedId = localStorage.getItem("active_doc_id");
    if (savedId) {
      loadDocument(savedId);
    }

    return () => {
      channel.close();
      socketRef.current?.disconnect();
      window.removeEventListener("font-style-update", handleFontStyle);
      window.removeEventListener("editor-sound-update", handleSoundUpdate);
      window.removeEventListener("editor-draw-update", handleDrawUpdate);
      window.removeEventListener("editor-draw-clear", handleDrawClear);
    };
  }, []);

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

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    playTypewriterSound();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (isLikelyCodeSnippet(text)) {
      document.execCommand("insertHTML", false, createCodeBlockHtml(text));
    } else {
      document.execCommand("insertText", false, text);
    }
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
    playTypewriterSound();
  };

  const handleCopy = () => {
    if (selectedCodeEditor) {
      const selected = selectedCodeEditor.value.slice(selectedCodeEditor.selectionStart, selectedCodeEditor.selectionEnd);
      if (!selected) return;
      navigator.clipboard.writeText(selected);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

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
    if (!translationResult) return;

    if (selectedCodeEditor) {
      const start = selectedCodeEditor.selectionStart;
      const end = selectedCodeEditor.selectionEnd;
      selectedCodeEditor.setRangeText(translationResult, start, end, "end");
      selectedCodeEditor.dispatchEvent(new Event("input", { bubbles: true }));
      setTranslationResult("");
      return;
    }

    if (savedRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }
    }

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
      {/* First Visit Celebration */}
      <FirstVisitCelebration />
      <DrawOverlay active={drawActive} color={drawColor} mode={drawMode} clearSignal={drawClearSignal} />

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
        onApplyColor={applyColor}
      />

      {/* Editor Surface */}
      <div className="w-full max-w-6xl px-6 py-20 md:px-20">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          className={`w-full min-h-[60vh] outline-none text-[18px] md:text-[22px] leading-[1.8] font-${fontStyle} text-[var(--editor-text)] whitespace-pre-wrap transition-all duration-500 selection:bg-[var(--accent-color)] selection:text-[var(--editor-bg)]`}
          style={{ caretColor: 'var(--accent-color)' }}
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
        onApply={applyTranslation}
        customInstruction={customInstruction}
        onSetCustomInstruction={setCustomInstruction}
        onRetranslate={() => handleTranslate(selectedLanguage)}
        isTranslating={isTranslating}
      />

      <style jsx global>{`
        .font-draft { font-family: 'Inter', sans-serif; }
        .font-classic { font-family: 'Merriweather', serif; }
        .font-typewriter { font-family: 'Courier Prime', monospace; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .thin-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        .thin-scrollbar { scrollbar-width: thin; scrollbar-color: var(--border-color) transparent; }

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
