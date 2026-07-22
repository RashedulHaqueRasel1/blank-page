"use client";

import React, { useEffect, useState } from "react";
import { Download, WifiOff, X, CheckCircle2 } from "lucide-react";

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

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registered with scope:", reg.scope);
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
      window.dispatchEvent(new CustomEvent("pwa-installable", { detail: promptEvent }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. App Installed Event Listener
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("[PWA] App installed successfully");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

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

      {/* Floating PWA Install Prompt Banner */}
      {isInstallable && !dismissed && (
        <div className="fixed bottom-5 right-5 z-[99998] max-w-sm w-[calc(100vw-2.5rem)] p-4 rounded-3xl bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/50 text-white shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 flex-shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Install Blank Notes</h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Use offline on mobile & desktop like a native app.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3.5 flex items-center justify-end gap-2">
            <button
              onClick={() => setDismissed(true)}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-white rounded-xl transition-colors"
            >
              Not now
            </button>
            <button
              onClick={handleInstallClick}
              className="px-4 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl transition-all shadow-md active:scale-95"
            >
              Install App
            </button>
          </div>
        </div>
      )}
    </>
  );
}
