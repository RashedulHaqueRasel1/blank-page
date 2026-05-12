"use client";

import React, { useState, useEffect, useRef } from "react";

const DB_NAME = "EditorDB";
const STORE_NAME = "Documents";
const DB_VERSION = 4;

// Define Document Interface
interface EditorDocument {
  id: string;
  title: string;
  content: string;
  lastModified: number;
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
      const data = (getReq.result as EditorDocument) || { id, title: "Untitled", content: "", lastModified: Date.now() };
      data.content = content;
      data.title = title;
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
  // Use Lazy Initialization to avoid setState inside useEffect
  const [text, setText] = useState("");
  const [fontStyle, setFontStyle] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("font-style") || "draft" : "draft"));
  const [activeId, setActiveId] = useState<string | null>(() => (typeof window !== "undefined" ? localStorage.getItem("active_doc_id") : null));
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialLoad = useRef(true);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const generateTitle = (str: string) => {
    const firstLine = str.trim().split("\n")[0];
    if (!firstLine) return "Untitled";
    const words = firstLine.split(/\s+/).slice(0, 10).join(" ");
    return words.length > 50 ? words.substring(0, 50) + "..." : words;
  };

  const loadDocument = async (id: string) => {
    if (!id) return;
    const doc = await getDoc(id);
    if (doc) {
      isInitialLoad.current = true;
      setText(doc.content || "");
      setActiveId(id);
      localStorage.setItem("active_doc_id", id);
      
      const words = doc.content.trim() ? doc.content.trim().split(/\s+/).length : 0;
      window.dispatchEvent(new CustomEvent("word-count-update", { detail: words }));

      setTimeout(() => {
        isInitialLoad.current = false;
        adjustHeight();
        textareaRef.current?.focus();
      }, 50);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (isInitialLoad.current || !activeId) return;
    
    adjustHeight();
    const currentTitle = generateTitle(text);
    saveDoc(activeId, text, currentTitle);
    
    const timeoutId = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("title-updated", { detail: { id: activeId, title: currentTitle } }));
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      window.dispatchEvent(new CustomEvent("word-count-update", { detail: words }));
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [text, activeId]);

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

    // Initial Load - Now we use a small timeout to avoid synchronous setState during mount
    const savedId = localStorage.getItem("active_doc_id");
    if (savedId) {
      setTimeout(() => loadDocument(savedId), 0);
    }

    return () => {
      channel.close();
      window.removeEventListener("font-style-update", handleFontStyle);
    };
  }, []);

  // Sync font style height
  useEffect(() => {
    adjustHeight();
  }, [fontStyle]);

  return (
    <main 
      className="relative w-full min-h-screen bg-[var(--editor-bg)] flex flex-col items-center cursor-text transition-all duration-300 overflow-y-auto" 
      onClick={() => textareaRef.current?.focus()}
    >
      <section className="w-full max-w-[850px] px-6 relative z-10 flex flex-col pt-24 pb-40">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start writing..."
          spellCheck={false}
          className="w-full bg-transparent border-none outline-none resize-none leading-[1.7] text-[var(--editor-text)] placeholder:text-[#aaa] dark:placeholder:text-[#444] no-scrollbar overflow-hidden transition-all duration-300 min-h-[50vh]"
          style={{ 
            fontFamily: fontStyle === "classic" ? "var(--font-lora), serif" : fontStyle === "modern" ? "var(--font-cousine), monospace" : "var(--font-ibm-plex-sans), sans-serif",
            fontSize: fontStyle === "classic" ? "22px" : fontStyle === "modern" ? "18px" : "20px"
          }}
        />
      </section>
    </main>
  );
}
