import { create } from "zustand";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

type PWAStore = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  setDeferredPrompt: (e: BeforeInstallPromptEvent | null) => void;
  setIsInstalled: (v: boolean) => void;
};

export const usePWAStore = create<PWAStore>((set) => ({
  deferredPrompt: null,
  isInstalled: false,
  setDeferredPrompt: (e) => set({ deferredPrompt: e }),
  setIsInstalled: (v) => set({ isInstalled: v }),
}));
