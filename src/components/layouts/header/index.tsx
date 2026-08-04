"use client";

import type { ReactNode } from "react";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { ThemeToggleSwitch } from "./theme-toggle";

type HeaderProps = {
  userInfo: ReactNode;
};

export function Header({ userInfo }: HeaderProps) {
  const { toggleSidebar } = useSidebarContext();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-stroke bg-white px-4 py-4 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      {/* Mobile toggle — hidden at ≥850px */}
      <button
        onClick={toggleSidebar}
        className="rounded-lg border px-1.5 py-1 mr-3 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] min-[850px]:hidden"
        aria-label="Toggle Sidebar"
      >
        <MenuIcon className="text-dark dark:text-white" />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {/* App title — hidden on small screens */}
      <div className="max-xl:hidden">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-dark-5 dark:text-dark-6">
          Owncrave Integrated Management System
        </p>
      </div>

      {/* Right side actions */}
      <div className="flex flex-1 items-center justify-end gap-3">
        <ThemeToggleSwitch />
        <div className="shrink-0">{userInfo}</div>
      </div>
    </header>
  );
}
