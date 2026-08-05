"use client";

import React, { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MenuSheet } from "./menu-sheet";
import { NAV_DATA } from "@/components/layouts/sidebar/data";
import type { NavItem } from "@/components/layouts/sidebar/data";

type BottomNavProps = {
  userRole: string;
};

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-primary", className)}
      aria-hidden="true"
    />
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function MasterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
      <polyline points="7.5 19.79 7.5 14.6 3 12" />
      <polyline points="21 12 16.5 14.6 16.5 19.79" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

type NavSlot =
  | {
      label: string;
      baseRoute: string;
      icon: ({ className }: { className?: string }) => React.ReactElement;
      type: "leaf";
      url: string;
      ownerOnly?: boolean;
    }
  | {
      label: string;
      baseRoute: string;
      icon: ({ className }: { className?: string }) => React.ReactElement;
      type: "parent";
      navItemTitle: string;
      ownerOnly?: boolean;
    };

const NAV_SLOTS: NavSlot[] = [
  { label: "Dashboard", baseRoute: "/dashboard", icon: HomeIcon, type: "leaf", url: "/dashboard" },
  { label: "Master", baseRoute: "/master", icon: MasterIcon, type: "parent", navItemTitle: "Master Data" },
  { label: "Inventory", baseRoute: "/inventory", icon: BoxIcon, type: "parent", navItemTitle: "Inventory" },
  { label: "Laporan", baseRoute: "/laporan", icon: ChartIcon, type: "parent", navItemTitle: "Laporan" },
];

function findNavItem(title: string): NavItem | undefined {
  for (const section of NAV_DATA) {
    const found = section.items.find((item) => item.title === title);
    if (found) return found;
  }
  return undefined;
}

export function BottomNav({ userRole }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [activeSheetItem, setActiveSheetItem] = useState<NavItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Clear loading when navigation completes
  useEffect(() => {
    setLoadingUrl(null);
  }, [pathname]);

  const navigate = useCallback(
    (url: string) => {
      if (url === pathname) return;
      setLoadingUrl(url);
      router.push(url);
    },
    [pathname, router]
  );

  const handleCloseSheet = useCallback(() => {
    setMenuOpen(false);
    setActiveSheetItem(null);
  }, []);

  const handleSlotClick = useCallback(
    (slot: NavSlot) => {
      if (slot.type === "leaf") {
        handleCloseSheet();
        navigate(slot.url);
      } else {
        const item = findNavItem(slot.navItemTitle);
        if (item) {
          setMenuOpen(false);
          setActiveSheetItem(item);
        }
      }
    },
    [handleCloseSheet, navigate]
  );

  const handleMenuClick = useCallback(() => {
    setActiveSheetItem(null);
    setMenuOpen(true);
  }, []);

  const visibleSlots = NAV_SLOTS.filter((s) => !s.ownerOnly || userRole === "owner");
  const totalCols = visibleSlots.length + 1;
  const isSheetOpen = menuOpen || activeSheetItem !== null;

  return (
    <>
      <MenuSheet
        open={isSheetOpen}
        onClose={handleCloseSheet}
        userRole={userRole}
        scopedItem={activeSheetItem ?? undefined}
      />

      <nav
        className={cn(
          "fixed bottom-0 inset-x-0 z-40 min-[850px]:hidden",
          "bg-white dark:bg-gray-dark border-t border-stroke dark:border-dark-3 shadow-lg",
          "pb-[env(safe-area-inset-bottom)]"
        )}
        aria-label="Navigasi bawah"
      >
        <div
          className="grid h-16"
          style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}
        >
          {visibleSlots.map((slot) => {
            const isRouteActive = pathname.startsWith(slot.baseRoute);
            const isSheetActive =
              slot.type === "parent" && activeSheetItem?.title === slot.navItemTitle;
            const isActive = isRouteActive || isSheetActive;
            const isLoading =
              loadingUrl !== null && loadingUrl.startsWith(slot.baseRoute);

            return (
              <button
                key={slot.baseRoute}
                onClick={() => handleSlotClick(slot)}
                disabled={loadingUrl !== null}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors",
                  isActive
                    ? "text-primary font-medium"
                    : "text-dark-5 dark:text-dark-6 hover:text-dark dark:hover:text-white",
                  isLoading && "opacity-70"
                )}
                aria-label={slot.label}
                aria-current={isRouteActive ? "page" : undefined}
              >
                {isLoading ? (
                  <SpinnerIcon className="size-5.5" />
                ) : (
                  <slot.icon className="size-5.5" />
                )}
                <span className="text-[10px]">
                  {isLoading ? "Loading..." : slot.label}
                </span>
              </button>
            );
          })}

          {/* Menu slot */}
          <button
            onClick={handleMenuClick}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-colors",
              menuOpen
                ? "text-primary font-medium"
                : "text-dark-5 dark:text-dark-6 hover:text-dark dark:hover:text-white"
            )}
            aria-label="Buka menu"
            aria-expanded={menuOpen}
          >
            <GridIcon className="size-5.5" />
            <span className="text-[10px]">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
