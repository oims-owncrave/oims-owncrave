"use client";

import { cn } from "@/lib/utils";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type DropdownContextType = {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const DropdownContext = createContext<DropdownContextType | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("useDropdownContext must be used within a Dropdown");
  }
  return context;
}

type DropdownProps = {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function Dropdown({ children, isOpen, setIsOpen }: DropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  return (
    <DropdownContext.Provider
      value={{ isOpen, handleOpen, handleClose, triggerRef }}
    >
      <div className="relative inline-block" onKeyDown={handleKeyDown}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

type DropdownContentProps = {
  align?: "start" | "end" | "center";
  className?: string;
  children: React.ReactNode;
};

function getPanelStyle(
  rect: DOMRect,
  align: "start" | "end" | "center",
  panelWidth: number = 0,
): React.CSSProperties {
  const gap = 8;
  const padding = 12;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 360;

  // Auto-switch left-aligned triggers from "end" to "start" so panel expands rightwards on mobile/left side
  let effectiveAlign = align;
  if (rect.left < viewportWidth / 2 && align === "end") {
    effectiveAlign = "start";
  }

  let left: number;
  let transform: string | undefined;

  switch (effectiveAlign) {
    case "end":
      left = rect.right;
      transform = "translateX(-100%)";
      break;
    case "start":
      left = Math.max(padding, Math.min(rect.left, viewportWidth - padding - (panelWidth || 280)));
      transform = undefined;
      break;
    default:
      left = rect.left + rect.width / 2;
      transform = "translateX(-50%)";
      break;
  }

  return {
    position: "fixed",
    top: rect.bottom + gap,
    minWidth: Math.max(rect.width, 128),
    maxWidth: `calc(100vw - ${padding * 2}px)`,
    left,
    transform,
  };
}

export function DropdownContent({
  children,
  align = "center",
  className,
}: DropdownContentProps) {
  const { isOpen, handleClose, triggerRef } = useDropdownContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties | null>(
    null,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const panelWidth = panelRef.current?.getBoundingClientRect().width ?? 0;
    setPanelStyle(getPanelStyle(trigger.getBoundingClientRect(), align, panelWidth));
  }, [align, triggerRef]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPanelStyle(null);
      return;
    }
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      handleClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen, handleClose, triggerRef]);

  if (!mounted || !isOpen || !panelStyle) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      aria-orientation="vertical"
      style={panelStyle}
      className={cn("z-60 rounded-lg pointer-events-auto", className)}
    >
      {children}
    </div>,
    document.body,
  );
}

type DropdownTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function DropdownTrigger({
  children,
  className,
  onClick,
  ...props
}: DropdownTriggerProps) {
  const { handleOpen, handleClose, isOpen, triggerRef } = useDropdownContext();

  return (
    <button
      ref={triggerRef}
      type="button"
      className={className}
      onClick={(e) => {
        if (isOpen) handleClose();
        else handleOpen();
        onClick?.(e);
      }}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownClose({ children }: { children: React.ReactNode }) {
  const { handleClose } = useDropdownContext();

  return <div onClick={handleClose}>{children}</div>;
}
