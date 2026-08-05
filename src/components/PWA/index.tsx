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

export default function PWAComponents() {
  const [isOnline, setIsOnline] = useState(true);
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
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [checkInstallationStatus, setDeferredPrompt, setIsInstalled]);

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 py-2 px-4 text-center text-sm text-white">
        Anda sedang offline
      </div>
    );
  }

  return null;
}
