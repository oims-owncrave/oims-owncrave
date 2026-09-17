"use client";

import { useLayoutEffect, type PropsWithChildren, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layouts/header";
import { BottomNav } from "@/components/layouts/bottom-nav";

type MainContentProps = PropsWithChildren<{
  userInfo: ReactNode;
  userRole: string;
  userName: string;
}>;

export function MainContent({
  children,
  userInfo,
  userRole,
  userName,
}: MainContentProps) {
  const pathname = usePathname();

  // Reset scroll ke paling atas (0, 0) secara mulus pada setiap perpindahan halaman (route change)
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    window.scrollTo(0, 0);

    let locked = true;
    const keepTop = () => {
      if (locked && window.scrollY !== 0) window.scrollTo(0, 0);
    };
    window.addEventListener("scroll", keepTop, { passive: true });

    const unlock = setTimeout(() => {
      locked = false;
      window.removeEventListener("scroll", keepTop);
    }, 250);

    return () => {
      locked = false;
      clearTimeout(unlock);
      window.removeEventListener("scroll", keepTop);
    };
  }, [pathname]);

  return (
    <div className="flex flex-1 flex-col min-w-0 bg-gray-2 transition-all duration-300 ease-in-out dark:bg-[#020d1a]">
      <Header userInfo={userInfo} userRole={userRole} userName={userName} />
      {/* Tanpa overflow-hidden: kalau dipasang, <main> jadi scroll container dan
          position:sticky di dalamnya menempel ke kotak itu, bukan ke layar —
          sidebar sticky halaman dokumentasi ikut tergulir habis. Tabel lebar
          sudah ditahan overflow-x-auto di pembungkusnya masing-masing. */}
      <main className="w-full min-w-0 p-4 pb-20 md:p-6 md:pb-6 2xl:p-10 min-[850px]:pb-0">
        {children}
      </main>
      <BottomNav userRole={userRole} />
    </div>
  );
}
