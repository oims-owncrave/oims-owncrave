"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, ChevronUp, MenuIcon } from "./icons";
import { NAV_DATA } from "./data";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

export function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const collapsed = !isOpen && !isMobile;

  // Filter sections based on role — ownerOnly sections hidden for non-owners
  const visibleSections = NAV_DATA.filter(
    (section) => !section.ownerOnly || userRole === "owner",
  );

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
  };

  useEffect(() => {
    // Auto-expand submenu when its subpage is active
    visibleSections.some((section) => {
      return section.items.some((item) => {
        return item.items.some((subItem) => {
          if (subItem.url === pathname) {
            if (!expandedItems.includes(item.title)) {
              toggleExpanded(item.title);
            }
            return true;
          }
        });
      });
    });
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "top-0 h-screen border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-dark",
          isMobile
            ? cn(
                "fixed inset-y-0 left-0 z-50",
                isOpen ? "w-[290px]" : "w-0 border-r-0 overflow-hidden",
              )
            : cn("sticky shrink-0", isOpen ? "w-[290px]" : "w-[100.5px]"),
        )}
        aria-label="Main navigation"
        aria-hidden={isMobile && !isOpen}
      >
        <div className="flex h-full flex-col pt-5 pb-10 pl-[25px] pr-[7px]">
          <div className="flex items-center gap-3 py-2.5 min-[850px]:py-0 pr-2">
            {isMobile && isOpen ? (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 translate-y-3 text-right"
              >
                <span className="sr-only">Close Menu</span>
                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            ) : (
              <button
                onClick={toggleSidebar}
                className="rounded-lg border ml-1 px-1.5 py-1 translate-y-3 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A]"
                aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <MenuIcon className="size-6 text-dark dark:text-white" />
                <span className="sr-only">Toggle Sidebar</span>
              </button>
            )}

            <Link
              href="/dashboard"
              onClick={() => isMobile && toggleSidebar()}
              className={cn(
                "px-0 py-2.5 min-[850px]:py-0 block transition-all duration-300 ease-in-out origin-left",
                collapsed
                  ? "opacity-0 scale-x-0 pointer-events-none w-0"
                  : "opacity-100 scale-x-100",
              )}
              tabIndex={collapsed ? -1 : 0}
            >
              <Logo />
            </Link>
          </div>

          {/* Navigation */}
          <div
            className={cn(
              "custom-scrollbar mt-15 flex-1 overflow-y-auto overflow-x-hidden whitespace-nowrap transition-all duration-300 ease-in-out min-[850px]:mt-15",
              collapsed ? "pr-0" : "pr-3",
            )}
          >
            {visibleSections.map((section) => (
              <div key={section.label} className="mb-6">
                {!collapsed ? (
                  <h2
                    className={cn(
                      "mb-5 text-xs font-semibold uppercase tracking-wider text-dark-4 dark:text-dark-6 transition-all duration-300 ease-in-out origin-left overflow-hidden whitespace-nowrap",
                      collapsed ? "opacity-0 max-h-0 mb-10" : "opacity-100 max-h-10",
                    )}
                    aria-hidden={collapsed}
                  >
                    {section.label}
                  </h2>
                ) : (
                  <div className="mb-10" aria-hidden="true" />
                )}

                <nav role="navigation" aria-label={section.label}>
                  <ul className={cn(collapsed && "mb-16")}>
                    {section.items.map((item) => (
                      <li key={item.title} className={cn(collapsed && "w-12")}>
                        {item.items.length ? (
                          <div>
                            <MenuItem
                              isActive={item.items.some(
                                ({ url }) => url === pathname,
                              )}
                              tooltip={item.title}
                              onClick={() => {
                                if (collapsed) {
                                  setIsOpen(true);
                                  if (!expandedItems.includes(item.title)) {
                                    toggleExpanded(item.title);
                                  }
                                  return;
                                }
                                toggleExpanded(item.title);
                              }}
                              className=""
                            >
                              <span className="flex size-6 shrink-0 items-center justify-center">
                                <item.icon aria-hidden={true} />
                              </span>

                              {!collapsed && (
                                <>
                                  <span
                                    className={cn(
                                      "transition-all duration-300 ease-in-out origin-left overflow-hidden whitespace-nowrap",
                                      collapsed ? "opacity-0 w-0" : "opacity-100",
                                    )}
                                    aria-hidden={collapsed}
                                  >
                                    {item.title}
                                  </span>

                                  <ChevronUp
                                    className={cn(
                                      "ml-auto rotate-180 transition-all duration-500 ease-in-out",
                                      collapsed
                                        ? "opacity-0 w-0 overflow-hidden"
                                        : "opacity-100",
                                      expandedItems.includes(item.title) &&
                                        "rotate-0",
                                    )}
                                    aria-hidden
                                  />
                                </>
                              )}
                            </MenuItem>

                            <ul
                              className={cn(
                                "ml-9 mr-0 space-y-1.5 pr-0 overflow-hidden transition-all duration-500 ease-in-out",
                                !collapsed &&
                                  expandedItems.includes(item.title)
                                  ? "max-h-96 opacity-100 pb-[15px] pt-2"
                                  : "max-h-0 opacity-0 pb-0 pt-0",
                              )}
                              role="menu"
                            >
                              {item.items.map((subItem) => (
                                <li key={subItem.title} role="none">
                                  <MenuItem
                                    as="link"
                                    href={subItem.url}
                                    isActive={pathname === subItem.url}
                                  >
                                    <span>{subItem.title}</span>
                                  </MenuItem>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <MenuItem
                            className="flex items-center gap-3 py-3"
                            as="link"
                            href={item.url ?? "#"}
                            isActive={pathname === item.url}
                            tooltip={item.title}
                          >
                            <span className="flex size-6 shrink-0 items-center justify-center">
                              <item.icon aria-hidden={true} />
                            </span>

                            {!collapsed && <span>{item.title}</span>}
                          </MenuItem>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
