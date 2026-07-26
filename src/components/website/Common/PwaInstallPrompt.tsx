"use client";

import React, { useEffect, useState, useRef } from "react";
import { Download, WifiOff, X, CheckCircle2, Sparkles, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [noticeToast, setNoticeToast] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss countdown logic (5 seconds)
  useEffect(() => {
    if (!isInstallable || dismissed) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setCountdown(5);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setDismissed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isInstallable, dismissed]);

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registered:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Network Status Listeners
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineToast(true);
      setTimeout(() => setShowOfflineToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineToast(true);
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    // 3. Install Prompt Listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      setDismissed(false);
      window.dispatchEvent(new CustomEvent("pwa-installable", { detail: promptEvent }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. App Installed Event Listener
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setDismissed(true);
      console.log("[PWA] App installed successfully");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. Manual trigger listener from More menu
    const handleTriggerInstall = async () => {
      if (deferredPrompt) {
        setDismissed(false);
        setIsInstallable(true);
        try {
          await deferredPrompt.prompt();
          const choiceResult = await deferredPrompt.userChoice;
          if (choiceResult.outcome === "accepted") {
            setIsInstallable(false);
            setDeferredPrompt(null);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setNoticeToast("App is already installed or browser does not support PWA install.");
        setTimeout(() => setNoticeToast(null), 4000);
      }
    };

    window.addEventListener("trigger-pwa-install", handleTriggerInstall);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("trigger-pwa-install", handleTriggerInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      console.log("[PWA] User accepted the install prompt");
    } else {
      console.log("[PWA] User dismissed the install prompt");
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <>
      {/* Offline / Online Status Indicator Toast */}
      {showOfflineToast && (
        <div
          className={`fixed bottom-5 left-5 z-[99999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm transition-all duration-300 ${
            isOffline
              ? "bg-amber-500/10 backdrop-blur-md border-amber-500/30 text-amber-900 dark:text-amber-200"
              : "bg-emerald-500/10 backdrop-blur-md border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff className="w-5 h-5 text-amber-500 animate-pulse flex-shrink-0" />
              <div>
                <p className="font-semibold">Offline Mode Active</p>
                <p className="text-xs opacity-80">Notes are saved locally to your device.</p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-semibold">Back Online</p>
                <p className="text-xs opacity-80">Connection restored.</p>
              </div>
            </>
          )}
          <button
            onClick={() => setShowOfflineToast(false)}
            className="ml-2 opacity-60 hover:opacity-100 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Notice Toast for Manual PWA Trigger */}
      {noticeToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--navbar-bg)] backdrop-blur-xl border border-[var(--border-color)] text-[var(--editor-text)] shadow-2xl text-xs font-semibold animate-in fade-in zoom-in duration-200">
          <Smartphone size={16} className="text-indigo-500 shrink-0" />
          <span>{noticeToast}</span>
          <button onClick={() => setNoticeToast(null)} className="ml-2 opacity-60 hover:opacity-100 p-1 rounded-full">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating PWA Install Prompt Modal */}
      {isInstallable && !dismissed && (
        <div className="fixed bottom-6 right-6 z-[99998] max-w-sm w-[calc(100vw-3rem)] rounded-3xl bg-[var(--editor-bg)]/90 backdrop-blur-2xl border border-[var(--border-color)] text-[var(--editor-text)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-6">
          {/* Progress bar countdown indicator */}
          <div className="w-full h-1 bg-[var(--border-color)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>

          <div className="p-4.5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  <Smartphone className="w-5 h-5 text-indigo-500" />
                  <Sparkles className="w-3 h-3 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm tracking-tight">Install Blank Notes</h4>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-500/15 text-indigo-500">
                      {countdown}s
                    </span>
                  </div>
                  <p className="text-xs opacity-65 mt-0.5 leading-relaxed">
                    Use offline on mobile & desktop like a native app.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="opacity-40 hover:opacity-100 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setDismissed(true)}
                className="px-4 py-2 text-xs font-semibold opacity-60 hover:opacity-100 rounded-xl transition-colors cursor-pointer"
              >
                Not now
              </button>
              <button
                onClick={handleInstallClick}
                className="px-4.5 py-2 text-xs font-bold bg-[var(--accent-color)] text-[var(--editor-bg)] hover:opacity-90 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                Install App
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
