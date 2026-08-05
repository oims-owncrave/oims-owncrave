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
    <div className="min-[850px]:hidden bg-linear-to-r from-primary to-indigo-700 px-5 py-8 text-white shadow-md">
      <div className="flex items-center justify-between">
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
    </div>
  );
}
