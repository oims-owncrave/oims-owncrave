"use client";

import { createContext, useContext, useEffect, useState } from "react";

type SidebarState = "expanded" | "collapsed";

type SidebarContextType = {
  state: SidebarState;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
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

  // Restore the persisted desktop collapse state after mount.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setIsOpenState(stored === null ? defaultOpen : stored === "true");
  }, [defaultOpen]);

  function setIsOpen(open: boolean) {
    setIsOpenState(open);
    localStorage.setItem(STORAGE_KEY, String(open));
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
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

