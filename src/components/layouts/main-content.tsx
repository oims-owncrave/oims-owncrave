"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { Header } from "@/components/layouts/header";

type MainContentProps = PropsWithChildren<{
  userInfo: ReactNode;
}>;

export function MainContent({ children, userInfo }: MainContentProps) {
  return (
    <div className="flex flex-1 flex-col min-w-0 bg-gray-2 transition-all duration-300 ease-in-out dark:bg-[#020d1a]">
      <Header userInfo={userInfo} />
      <main className="isolate w-full overflow-hidden p-4 md:p-6 2xl:p-10">
        {children}
      </main>
    </div>
  );
}

