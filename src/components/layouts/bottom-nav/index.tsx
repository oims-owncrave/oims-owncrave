"use client";
import React, { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MenuSheet } from "./menu-sheet";

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

type NavSlot = {
  label: string;
  baseRoute: string;
  icon: ({ className }: { className?: string }) => React.ReactElement;
  url: string;
  ownerOnly?: boolean;
};

const NAV_SLOTS: NavSlot[] = [
  { label: "Dashboard", baseRoute: "/dashboard", icon: HomeIcon, url: "/dashboard" },
  { label: "Inventory", baseRoute: "/inventory", icon: BoxIcon, url: "/inventory/stok" },
  { label: "Laporan", baseRoute: "/laporan", icon: ChartIcon, url: "/laporan/stok" },
  { label: "Sistem", baseRoute: "/sistem", icon: SettingsIcon, url: "/sistem/pengguna", ownerOnly: true },
];

export function BottomNav({ userRole }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Clear loading when navigation completes
  useEffect(() => {
    setLoadingUrl(null);
  }, [pathname]);

  const navigate = useCallback((url: string) => {
    if (url === pathname) return;
    setLoadingUrl(url);
    router.push(url);
  }, [pathname, router]);

  const visibleSlots = NAV_SLOTS.filter((s) => !s.ownerOnly || userRole === "owner");
  const totalCols = visibleSlots.length + 1;

  return (
    <>
      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userRole={userRole}
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
            const isActive = pathname.startsWith(slot.baseRoute);
            const isLoading = loadingUrl === slot.url;
            return (
              <button
                key={slot.baseRoute}
                onClick={() => navigate(slot.url)}
                disabled={loadingUrl !== null}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors",
                  isActive ? "text-primary" : "text-dark-5 dark:text-dark-6 hover:text-dark dark:hover:text-white",
                  isLoading && "opacity-70"
                )}
                aria-label={slot.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isLoading ? (
                  <SpinnerIcon className="size-5.5" />
                ) : (
                  <slot.icon className="size-5.5" />
                )}
                <span className="text-[10px] font-medium">
                  {isLoading ? "Loading..." : slot.label}
                </span>
              </button>
            );
          })}

          {/* Menu slot */}
          <button
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-colors",
              menuOpen
                ? "text-primary"
                : "text-dark-5 dark:text-dark-6 hover:text-dark dark:hover:text-white"
            )}
            aria-label="Buka menu"
            aria-expanded={menuOpen}
          >
            <GridIcon className="size-5.5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
