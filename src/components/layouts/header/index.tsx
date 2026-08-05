"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggleSwitch } from "./theme-toggle";
import { MobileHomeHeader } from "./mobile-home-header";
import { MobilePageHeader } from "./mobile-page-header";
import { getPageTitle } from "@/components/layouts/sidebar/data";

type HeaderProps = {
  userInfo: ReactNode;
  userRole?: string;
  userName?: string;
};

export function Header({ userInfo, userRole = "viewer", userName = "Pengguna" }: HeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/dashboard";
  const title = getPageTitle(pathname);
  const segments = pathname.split("/").filter(Boolean);
  const showBack = segments.length > 2;

  return (
    <>
      {/* Mobile Header (rendered at < 850px) */}
      {isHome ? (
        <MobileHomeHeader userName={userName} userRole={userRole} />
      ) : (
        <MobilePageHeader title={title} showBack={showBack} />
      )}

      {/* Desktop Header (rendered at ≥ 850px) */}
      <header className="sticky top-0 z-40 hidden min-[850px]:flex items-center justify-between border-b border-stroke bg-white px-4 py-4 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
        <div className="max-xl:hidden">
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            {title}
          </h1>
          <p className="text-xs text-dark-5 dark:text-dark-6">
            Owncrave Integrated Management System
          </p>
        </div>

        {/* Right side actions */}
        <div className="flex flex-1 items-center justify-end gap-3">
          <ThemeToggleSwitch />
          <div className="shrink-0">{userInfo}</div>
        </div>
      </header>
    </>
  );
}
