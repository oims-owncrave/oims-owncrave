"use client";

import { useRouter } from "next/navigation";

type MobilePageHeaderProps = {
  title: string;
  showBack: boolean;
};

export function MobilePageHeader({ title, showBack }: MobilePageHeaderProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 min-[850px]:hidden relative flex h-16 items-center justify-center border-b border-stroke bg-white px-4 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
      {showBack && (
        <button
          onClick={() => router.back()}
          aria-label="Kembali"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-dark hover:bg-gray-2 dark:text-dark-6 dark:hover:bg-dark-2 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <h1 className="truncate text-xl font-bold text-dark dark:text-white text-center px-10">
        {title}
      </h1>
    </div>
  );
}
