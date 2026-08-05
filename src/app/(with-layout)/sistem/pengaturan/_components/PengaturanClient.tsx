"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { usePWAStore } from "@/stores/pwa-store";
import { ThemeToggleSwitch } from "@/components/layouts/header/theme-toggle";
import { signOutAction } from "@/services/auth";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";

export function PengaturanClient() {
  const { deferredPrompt, isInstalled, setDeferredPrompt, setIsInstalled } = usePWAStore();
  const [isLoggingOut, startLogout] = useTransition();

  const canInstall = !isInstalled && !!deferredPrompt;
  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  async function handleInstall() {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("OIMS berhasil diinstall!");
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } catch {
      toast.error("Gagal membuka dialog install.");
    }
  }

  function handleLogout() {
    startLogout(async () => {
      await signOutAction();
    });
  }

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader
        title="Pengaturan Sistem"
        breadcrumb={[{ label: "Sistem" }, { label: "Pengaturan" }]}
      />
      {/* Theme Settings */}
      <div className="rounded-xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="mb-1 text-base font-semibold text-dark dark:text-white">
          Tampilan & Tema
        </h3>
        <p className="mb-4 text-sm text-dark-5 dark:text-dark-6">
          Pilih mode tampilan terang (light) atau gelap (dark) untuk kenyamanan Anda.
        </p>
        <ThemeToggleSwitch />
      </div>
      {/* Install Application */}
      <div className="rounded-xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="mb-1 text-base font-semibold text-dark dark:text-white">
          Install Aplikasi
        </h3>
        <p className="mb-4 text-sm text-dark-5 dark:text-dark-6">
          Pasang OIMS di perangkat untuk akses offline dan tampilan full-screen.
        </p>

        {isInstalled ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            OIMS sudah terpasang di perangkat ini
          </div>
        ) : canInstall ? (
          <button
            onClick={handleInstall}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Install OIMS
          </button>
        ) : isIOS ? (
          <p className="text-sm text-dark-5 dark:text-dark-6">
            Di Safari: tap tombol <strong>Share</strong> lalu pilih{" "}
            <strong>Add to Home Screen</strong>
          </p>
        ) : (
          <p className="text-sm text-dark-5 dark:text-dark-6">
            Buka OIMS di Chrome, lalu tap ikon install di address bar
          </p>
        )}
      </div>
      {/* Account & Session */}
      <div className="rounded-xl border border-stroke bg-white p-6 dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="mb-1 text-base font-semibold text-dark dark:text-white">
          Akun & Sesi
        </h3>
        <p className="mb-4 text-sm text-dark-5 dark:text-dark-6">
          Keluar dari sesi akun Anda di perangkat ini.
        </p>
        <button
          type="button"
          disabled={isLoggingOut}
          onClick={() => startLogout(async () => { await signOutAction(); })}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <Spinner size={16} className="text-white" />
          ) : (
            <LogOut size={16} />
          )}
          <span>{isLoggingOut ? "Keluar..." : "Keluar dari Akun"}</span>
        </button>
      </div>
    </div>
  );
}
