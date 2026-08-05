"use client";

import { useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV_DATA } from "@/components/layouts/sidebar/data";
import { cn } from "@/lib/utils";

type MenuSheetProps = {
  open: boolean;
  onClose: () => void;
  userRole: string;
};

export function MenuSheet({ open, onClose, userRole }: MenuSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Trap scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function navigate(url: string) {
    onClose();
    startTransition(() => { router.push(url); });
  }

  const sections = NAV_DATA.filter(
    (s) => !s.ownerOnly || userRole === "owner"
  );

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
        aria-label="Menu Navigasi"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-dark-3" />
        </div>

        {/* Close button */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stroke dark:border-dark-3">
          <span className="text-sm font-semibold text-dark dark:text-white">Menu</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-2 dark:hover:bg-dark-2"
            aria-label="Tutup menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Nav sections */}
        <div className="px-4 py-3 pb-8">
          {sections.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="mb-2 px-1 text-xs font-semibold text-dark-5 dark:text-dark-6 tracking-wider">
                {section.label}
              </p>
              {section.items.map((item) => (
                <div key={item.title} className="mb-1">
                  {item.url ? (
                    <button
                      onClick={() => navigate(item.url!)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-dark dark:text-white hover:bg-gray-2 dark:hover:bg-dark-2 transition-colors",
                        pathname === item.url && "bg-primary/10 text-primary dark:text-primary font-medium"
                      )}
                    >
                      <item.icon className="size-5 shrink-0" aria-hidden="true" />
                      {item.title}
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 px-3 py-1.5">
                        <item.icon className="size-5 shrink-0 text-dark-5 dark:text-dark-6" aria-hidden="true" />
                        <span className="text-xs font-medium text-dark-5 dark:text-dark-6">{item.title}</span>
                      </div>
                      <div className="ml-8">
                        {item.items.map((sub) => (
                          <button
                            key={sub.url}
                            onClick={() => navigate(sub.url)}
                            className={cn(
                              "flex w-full items-center rounded-lg px-3 py-2 text-sm text-dark dark:text-white hover:bg-gray-2 dark:hover:bg-dark-2 transition-colors",
                              pathname === sub.url && "bg-primary/10 text-primary dark:text-primary font-medium"
                            )}
                          >
                            {sub.title}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
