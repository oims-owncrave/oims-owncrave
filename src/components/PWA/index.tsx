"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAComponents() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const isAuthPage = pathname === "/signin" || pathname === "/signup";
  const isProtectedPage = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/produksi") ||
    pathname.startsWith("/penjahitan") ||
    pathname.startsWith("/qc") ||
    pathname.startsWith("/keuangan") ||
    pathname.startsWith("/master") ||
    pathname.startsWith("/laporan");

  const checkInstallationStatus = useCallback(() => {
    if (typeof window === "undefined") return false;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (window.navigator as any).standalone;
    const isInApp = window.navigator.userAgent.includes("wv");
    return isStandalone || isIOSStandalone || isInApp;
  }, []);

  useEffect(() => {
    const installed = checkInstallationStatus();
    setIsInstalled(installed);

    if ("serviceWorker" in navigator) {
      let reloadPending = false;

      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("🔧 OIMS Service Worker registered:", registration);
          setIsAppReady(true);

          // Reload on new SW version to avoid stale chunk 404s
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
          console.error("❌ OIMS Service Worker registration failed:", error);
          setIsAppReady(true);
        });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloadPending) return;
        reloadPending = true;
        window.location.reload();
      });
    } else {
      setIsAppReady(true);
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
  }, [checkInstallationStatus]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isInstalled) {
        toast.info("OIMS sudah terinstall!");
        setShowInstallPrompt(false);
        return;
      }
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      toast.info(
        isMobile
          ? "Tap tombol share di browser dan pilih 'Add to Home Screen'"
          : "Klik ikon install di address bar browser"
      );
      setShowInstallPrompt(false);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("OIMS berhasil diinstall!");
        setIsInstalled(true);
      } else {
        toast.info("Installasi dibatalkan");
      }
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      toast.error("Gagal install: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleInstallDismiss = () => {
    setShowInstallPrompt(false);
    sessionStorage.setItem("oims-install-dismissed", "true");
  };

  if (isInstalled || isAuthPage || !isAppReady) {
    return (
      <>
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 py-2 px-4 text-center text-sm text-white">
            📴 Anda sedang offline
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 py-2 px-4 text-center text-sm text-white">
          📴 Anda sedang offline
        </div>
      )}

      {showInstallPrompt && isProtectedPage && !isInstalled && (
        <div className="fixed top-4 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg">
              O
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Install OIMS</h3>
              <p className="text-xs text-gray-500">Tambahkan ke home screen untuk akses cepat</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Install
            </button>
            <button
              onClick={handleInstallDismiss}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              Nanti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
