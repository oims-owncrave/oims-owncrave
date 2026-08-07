"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV_DATA } from "@/components/layouts/sidebar/data";
import type { NavItem, NavSubItem } from "@/components/layouts/sidebar/data";
import { cn } from "@/lib/utils";

type MenuSheetProps = {
  open: boolean;
  onClose: () => void;
  userRole: string;
  scopedItem?: NavItem;
};

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-primary shrink-0",
        className
      )}
      aria-hidden="true"
    />
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function MenuSheet({ open, onClose, userRole, scopedItem }: MenuSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [navigatingUrl, setNavigatingUrl] = useState<string | null>(null);
  const isMounted = useRef(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const sections = NAV_DATA.filter(
    (s) => !s.ownerOnly || userRole === "owner"
  );

  // Auto-expand active item when opened in full mode
  useEffect(() => {
    if (!open || scopedItem) return;
    sections.some((section) =>
      section.items.some((item) => {
        if (item.items.some((sub) => sub.url === pathname)) {
          setExpandedItems([item.title]);
          return true;
        }
        return false;
      })
    );
  }, [open, pathname, scopedItem]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on route change — skip initial mount
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    setNavigatingUrl(null);
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset navigating URL when sheet is closed
  useEffect(() => {
    if (!open) {
      setNavigatingUrl(null);
    }
  }, [open]);

  // Trap scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function navigate(url: string) {
    if (url === pathname) {
      onClose();
      return;
    }
    setNavigatingUrl(url);
    startTransition(() => {
      router.push(url);
    });
  }

  function toggleExpanded(title: string) {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
  }

  const title = scopedItem ? scopedItem.title : "Menu";

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-60 bg-black/50 transition-opacity duration-200 min-[850px]:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-70 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-gray-dark shadow-lg transition-transform duration-300 min-[850px]:hidden",
          open ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={`Navigasi ${title}`}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-dark-3" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stroke dark:border-dark-3">
          <div className="flex items-center gap-2">
            {scopedItem && (
              <scopedItem.icon className="size-5 text-primary" aria-hidden="true" />
            )}
            <span className="text-sm font-semibold text-dark dark:text-white">
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-2 dark:hover:bg-dark-2 text-dark-5 dark:text-dark-6 hover:text-dark dark:hover:text-white"
            aria-label="Tutup menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Sheet Body */}
        <div className="px-4 py-3 pb-8">
          {scopedItem ? (
            /* Scoped Mode: Render sub-items directly */
            <div className="space-y-1">
              {scopedItem.items.map((sub: NavSubItem) => {
                const isActive = pathname === sub.url;
                const isNavigatingThis = isPending && navigatingUrl === sub.url;

                return (
                  <button
                    key={sub.url}
                    onClick={() => navigate(sub.url)}
                    disabled={isPending}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm text-dark dark:text-white hover:bg-gray-2 dark:hover:bg-dark-2 transition-colors",
                      isActive && "bg-primary/10 text-primary dark:text-primary font-semibold",
                      isNavigatingThis && "bg-primary/5 text-primary"
                    )}
                  >
                    <span>{sub.title}</span>
                    {isNavigatingThis && <SpinnerIcon className="size-4" />}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Full Mode: Accordion by NavSection & NavItem */
            sections.map((section) => (
              <div key={section.label} className="mb-4">
                <p className="mb-2 px-1 text-xs font-semibold tracking-wider text-dark-5 dark:text-dark-6">
                  {section.label}
                </p>

                {section.items.map((item) => {
                  const hasSubItems = item.items.length > 0;
                  const isExpanded = expandedItems.includes(item.title);

                  if (!hasSubItems && item.url) {
                    /* Leaf Item (e.g. Dashboard) */
                    const isActive = pathname === item.url;
                    const isNavigatingThis = isPending && navigatingUrl === item.url;

                    return (
                      <div key={item.title} className="mb-1">
                        <button
                          onClick={() => navigate(item.url!)}
                          disabled={isPending}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-dark dark:text-white hover:bg-gray-2 dark:hover:bg-dark-2 transition-colors",
                            isActive && "bg-primary/10 text-primary dark:text-primary font-semibold",
                            isNavigatingThis && "bg-primary/5 text-primary"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="size-5 shrink-0" aria-hidden="true" />
                            <span>{item.title}</span>
                          </div>
                          {isNavigatingThis && <SpinnerIcon className="size-4" />}
                        </button>
                      </div>
                    );
                  }

                  /* Accordion Item (e.g. Master Data, Inventory, Laporan, Sistem) */
                  const isSubActive = item.items.some((sub: NavSubItem) => sub.url === pathname);

                  return (
                    <div key={item.title} className="mb-1">
                      <button
                        onClick={() => toggleExpanded(item.title)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-dark dark:text-white hover:bg-gray-2 dark:hover:bg-dark-2 transition-colors",
                          isSubActive && !isExpanded && "text-primary font-medium"
                        )}
                        aria-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="size-5 shrink-0" aria-hidden="true" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <ChevronDownIcon
                          className={cn(
                            "text-dark-5 dark:text-dark-6 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>

                      {/* Sub-items accordion container */}
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-300 ease-in-out pl-8 space-y-1",
                          isExpanded ? "max-h-96 pt-1 pb-2 opacity-100" : "max-h-0 opacity-0"
                        )}
                      >
                        {item.items.map((sub: NavSubItem) => {
                          const isActive = pathname === sub.url;
                          const isNavigatingThis = isPending && navigatingUrl === sub.url;

                          return (
                            <button
                              key={sub.url}
                              onClick={() => navigate(sub.url)}
                              disabled={isPending}
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-dark dark:text-white hover:bg-gray-2 dark:hover:bg-dark-2 transition-colors",
                                isActive && "bg-primary/10 text-primary dark:text-primary font-semibold",
                                isNavigatingThis && "bg-primary/5 text-primary"
                              )}
                            >
                              <span>{sub.title}</span>
                              {isNavigatingThis && <SpinnerIcon className="size-4" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
