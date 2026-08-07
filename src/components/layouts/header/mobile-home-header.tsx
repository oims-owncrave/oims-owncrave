"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

type MobileHomeHeaderProps = {
  userName: string;
  userRole: string;
};

export function MobileHomeHeader({ userName, userRole }: MobileHomeHeaderProps) {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative overflow-hidden min-[850px]:hidden bg-linear-to-r from-primary to-indigo-700 px-5 pt-8 pb-12 text-white">
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/20 text-sm font-bold text-white backdrop-blur-sm">
            {initials || "U"}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold uppercase tracking-wide text-white">
              {userName}
            </h2>
            <p className="text-xs capitalize text-white/80">{userRole}</p>
          </div>
        </div>

        <Link
          href="/sistem/pengaturan"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          aria-label="Pengaturan"
        >
          <Settings className="size-5" />
        </Link>
      </div>

      {/* Wave shape transition to main content bg */}
      <div className="absolute bottom-0 left-0 h-6 w-full pointer-events-none">
        <svg
          viewBox="0 0 400 32"
          className="h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,32 Q100,20 200,32 T400,20 L400,32 Z"
            className="fill-gray-2 dark:fill-[#020d1a]"
          />
        </svg>
      </div>
    </div>
  );
}
