"use client";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { useSidebarContext } from "./sidebar-context";

/** Shows a spinner while THIS link's navigation is pending (Next.js useLinkStatus).
 *  Must be rendered as a descendant of <Link>. */
function NavPending() {
  const { pending } = useLinkStatus();
  return pending ? (
    <Spinner size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" />
  ) : null;
}

const menuItemBaseStyles = cva(
  "rounded-lg px-3 font-medium text-dark-4 transition-all duration-200 dark:text-dark-6",
  {
    variants: {
      isActive: {
        true: "bg-primary/[0.08] text-primary hover:bg-primary/[0.08] dark:bg-[#FFFFFF1A] dark:text-white",
        false:
          "hover:bg-gray-100 hover:text-dark hover:dark:bg-[#FFFFFF1A] hover:dark:text-white",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

/**
 * Sidebar menu item.
 * When sidebar is collapsed on desktop: wraps with a native title tooltip (hover).
 * OIMS Tooltip is click-based (mobile-first) — not suitable for collapsed sidebar hover UX.
 * We use HTML `title` attribute as the collapsed tooltip instead.
 */
export function MenuItem(
  props: {
    className?: string;
    children: React.ReactNode;
    isActive: boolean;
    tooltip?: string;
  } & ({ as?: "button"; onClick: () => void } | { as: "link"; href: string }),
) {
  const { toggleSidebar, isMobile, isOpen } = useSidebarContext();
  const collapsed = !isOpen && !isMobile;

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        onClick={() => isMobile && toggleSidebar()}
        title={collapsed && props.tooltip ? props.tooltip : undefined}
        className={cn(
          menuItemBaseStyles({
            isActive: props.isActive,
            className: "relative block py-2",
          }),
          props.className,
        )}
      >
        {props.children}
        <NavPending />
      </Link>
    );
  }

  return (
    <button
      onClick={props.onClick}
      aria-expanded={props.isActive}
      title={collapsed && props.tooltip ? props.tooltip : undefined}
      className={menuItemBaseStyles({
        isActive: props.isActive,
        className: "flex w-full items-center gap-3 py-3",
      })}
    >
      {props.children}
    </button>
  );
}
