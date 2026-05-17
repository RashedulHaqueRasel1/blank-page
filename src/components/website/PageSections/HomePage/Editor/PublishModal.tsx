"use client";

import React, { useState, useEffect, useRef } from "react";
import { Globe, Copy, Check, X, Shield, Clock, AlertCircle, Edit, Lock, ExternalLink, ChevronDown, Key, Eye, EyeOff } from "lucide-react";

const EXPIRY_OPTIONS = [
  { value: "1",    label: "1 Hour" },
  { value: "4",    label: "4 Hours" },
  { value: "24",   label: "24 Hours (1 Day)" },
  { value: "72",   label: "72 Hours (3 Days)" },
  { value: "720",  label: "30 Days" },
  { value: "never", label: "Unlimited (Never Expires)" },
];

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  editorContent: string;
  onPublishSuccess?: () => void;
}

interface PublishResult {
  id: string;
  customUrl: string;
  content: string;
  isEditable: boolean;
  expiresAt: string | null;
  isDeleted: boolean;
  authorId?: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

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

export default function PublishModal({ isOpen, onClose, editorContent, onPublishSuccess }: PublishModalProps) {
  const [customUrl, setCustomUrl] = useState("");
  const [isEditable, setIsEditable] = useState(false);
  const [expiresHours, setExpiresHours] = useState("24");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [clientIp, setClientIp] = useState("");
  const [showExpiry, setShowExpiry] = useState(false);
  const expiryRef = useRef<HTMLDivElement>(null);

  // Close expiry dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (expiryRef.current && !expiryRef.current.contains(e.target as Node)) {
        setShowExpiry(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCustomUrl("");
      setIsEditable(false);
      setExpiresHours("24");
      setPassword("");
      setError("");
      setPublishResult(null);
      setCopied(false);
      getOrCreateWriterId();

      const fetchIp = async () => {
        try {
          const res = await fetch('/api/sync');
          const data = await res.json();
          if (data.session) setClientIp(atob(data.session));
        } catch (err) {
          console.error('Sync failed:', err);
        }
      };
      fetchIp();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePublish = async () => {
    if (customUrl.trim().length < 4) {
      setError("Custom URL must be at least 4 characters long");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let activeIp = clientIp;
      if (!activeIp) {
        try {
          const res = await fetch('/api/sync');
          const data = await res.json();
          if (data.session) activeIp = atob(data.session);
        } catch (err) {
          console.error('Sync fallback failed:', err);
        }
      }

      const payload = {
        customUrl: customUrl.trim(),
        content: editorContent,
        isEditable,
        expiresHours: expiresHours === "never" ? 0 : Number(expiresHours),
        password: password || undefined,
        authorId: getOrCreateWriterId(),
        ip: activeIp || undefined,
      };

      const response = await fetch(`/api/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to publish page");
      }

      setPublishResult(data.data);
      onPublishSuccess?.();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong while publishing";
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!publishResult) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://blank-page-v1.vercel.app";
    const fullUrl = `${origin}/${publishResult.customUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${publishResult?.customUrl}`
    : `https://blank-page-v1.vercel.app/${publishResult?.customUrl}`;

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-[300] animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — slides up from bottom on mobile, centered on desktop */}
      <div
        className="relative w-full sm:max-w-[460px] sm:mx-4 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 overflow-hidden"
        style={{
          background: "var(--editor-bg)",
          border: "1px solid var(--border-color)",
          color: "var(--editor-text)",
          maxHeight: "92dvh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full opacity-20" style={{ background: "var(--editor-text)" }} />
        </div>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10">
                <Globe size={20} className="text-indigo-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold tracking-tight leading-tight">Publish to Web</h2>
                <p className="text-[11px] opacity-35 mt-0.5">Share your blank page with the world</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl opacity-40 hover:opacity-100 transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          {!publishResult ? (
            /* ─── Form View ─── */
            <div className="flex flex-col gap-5">

              {/* Custom URL */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase opacity-40">
                  Custom URL Slug
                </label>
                <div
                  className="flex items-center rounded-2xl px-4 py-3.5 gap-2 focus-within:ring-2 ring-indigo-500/30 transition-all"
                  style={{
                    background: "color-mix(in srgb, var(--editor-text) 5%, transparent)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <span className="text-[12px] opacity-35 select-none shrink-0">
                    {typeof window !== "undefined" ? window.location.host : "blank-page.com"}/
                  </span>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                    placeholder="my-page"
                    autoFocus
                    className="flex-1 bg-transparent border-none outline-none text-[14px] font-semibold p-0 placeholder:opacity-20 min-w-0"
                    style={{ color: "var(--editor-text)" }}
                    maxLength={30}
                  />
                  {customUrl.length >= 4 && (
                    <Check size={14} className="text-green-500 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] opacity-30 leading-normal px-1">
                  Min 4 chars · Letters, numbers, hyphens, underscores
                </p>
              </div>

              {/* Access Mode */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase opacity-40">
                  Access Mode
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditable(false)}
                    className="flex flex-col gap-2 p-4 rounded-2xl text-left border cursor-pointer transition-all active:scale-[0.97]"
                    style={{
                      borderColor: !isEditable ? "var(--accent-color)" : "var(--border-color)",
                      background: !isEditable
                        ? "color-mix(in srgb, var(--accent-color) 8%, transparent)"
                        : "color-mix(in srgb, var(--editor-text) 3%, transparent)",
                    }}
                  >
                    <div className={`p-1.5 rounded-lg w-fit ${!isEditable ? "bg-indigo-500/15" : "bg-black/5 dark:bg-white/5"}`}>
                      <Lock size={13} className={!isEditable ? "text-indigo-500" : "opacity-40"} />
                    </div>
                    <div>
                      <span className="text-[12px] font-bold block">View Only</span>
                      <span className="text-[10px] opacity-40 leading-snug block mt-0.5">Read access only</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditable(true)}
                    className="flex flex-col gap-2 p-4 rounded-2xl text-left border cursor-pointer transition-all active:scale-[0.97]"
                    style={{
                      borderColor: isEditable ? "var(--accent-color)" : "var(--border-color)",
                      background: isEditable
                        ? "color-mix(in srgb, var(--accent-color) 8%, transparent)"
                        : "color-mix(in srgb, var(--editor-text) 3%, transparent)",
                    }}
                  >
                    <div className={`p-1.5 rounded-lg w-fit ${isEditable ? "bg-indigo-500/15" : "bg-black/5 dark:bg-white/5"}`}>
                      <Edit size={13} className={isEditable ? "text-indigo-500" : "opacity-40"} />
                    </div>
                    <div>
                      <span className="text-[12px] font-bold block">Editable</span>
                      <span className="text-[10px] opacity-40 leading-snug block mt-0.5">Anyone can co-edit</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Expiration */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase opacity-40">
                  Expiration
                </label>
                <div className="relative" ref={expiryRef}>
                  {/* Trigger button */}
                  <button
                    type="button"
                    onClick={() => setShowExpiry((v) => !v)}
                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 border cursor-pointer transition-all"
                    style={{
                      background: "color-mix(in srgb, var(--editor-text) 5%, transparent)",
                      borderColor: showExpiry ? "var(--accent-color)" : "var(--border-color)",
                      color: "var(--editor-text)",
                    }}
                  >
                    <Clock size={15} className="opacity-40 shrink-0" />
                    <span className="flex-1 text-left text-[13px] font-semibold">
                      {EXPIRY_OPTIONS.find((o) => o.value === expiresHours)?.label}
                    </span>
                    <ChevronDown
                      size={15}
                      className="opacity-40 shrink-0 transition-transform duration-200"
                      style={{ transform: showExpiry ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </button>

                  {/* Dropdown panel */}
                  {showExpiry && (
                    <div
                      className="absolute left-0 right-0 bottom-full mb-2 rounded-2xl border shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
                      style={{
                        background: "var(--editor-bg)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      {EXPIRY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setExpiresHours(opt.value); setShowExpiry(false); }}
                          className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-semibold text-left cursor-pointer transition-colors"
                          style={{
                            color: "var(--editor-text)",
                            background: expiresHours === opt.value
                              ? "color-mix(in srgb, var(--accent-color) 8%, transparent)"
                              : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (expiresHours !== opt.value)
                              (e.currentTarget as HTMLElement).style.background = "color-mix(in srgb, var(--editor-text) 5%, transparent)";
                          }}
                          onMouseLeave={(e) => {
                            if (expiresHours !== opt.value)
                              (e.currentTarget as HTMLElement).style.background = "transparent";
                          }}
                        >
                          {opt.label}
                          {expiresHours === opt.value && (
                            <Check size={13} style={{ color: "var(--accent-color)" }} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Secret Key (Optional) */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase opacity-40">
                  Secret Key (Optional)
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">
                    <Key size={15} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave empty for public access"
                    className="w-full pl-11 pr-12 py-3 rounded-2xl border outline-none transition-all text-[13px] font-medium"
                    style={{
                      background: "color-mix(in srgb, var(--editor-text) 5%, transparent)",
                      borderColor: "var(--border-color)",
                      color: "var(--editor-text)",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent-color)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
                  />
                  {password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/8 text-red-500 border border-red-500/15 text-[11px] font-medium leading-relaxed">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Publish Button */}
              <button
                onClick={handlePublish}
                disabled={isLoading || !editorContent.trim()}
                className="w-full py-4 rounded-2xl font-bold text-[14px] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden"
                style={{
                  background: "var(--accent-color)",
                  color: "var(--editor-bg)",
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Publishing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Globe size={16} />
                    Publish Now
                  </span>
                )}
              </button>
            </div>
          ) : (
            /* ─── Success View ─── */
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Success header */}
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center">
                  <Check size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold">Page is live! 🎉</h3>
                  <p className="text-[11px] opacity-40 mt-1 leading-relaxed">
                    Your page is now publicly accessible.
                  </p>
                </div>
              </div>

              {/* Shareable link */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase opacity-40">
                  Shareable Link
                </label>
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 border"
                  style={{
                    background: "color-mix(in srgb, var(--editor-text) 4%, transparent)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <span className="text-[12px] font-semibold truncate flex-1 opacity-75 select-all">
                    {shareUrl}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                      style={{
                        background: copied
                          ? "color-mix(in srgb, var(--accent-color) 15%, transparent)"
                          : "color-mix(in srgb, var(--editor-text) 10%, transparent)",
                        color: copied ? "var(--accent-color)" : "var(--editor-text)",
                      }}
                    >
                      {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div
                className="rounded-2xl border divide-y text-[11px]"
                style={{ borderColor: "var(--border-color)", background: "color-mix(in srgb, var(--editor-text) 2%, transparent)" }}
              >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderColor: "var(--border-color)" }}>
                  <span className="opacity-45 font-medium">Access</span>
                  <span className={`font-bold flex items-center gap-1.5 ${publishResult.isEditable ? "text-green-500" : "text-indigo-500"}`}>
                    {publishResult.isEditable ? <Edit size={11} /> : <Shield size={11} />}
                    {publishResult.isEditable ? "Editable" : "View Only"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderColor: "var(--border-color)" }}>
                  <span className="opacity-45 font-medium">Expires</span>
                  <span className="font-bold opacity-75">
                    {publishResult.expiresAt
                      ? new Date(publishResult.expiresAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "Never"}
                  </span>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl font-bold text-[13px] active:scale-[0.98] transition-all cursor-pointer border opacity-60 hover:opacity-100"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--editor-text)",
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
