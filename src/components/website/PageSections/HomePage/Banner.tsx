"use client";

import React, { useState, useEffect, useRef } from "react";

// Simple IndexedDB Utility
const DB_NAME = "EditorDB";
const STORE_NAME = "DraftStore";

const saveToDB = (content: string) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    request.result.createObjectStore(STORE_NAME);
  };
  request.onsuccess = () => {
    const db = request.result;
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(content, "current_draft");
  };
};

const getFromDB = (callback: (content: string) => void) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    request.result.createObjectStore(STORE_NAME);
  };
  request.onsuccess = () => {
    const db = request.result;
    const tx = db.transaction(STORE_NAME, "readonly");
    const getRequest = tx.objectStore(STORE_NAME).get("current_draft");
    getRequest.onsuccess = () => {
      callback(getRequest.result || "");
    };
  };
};

export default function Banner() {
  const [text, setText] = useState("");
  const [fontStyle, setFontStyle] = useState("draft");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Handle text changes and auto-save to IndexedDB
  useEffect(() => {
    adjustHeight();
    
    if (text) {
      saveToDB(text);
    }

    // Word count calculation
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    const timeoutId = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("word-count-update", { detail: words }));
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [text]);

  // Initialization and listeners
  useEffect(() => {
    // Restore saved text from IndexedDB
    getFromDB((savedText) => {
      setText(savedText);
    });

    // Restore font style
    const savedStyle = localStorage.getItem("font-style") || "draft";
    
    const timeoutId = setTimeout(() => {
      if (savedStyle !== fontStyle) {
        setFontStyle(savedStyle);
      }
    }, 0);

    const handleFontStyle = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setFontStyle(customEvent.detail || "draft");
    };

    window.addEventListener("font-style-update", handleFontStyle);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      adjustHeight();
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("font-style-update", handleFontStyle);
    };
  }, []);

  const handleContainerClick = () => {
    textareaRef.current?.focus();
  };

  const getFontFamily = () => {
    switch (fontStyle) {
      case "classic": return "var(--font-lora), serif";
      case "modern": return "var(--font-cousine), monospace";
      default: return "var(--font-ibm-plex-sans), sans-serif";
    }
  };

  const getFontSize = () => {
    switch (fontStyle) {
      case "classic": return "22px";
      case "modern": return "18px";
      default: return "20px";
    }
  };

  return (
    <main 
      className="relative min-h-screen bg-[var(--editor-bg)] flex justify-center cursor-text pt-20 pb-40 selection:bg-[#d8d0c0] dark:selection:bg-[#333] transition-all duration-300"
      onClick={handleContainerClick}
    >
      <section className="w-full max-w-[850px] px-6 relative z-10">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start writing..."
          spellCheck={false}
          className="w-full bg-transparent border-none outline-none resize-none 
                     leading-[1.7] text-[var(--editor-text)] 
                     placeholder:text-[#aaa] dark:placeholder:text-[#444] placeholder:font-normal
                     no-scrollbar overflow-hidden transition-all duration-300"
          style={{ 
            fontFamily: getFontFamily(),
            fontSize: getFontSize()
          }}
        />
      </section>
    </main>
  );
}
