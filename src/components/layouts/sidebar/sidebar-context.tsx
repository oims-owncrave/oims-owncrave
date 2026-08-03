"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { createContext, useContext, useEffect, useState } from "react";

type SidebarState = "expanded" | "collapsed";

type SidebarContextType = {
  state: SidebarState;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const STORAGE_KEY = "oims-sidebar-open";

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpenState] = useState(defaultOpen);
  const isMobile = useIsMobile();

  // Restore the persisted desktop collapse state after mount (mobile is always
  // a drawer and is never persisted).
  useEffect(() => {
    if (isMobile) {
      setIsOpenState(false);
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      setIsOpenState(stored === null ? defaultOpen : stored === "true");
    }
  }, [isMobile, defaultOpen]);

  function setIsOpen(open: boolean) {
    setIsOpenState(open);
    if (!isMobile) {
      localStorage.setItem(STORAGE_KEY, String(open));
    }
  }

  function toggleSidebar() {
    setIsOpen(!isOpen);
  }

  return (
    <SidebarContext.Provider
      value={{
        state: isOpen ? "expanded" : "collapsed",
        isOpen,
        setIsOpen,
        isMobile,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
