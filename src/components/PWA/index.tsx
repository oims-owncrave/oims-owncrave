"use client";

import { useState, useEffect, useCallback } from "react";
import { usePWAStore } from "@/stores/pwa-store";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function SplashScreen({ fading }: { fading: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-9999 flex flex-col items-center justify-center bg-linear-to-b from-[#1a56db] to-[#1e40af] transition-opacity duration-500 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <img
        src="/icons/icon-192.png"
        alt="OIMS"
        className="mb-6 h-24 w-24 rounded-[22px] shadow-lg"
      />
      <h1 className="mb-1 text-2xl font-bold text-white">OIMS Owncrave</h1>
      <p className="mb-10 text-sm text-white/70">Owncrave Integrated Management</p>

      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-white animate-bounce [animation-delay:0ms]" />
        <span className="h-3 w-3 rounded-full bg-white animate-bounce [animation-delay:150ms]" />
        <span className="h-3 w-3 rounded-full bg-white animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export default function PWAComponents() {
  const [isOnline, setIsOnline] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const { setDeferredPrompt, setIsInstalled } = usePWAStore();

  const checkInstallationStatus = useCallback(() => {
    if (typeof window === "undefined") return false;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (window.navigator as any).standalone;
    const isInApp = window.navigator.userAgent.includes("wv");
    return isStandalone || isIOSStandalone || isInApp;
  }, []);

  useEffect(() => {
    setIsInstalled(checkInstallationStatus());

    // Fade out splash screen after 1.2s
    const splashTimer = setTimeout(() => {
      setSplashFading(true);
      setTimeout(() => setShowSplash(false), 500);
    }, 1200);

    if ("serviceWorker" in navigator) {
      let reloadPending = false;

      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                if (!reloadPending) {
                  reloadPending = true;
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloadPending) return;
        reloadPending = true;
        window.location.reload();
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Deploy-skew guard: ChunkLoadError after deploy → reload once
    const SKEW_GUARD_KEY = "oims-skew-reload-at";
    const isSkewMessage = (msg: string) =>
      /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to find Server Action|older or newer deployment/i.test(msg);
    const reloadOnSkew = (msg: string) => {
      if (!isSkewMessage(msg)) return;
      const last = Number(sessionStorage.getItem(SKEW_GUARD_KEY) || 0);
      if (Date.now() - last < 15000) return;
      sessionStorage.setItem(SKEW_GUARD_KEY, String(Date.now()));
      window.location.reload();
    };
    const handleWindowError = (e: ErrorEvent) => reloadOnSkew(e.message || String(e.error));
    const handleRejection = (e: PromiseRejectionEvent) =>
      reloadOnSkew(e.reason?.message || String(e.reason));

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [checkInstallationStatus, setDeferredPrompt, setIsInstalled]);

  return (
    <>
      {showSplash && <SplashScreen fading={splashFading} />}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 py-2 px-4 text-center text-sm text-white">
          Anda sedang offline
        </div>
      )}
    </>
  );
}
