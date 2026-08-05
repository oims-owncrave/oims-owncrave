"use client";

import type { PropsWithChildren, ReactNode } from "react";
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
  return (
    <div className="flex flex-1 flex-col min-w-0 bg-gray-2 transition-all duration-300 ease-in-out dark:bg-[#020d1a]">
      <Header userInfo={userInfo} userRole={userRole} userName={userName} />
      <main className="w-full overflow-hidden p-4 pb-20 md:p-6 md:pb-6 2xl:p-10 min-[850px]:pb-0">
        {children}
      </main>
      <BottomNav userRole={userRole} />
    </div>
  );
}
