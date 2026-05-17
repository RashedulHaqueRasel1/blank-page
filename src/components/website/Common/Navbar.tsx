"use client";

import { useState, useEffect, useRef } from "react";
import {
  AlignLeft, MoreHorizontal, Type, Maximize2, Palette,
  EyeOff, Eye, X, Plus, FileText, Trash2, ChevronLeft, Check, Clock,
  Pin, PinOff, Edit3, MoreVertical, ChevronRight, Volume2, VolumeX, Globe
} from "lucide-react";
import PublishModal from "@/components/website/PageSections/HomePage/Editor/PublishModal";

const DB_NAME = "EditorDB";
const STORE_NAME = "Documents";
const DB_VERSION = 4;

interface EditorDocument {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  pinned?: boolean;
  wasRenamed?: boolean;
  publishedUrl?: string;
}

const THEMES = [
  { id: "light", name: "Light Mode", color: "#ffffff" },
  { id: "dark", name: "Dark Mode", color: "#121212" },
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
        const docs = (request.result as EditorDocument[]).sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.lastModified - a.lastModified;
        });
        resolve(docs);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) { return []; }
};

const getDocument = async (id: string): Promise<EditorDocument | null> => {
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

const updateDocInDB = async (id: string, updates: Partial<EditorDocument>): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const data = { ...getReq.result, ...updates, lastModified: Date.now() };
      store.put(data);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const createDocInDB = async (title: string): Promise<EditorDocument> => {
  const db = await openDB();
  const id = crypto.randomUUID();
  const now = Date.now();
  const newDoc: EditorDocument = { id, title, content: "", lastModified: now, pinned: false, wasRenamed: false };
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
  const [theme, setTheme] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("app-theme") || "light" : "light"));
  const [showCounter, setShowCounter] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("show-counter") !== "false" : true));
  const [currentFont, setCurrentFont] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("font-style") || "draft" : "draft"));
  const [soundEnabled, setSoundEnabled] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("typewriter-sound") === "true" : false));

  const [wordCount, setWordCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [documents, setDocuments] = useState<EditorDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [menuView, setMenuView] = useState("main");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; id: string; currentTitle: string; isPublished?: boolean }>({ isOpen: false, id: "", currentTitle: "", isPublished: false });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: "" });
  const [newTitleValue, setNewTitleValue] = useState("");
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "info" }>({ show: false, message: "", type: "success" });

  // Publish Modal States
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [publishContent, setPublishContent] = useState("");

  // Tab states: 'local' (drafts) or 'published' (pages in MongoDB)
  const [sidebarTab, setSidebarTab] = useState<"local" | "published">("local");
  const [publishedPages, setPublishedPages] = useState<any[]>([]);
  const [isPublishedLoading, setIsPublishedLoading] = useState(false);

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

  const fetchPublishedPages = async () => {
    const authorId = getOrCreateWriterId();
    if (!authorId) return;

    setIsPublishedLoading(true);
    try {
      const res = await fetch(`/api/pages/author/${authorId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPublishedPages(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch published pages:", err);
    } finally {
      setIsPublishedLoading(false);
    }
  };

  const [activeDocPublishedUrl, setActiveDocPublishedUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkActiveDoc = async () => {
      if (activeDocId) {
        const doc = await getDocument(activeDocId) as EditorDocument | null;
        if (doc?.publishedUrl) {
          setActiveDocPublishedUrl(doc.publishedUrl);
        } else {
          setActiveDocPublishedUrl(null);
        }
      } else {
        setActiveDocPublishedUrl(null);
      }
    };
    checkActiveDoc();
  }, [activeDocId, documents]);

  const handlePublishSuccess = async (customUrl?: string) => {
    if (activeDocId && customUrl) {
      try {
        await updateDocInDB(activeDocId, { publishedUrl: customUrl });
        refreshDocs(true);
      } catch (err) {
        console.error(err);
      }
    }
    fetchPublishedPages();
  };

  const handleTogglePinPublished = async (e: React.MouseEvent, customUrl: string, currentPinned: boolean) => {
    e.stopPropagation();
    try {
      const authorId = getOrCreateWriterId();
      const res = await fetch(`/api/pages/${customUrl}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId, pinned: !currentPinned }),
      });
      if (res.ok) {
        fetchPublishedPages();
        showToast(currentPinned ? "Page unpinned" : "Page pinned");
      } else {
        showToast("Failed to pin page");
      }
    } catch (err) {
      console.error(err);
      showToast("Error pinning page");
    }
  };

  const handleImportPublishedPage = async (e: React.MouseEvent, page: any) => {
    e.stopPropagation();
    try {
      const docs = await fetchAllDocs();
      const existingDoc = docs.find(d => d.publishedUrl === page.customUrl);
      if (existingDoc) {
        handleSwitchDoc(existingDoc.id);
        showToast("Switched to existing local draft");
        return;
      }

      const res = await fetch(`/api/pages/${page.customUrl}`);
      const data = await res.json();
      if (!data.success || !data.data) {
        showToast("Failed to fetch page content");
        return;
      }

      const db = await openDB();
      const id = crypto.randomUUID();
      const now = Date.now();
      const newDoc = {
        id,
        title: page.title || "Untitled Published Page",
        content: data.data.content || "",
        lastModified: now,
        pinned: false,
        wasRenamed: true,
        publishedUrl: page.customUrl,
      };

      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.add(newDoc);
      
      tx.oncomplete = () => {
        handleSwitchDoc(id);
        showToast("Imported successfully! Edits can now be updated live.");
      };
    } catch (err) {
      console.error(err);
      showToast("Error importing page");
    }
  };

  const handleSyncLivePage = async () => {
    if (!activeDocId || !activeDocPublishedUrl) return;
    const doc = await getDocument(activeDocId) as EditorDocument | null;
    if (!doc) return;

    try {
      showToast("Updating live page...", "info");
      const authorId = getOrCreateWriterId();
      
      let activeIp = "";
      try {
        const res = await fetch('/api/sync');
        const data = await res.json();
        if (data.session) activeIp = atob(data.session);
      } catch (err) {}

      const res = await fetch(`/api/pages/${activeDocPublishedUrl}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId,
          content: doc.content,
          title: doc.title,
          ip: activeIp || undefined
        }),
      });

      if (res.ok) {
        showToast("Live page updated successfully!");
        fetchPublishedPages();
      } else {
        showToast("Failed to update live page", "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating live page", "info");
    }
  };

  const openDeleteModal = (customUrl: string) => {
    setDeleteModal({ isOpen: true, id: customUrl });
    setActiveMenuId(null);
  };

  const executeDeletePublishedPage = async () => {
    if (!deleteModal.id) return;
    try {
      const res = await fetch(`/api/pages/${deleteModal.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Published page deleted successfully", "info");
        fetchPublishedPages();
        if (activeDocPublishedUrl === deleteModal.id) {
          setActiveDocPublishedUrl(null);
        }
      } else {
        showToast("Failed to delete published page", "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting published page", "info");
    } finally {
      setDeleteModal({ isOpen: false, id: "" });
    }
  };

  useEffect(() => {
    if (showSidebar && sidebarTab === "published") {
      fetchPublishedPages();
    }
  }, [showSidebar, sidebarTab]);

  const handleOpenPublishModal = async () => {
    if (!activeDocId) return;
    const doc = await getDocument(activeDocId) as EditorDocument | null;
    if (doc) {
      setPublishContent(doc.content || "");
      setIsPublishOpen(true);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const syncChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    syncChannel.current = new BroadcastChannel('editor-sync');
    return () => syncChannel.current?.close();
  }, []);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const refreshDocs = async (keepSidebarOpen = false) => {
    const docs = await fetchAllDocs();
    setDocuments(docs);
    const savedActiveId = localStorage.getItem("active_doc_id");
    if (docs.length === 0) {
      handleCreateNewDoc("First Draft");
    } else if (!savedActiveId || !docs.find(d => d.id === savedActiveId)) {
      handleSwitchDoc(docs[0].id, keepSidebarOpen);
    } else {
      setActiveDocId(savedActiveId);
    }
  };

  const handleCreateNewDoc = async (title = "Untitled") => {
    try {
      const newDoc = await createDocInDB(title);
      handleSwitchDoc(newDoc.id);
    } catch (err) { console.error(err); }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await removeDocFromDB(id);
      if (activeDocId === id) localStorage.removeItem("active_doc_id");
      setActiveMenuId(null);
      refreshDocs(true);
      showToast("Document deleted", "info");
    } catch (err) { console.error(err); }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await updateDocInDB(id, { pinned: !currentPinned });
      setActiveMenuId(null);
      refreshDocs(true);
      showToast(currentPinned ? "Document unpinned" : "Document pinned");
    } catch (err) { console.error(err); }
  };

  const handleOpenRenameModal = (id: string, title: string) => {
    setRenameModal({ isOpen: true, id, currentTitle: title });
    setNewTitleValue(title);
    setActiveMenuId(null);
  };

  const handleSaveRename = async () => {
    if (newTitleValue.trim() && newTitleValue !== renameModal.currentTitle) {
      try {
        if (renameModal.isPublished) {
          const authorId = getOrCreateWriterId();
          const res = await fetch(`/api/pages/${renameModal.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ authorId, title: newTitleValue.trim() }),
          });
          if (res.ok) {
            setRenameModal({ isOpen: false, id: "", currentTitle: "" });
            fetchPublishedPages();
            showToast("Published page title updated");
          } else {
            showToast("Failed to update title");
          }
        } else {
          await updateDocInDB(renameModal.id, { title: newTitleValue.trim(), wasRenamed: true });
          setRenameModal({ isOpen: false, id: "", currentTitle: "" });
          refreshDocs(true);
          showToast("Title updated");
        }
      } catch (err) { console.error(err); }
    } else {
      setRenameModal({ isOpen: false, id: "", currentTitle: "" });
    }
  };

  const handleSwitchDoc = (id: string, keepSidebarOpen = false) => {
    setActiveDocId(id);
    localStorage.setItem("active_doc_id", id);
    syncChannel.current?.postMessage({ type: 'SWITCH_DOC', id });
    if (!keepSidebarOpen) setShowSidebar(false);
    refreshDocs(keepSidebarOpen);
  };

  const changeTheme = (newTheme: string, e?: React.MouseEvent) => {
    const performChange = () => {
      setTheme(newTheme);
      localStorage.setItem("app-theme", newTheme);

      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.removeAttribute('data-theme');
      } else if (newTheme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };

    if (!document.startViewTransition || !e) {
      performChange();
      setShowDropdown(false);
      setMenuView("main");
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const transition = document.startViewTransition(() => {
      performChange();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 500, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
      );
    });

    setShowDropdown(false);
    setMenuView("main");
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem("typewriter-sound", String(newVal));
    window.dispatchEvent(new CustomEvent("editor-sound-update", { detail: newVal }));
  };

  const changeFont = (font: string) => {
    setCurrentFont(font);
    localStorage.setItem("font-style", font);
    window.dispatchEvent(new CustomEvent("font-style-update", { detail: font }));
    setShowDropdown(false);
    setMenuView("main");
  };

  useEffect(() => {
    // Initial theme apply
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme !== 'light') {
      document.documentElement.setAttribute('data-theme', theme);
    }

    const dataTimer = setTimeout(() => refreshDocs(showSidebar), 0);
    const handleWordCount = (e: Event) => setWordCount((e as CustomEvent).detail || 0);
    const handleTitleUpdate = () => refreshDocs(showSidebar);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setMenuView("main");
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && showSidebar) {
        if (!(event.target as HTMLElement).closest('.doc-menu-container')) {
          setShowSidebar(false);
        }
      }
      if (!(event.target as HTMLElement).closest('.doc-menu-container')) {
        setActiveMenuId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (renameModal.isOpen) {
        if (e.key === "Escape") setRenameModal({ isOpen: false, id: "", currentTitle: "" });
        return;
      }
      if (
        (e.target as HTMLElement).isContentEditable ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      ) return;
      const key = e.key.toLowerCase();
      if (key === "n" && e.shiftKey) { e.preventDefault(); handleCreateNewDoc(); }
      if (key === "m" && e.shiftKey) { e.preventDefault(); setShowSidebar(true); refreshDocs(true); }
      if (key === "escape") { setShowDropdown(false); setShowSidebar(false); setMenuView("main"); setActiveMenuId(null); }
    };

    window.addEventListener("word-count-update", handleWordCount);
    window.addEventListener("title-updated", handleTitleUpdate);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    // Prevent body scroll when sidebar is open (Mobile fix)
    if (showSidebar) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      clearTimeout(dataTimer);
      document.body.style.overflow = "unset";
      window.removeEventListener("word-count-update", handleWordCount);
      window.removeEventListener("title-updated", handleTitleUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSidebar, theme, renameModal]);

  return (
    <>
      {/* Global Toast */}
      {toast.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-gray-100 dark:border-white/10 shadow-2xl">
            <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`} />
            <span className="text-[13px] font-medium text-[var(--editor-text)] whitespace-nowrap">{toast.message}</span>
            <Check size={14} className={toast.type === 'success' ? 'text-green-500' : 'text-blue-500'} />
          </div>
        </div>
      )}

      {showSidebar && <div className="fixed inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-xl z-[90] transition-all duration-300" />}

      {/* Rename Modal */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl" onClick={() => setRenameModal({ isOpen: false, id: "", currentTitle: "" })} />
          <div className="relative w-full max-w-[320px] rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" style={{ background: "var(--editor-bg)", border: "1px solid var(--border-color)" }}>
            <h3 className="text-[14px] font-bold opacity-30 mb-4 uppercase tracking-widest" style={{ color: "var(--editor-text)" }}>
              {renameModal.isPublished ? "Rename Published Page" : "Rename Draft"}
            </h3>
            <input
              autoFocus
              type="text"
              value={newTitleValue}
              onChange={(e) => setNewTitleValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveRename();
              }}
              className="w-full border-none outline-none px-4 py-3 rounded-xl text-[14px] mb-6"
              style={{ background: "color-mix(in srgb, var(--editor-text) 6%, transparent)", color: "var(--editor-text)" }}
              placeholder="Enter new title..."
            />
            <div className="flex gap-3">
              <button onClick={() => setRenameModal({ isOpen: false, id: "", currentTitle: "" })} className="flex-1 py-3 text-[13px] font-medium rounded-xl cursor-pointer transition-colors hover:opacity-80" style={{ border: "1px solid var(--border-color)", color: "var(--editor-text)" }}>Cancel</button>
              <button onClick={handleSaveRename} className="flex-1 py-3 text-[13px] font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer" style={{ background: "var(--accent-color)", color: "var(--editor-bg)" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl" onClick={() => setDeleteModal({ isOpen: false, id: "" })} />
          <div className="relative w-full max-w-[320px] rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" style={{ background: "var(--editor-bg)", border: "1px solid var(--border-color)" }}>
            <h3 className="text-[14px] font-bold text-red-500 mb-4 uppercase tracking-widest">Delete Page</h3>
            <p className="text-[13px] mb-6 opacity-70" style={{ color: "var(--editor-text)" }}>
              Are you sure you want to permanently delete this published page from the web?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ isOpen: false, id: "" })} className="flex-1 py-3 text-[13px] font-medium rounded-xl cursor-pointer transition-colors hover:opacity-80" style={{ border: "1px solid var(--border-color)", color: "var(--editor-text)" }}>Cancel</button>
              <button onClick={executeDeletePublishedPage} className="flex-1 py-3 text-[13px] font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-white bg-red-500 hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div ref={sidebarRef} className={`fixed top-0 left-0 h-full w-[280px] bg-[var(--editor-bg)] border-r border-[var(--border-color)] z-[100] transform transition-transform duration-300 ease-out shadow-2xl ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10">
            <span className="text-[14px] font-bold tracking-widest uppercase opacity-40" style={{ color: "var(--editor-text)" }}>Blank Page</span>
            <button onClick={() => setShowSidebar(false)} className="transition-colors cursor-pointer opacity-50 hover:opacity-100" style={{ color: "var(--editor-text)" }}>
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex p-1 rounded-xl mb-6" style={{ background: "color-mix(in srgb, var(--editor-text) 5%, transparent)", border: "1px solid var(--border-color)" }}>
            <button
              onClick={() => setSidebarTab("local")}
              className="flex-1 py-2 text-[12px] font-bold rounded-lg transition-all cursor-pointer text-center"
              style={{
                background: sidebarTab === "local" ? "var(--editor-text)" : "transparent",
                color: sidebarTab === "local" ? "var(--editor-bg)" : "color-mix(in srgb, var(--editor-text) 50%, transparent)",
              }}
            >
              Local Drafts
            </button>
            <button
              onClick={() => setSidebarTab("published")}
              className="flex-1 py-2 text-[12px] font-bold rounded-lg transition-all cursor-pointer text-center"
              style={{
                background: sidebarTab === "published" ? "var(--editor-text)" : "transparent",
                color: sidebarTab === "published" ? "var(--editor-bg)" : "color-mix(in srgb, var(--editor-text) 50%, transparent)",
              }}
            >
              Published Pages
            </button>
          </div>

          {sidebarTab === "local" ? (
            <>
              <button onClick={() => handleCreateNewDoc()} className="flex items-center justify-center gap-3 w-full py-3.5 mb-6 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98] cursor-pointer group" style={{ border: "1px solid var(--border-color)", background: "var(--accent-color)10", color: "var(--editor-text) " }}>
                <Plus size={18} className="opacity-60 group-hover:opacity-100 transition-opacity" /> New Document
              </button>

              <div
                className="flex flex-col gap-1 overflow-y-auto no-scrollbar flex-1 pr-2"
                style={{ overscrollBehavior: 'contain' }}
              >
                <div className="flex items-center justify-between px-4 mb-4">
                  <span className="text-[14px] font-bold opacity-30" style={{ color: "var(--editor-text)" }}>Active Tabs</span>
                </div>
                {documents.map((doc) => (
                  <div key={doc.id} className="group relative flex items-center mb-1 doc-menu-container">
                    <button
                      onClick={() => handleSwitchDoc(doc.id)}
                      className="flex items-start gap-3 px-4 py-3 rounded-xl text-[14px] transition-all text-left flex-1 min-w-0 pr-12 cursor-pointer"
                      style={{
                        background: activeDocId === doc.id ? "color-mix(in srgb, var(--editor-text) 6%, transparent)" : "transparent",
                        color: activeDocId === doc.id ? "var(--editor-text)" : "color-mix(in srgb, var(--editor-text) 50%, transparent)",
                        fontWeight: activeDocId === doc.id ? 500 : 400,
                      }}
                    >
                      <FileText size={16} className="shrink-0 mt-0.5" style={{ opacity: activeDocId === doc.id ? 1 : 0.35 }} />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate flex-1 overflow-hidden whitespace-nowrap">{doc.title}</span>
                          {doc.pinned && <Pin size={10} className="opacity-40 fill-current" style={{ color: "var(--accent-color)" }} />}
                        </div>
                        <span className="text-[10px] opacity-40 mt-0.5 flex items-center gap-1">
                          <Clock size={10} /> {formatTime(doc.lastModified)}
                        </span>
                      </div>
                      {activeDocId === doc.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full" style={{ background: "var(--accent-color)" }} />
                      )}
                    </button>

                    <div className="absolute right-2 flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === doc.id ? null : doc.id); }}
                        className={`p-2 transition-all rounded-lg cursor-pointer opacity-40 hover:opacity-100 ${activeMenuId === doc.id ? 'opacity-100' : ''}`}
                        style={{ color: "var(--editor-text)", background: activeMenuId === doc.id ? "color-mix(in srgb, var(--editor-text) 6%, transparent)" : "transparent" }}
                      >
                        <MoreVertical size={14} />
                      </button>

                      {activeMenuId === doc.id && (
                        <div className="absolute right-full top-8 mr-2 w-44 rounded-xl shadow-2xl py-1.5 z-[110] animate-in fade-in zoom-in slide-in-from-right-2 duration-200" style={{ background: "var(--editor-bg)", border: "1px solid var(--border-color)" }}>
                          <button onClick={() => handleTogglePin(doc.id, !!doc.pinned)} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 transition-colors cursor-pointer hover:opacity-80" style={{ color: "var(--editor-text)" }}>
                            {doc.pinned ? <><PinOff size={14} className="opacity-60" /> Unpin</> : <><Pin size={14} className="opacity-60" /> Pin to top</>}
                          </button>
                          <button onClick={() => handleOpenRenameModal(doc.id, doc.title)} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 transition-colors cursor-pointer hover:opacity-80" style={{ color: "var(--editor-text)" }}>
                            <Edit3 size={14} className="opacity-60" /> Rename
                          </button>
                          <div className="h-[1px] my-1" style={{ background: "var(--border-color)" }} />
                          <button onClick={() => handleDeleteDoc(doc.id)} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 transition-colors cursor-pointer text-red-500 hover:opacity-80">
                            <Trash2 size={14} className="opacity-60" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              className="flex flex-col gap-1 overflow-y-auto no-scrollbar flex-1 pr-2"
              style={{ overscrollBehavior: 'contain' }}
            >
              <div className="flex items-center justify-between px-4 mb-4">
                <span className="text-[14px] font-bold opacity-30" style={{ color: "var(--editor-text)" }}>Published Pages</span>
              </div>

              {isPublishedLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
                  <span className="w-5 h-5 border-2 border-[var(--editor-text)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[12px] font-semibold uppercase tracking-wider">Loading...</span>
                </div>
              ) : publishedPages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2 border border-dashed border-[var(--border-color)] rounded-2xl opacity-40">
                  <Globe size={24} />
                  <span className="text-[12px] font-bold">No published pages</span>
                  <span className="text-[10px] leading-relaxed">Publish a local draft to see it listed here!</span>
                </div>
              ) : (
                publishedPages.map((page) => (
                  <div key={page.customUrl} className="group relative flex items-center mb-1 doc-menu-container">
                    <a
                      href={`/${page.customUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-4 py-3 rounded-xl text-[14px] transition-all text-left flex-1 min-w-0 pr-12 cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                      style={{
                        color: "color-mix(in srgb, var(--editor-text) 80%, transparent)",
                      }}
                    >
                      <Globe size={16} className="shrink-0 mt-0.5 text-indigo-500 opacity-80" />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate flex-1 overflow-hidden whitespace-nowrap font-semibold">
                            {page.title || "Untitled"}
                          </span>
                          {page.pinned && (
                            <Pin size={10} className="text-[var(--accent-color)] rotate-45 shrink-0 animate-in zoom-in duration-200" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md ${page.isEditable ? 'bg-green-500/10 text-green-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                            {page.isEditable ? "Editable" : "View Only"}
                          </span>
                          {page.expiresAt && (
                            <span className="text-[8px] opacity-40 font-semibold flex items-center gap-1">
                              <Clock size={8} /> Expiring
                            </span>
                          )}
                          <span className="text-[8px] opacity-35 font-semibold">
                            /{page.customUrl}
                          </span>
                        </div>
                      </div>
                    </a>

                    <div className="absolute right-2 flex items-center gap-1">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenuId(activeMenuId === page.customUrl ? null : page.customUrl); }}
                        className={`p-2 transition-all rounded-lg cursor-pointer opacity-40 hover:opacity-100 ${activeMenuId === page.customUrl ? 'opacity-100' : ''}`}
                        style={{ color: "var(--editor-text)", background: activeMenuId === page.customUrl ? "color-mix(in srgb, var(--editor-text) 6%, transparent)" : "transparent" }}
                      >
                        <MoreVertical size={14} />
                      </button>

                      {activeMenuId === page.customUrl && (
                        <div className="absolute right-full top-8 mr-2 w-44 rounded-xl shadow-2xl py-1.5 z-[110] animate-in fade-in zoom-in slide-in-from-right-2 duration-200" style={{ background: "var(--editor-bg)", border: "1px solid var(--border-color)" }}>
                          <button onClick={(e) => { e.preventDefault(); handleTogglePinPublished(e, page.customUrl, !!page.pinned); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 transition-colors cursor-pointer hover:opacity-80" style={{ color: "var(--editor-text)" }}>
                            {page.pinned ? <><PinOff size={14} className="opacity-60" /> Unpin</> : <><Pin size={14} className="opacity-60" /> Pin to top</>}
                          </button>
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRenameModal({ isOpen: true, id: page.customUrl, currentTitle: page.title || "Untitled", isPublished: true }); setNewTitleValue(page.title || "Untitled"); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 transition-colors cursor-pointer hover:opacity-80" style={{ color: "var(--editor-text)" }}>
                            <Edit3 size={14} className="opacity-60" /> Rename
                          </button>
                          <button onClick={(e) => { e.preventDefault(); handleImportPublishedPage(e, page); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 transition-colors cursor-pointer hover:opacity-80 text-indigo-500">
                            <FileText size={14} className="opacity-60" /> Import / Edit
                          </button>
                          <div className="h-[1px] my-1" style={{ background: "var(--border-color)" }} />
                          <button onClick={(e) => { e.preventDefault(); openDeleteModal(page.customUrl); }} className="w-full text-left px-4 py-2 text-[13px] flex items-center gap-3 transition-colors cursor-pointer text-red-500 hover:opacity-80">
                            <Trash2 size={14} className="opacity-60" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <nav className="w-full h-14 bg-[var(--navbar-bg)] backdrop-blur-md md:bg-transparent md:backdrop-blur-none flex items-center justify-between px-6 fixed top-0 left-0 z-50 transition-all duration-300 md:pointer-events-none">
        <div className="flex items-center gap-5 md:pointer-events-auto">
          <button onClick={() => { setShowSidebar(true); refreshDocs(true); }} className="text-[#666] hover:text-black dark:hover:text-white transition-colors duration-200">
            <AlignLeft size={22} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-center gap-6 text-[#666] md:pointer-events-auto">
          {showCounter && (
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSound}
                className="hover:text-black dark:hover:text-white transition-colors duration-200 cursor-pointer opacity-70 hover:opacity-100"
                title={soundEnabled ? "Disable sound" : "Enable sound"}
              >
                {soundEnabled ? <Volume2 size={18} strokeWidth={1.5} /> : <VolumeX size={18} strokeWidth={1.5} />}
              </button>
              <span className="text-[13px] font-medium tracking-tight opacity-70 select-none">{wordCount} words</span>
            </div>
          )}
          <div className="flex items-center gap-5 relative">
            {activeDocPublishedUrl ? (
              <button
                onClick={handleSyncLivePage}
                className="text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 transition-colors duration-200 cursor-pointer flex items-center gap-1.5 relative group"
                title="Update live published page"
              >
                <div className="absolute -inset-1 bg-green-500/20 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-200" />
                <Globe size={18} strokeWidth={2} className="relative animate-pulse" />
                <span className="text-[12px] font-bold hidden md:inline relative">Update Live</span>
              </button>
            ) : (
              <button
                onClick={handleOpenPublishModal}
                className="hover:text-black dark:hover:text-white transition-colors duration-200 cursor-pointer opacity-70 hover:opacity-100 flex items-center gap-1.5"
                title="Publish Page"
              >
                <Globe size={18} strokeWidth={1.5} />
                <span className="text-[12px] font-semibold hidden md:inline">Publish</span>
              </button>
            )}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowDropdown(!showDropdown)} className="hover:text-black dark:hover:text-white transition-colors duration-200">
                <MoreHorizontal size={19} strokeWidth={1.5} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-[var(--navbar-bg)] backdrop-blur-2xl border border-[var(--border-color)] rounded-2xl shadow-2xl py-2 z-[60] overflow-hidden animate-in fade-in zoom-in duration-200">
                  {menuView === "main" ? (
                    <>
                      <button onClick={() => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); setShowDropdown(false); }} className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--editor-text)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center group cursor-pointer transition-colors">
                        <div className="flex items-center gap-3"><Maximize2 size={15} /> Full screen</div>
                        <ShortcutHint>F</ShortcutHint>
                      </button>
                      <button onClick={() => setMenuView("themes")} className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--editor-text)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center group cursor-pointer transition-colors">
                        <div className="flex items-center gap-3"><Palette size={15} /> Themes</div>
                        <ChevronRight size={14} className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                      </button>
                      <button onClick={() => setMenuView("fonts")} className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--editor-text)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center group cursor-pointer transition-colors">
                        <div className="flex items-center gap-3"><Type size={15} /> Font style</div>
                        <ChevronRight size={14} className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                      </button>
                      <div className="h-[1px] bg-[var(--border-color)] my-1.5" />
                      <button onClick={() => { const val = !showCounter; setShowCounter(val); localStorage.setItem("show-counter", String(val)); }} className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--editor-text)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center group cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">{showCounter ? <EyeOff size={15} /> : <Eye size={15} />} {showCounter ? "Hide counter" : "Show counter"}</div>
                        <ShortcutHint>C</ShortcutHint>
                      </button>
                    </>
                  ) : menuView === "themes" ? (
                    <>
                      <button onClick={() => setMenuView("main")} className="w-full text-left px-4 py-2.5 text-[13px] font-bold opacity-30 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center gap-3 transition-all cursor-pointer">
                        <ChevronLeft size={14} /> Themes
                      </button>
                      <div className="h-[1px] bg-[var(--border-color)] my-1.5" />
                      {THEMES.map((t) => (
                        <button key={t.id} onClick={(e) => changeTheme(t.id, e)} className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--editor-text)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center justify-between group cursor-pointer transition-colors">
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
                      <button onClick={() => setMenuView("main")} className="w-full text-left px-4 py-2.5 text-[13px] font-bold opacity-30 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center gap-3 transition-all cursor-pointer">
                        <ChevronLeft size={14} /> Font style
                      </button>
                      <div className="h-[1px] bg-[var(--border-color)] my-1.5" />
                      {FONTS.map((font) => (
                        <button key={font.id} onClick={() => changeFont(font.id)} className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--editor-text)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] flex items-center justify-between group cursor-pointer transition-colors">
                          {font.name} {currentFont === font.id && <Check size={14} className="text-[var(--accent-color)]" />}
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

      {/* Publish Modal */}
      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        editorContent={publishContent}
        onPublishSuccess={handlePublishSuccess}
      />
    </>
  );
}