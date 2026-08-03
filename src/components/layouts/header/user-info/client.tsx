"use client";

import { cn } from "@/lib/utils";
import { signOutAction } from "@/services/auth";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useState } from "react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type UserInfoClientProps = {
  displayName: string;
  email: string;
};

export function UserInfoClient({ displayName, email }: UserInfoClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-3 rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="sr-only">My Account</span>

        <figure className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-stroke bg-primary dark:border-dark-3">
            <span className="text-sm font-bold text-white">
              {getInitials(displayName)}
            </span>
          </div>
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{displayName}</span>
            <ChevronDown
              aria-hidden
              className={cn(
                "size-4 rotate-0 transition-transform",
                isOpen && "rotate-180",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-40 mt-2 min-w-[17.5rem] rounded-xl border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark">
            <h2 className="sr-only">User information</h2>

            <figure className="flex items-center gap-2.5 px-5 py-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-stroke bg-primary dark:border-dark-3">
                <span className="text-sm font-bold text-white">
                  {getInitials(displayName)}
                </span>
              </div>

              <figcaption className="flex-1 space-y-0.5 text-sm font-medium">
                <div className="truncate leading-none text-dark dark:text-white">
                  {displayName}
                </div>
                <div className="truncate text-gray-6">{email}</div>
              </figcaption>
            </figure>

            <hr className="border-stroke dark:border-dark-3" />

            <div className="p-2 text-sm text-dark-4 dark:text-dark-6">
              <button
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <User className="size-4" aria-hidden />
                <span className="font-medium">Profil Saya</span>
              </button>
            </div>

            <hr className="border-stroke dark:border-dark-3" />

            <div className="p-2">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-dark-4 hover:bg-gray-2 hover:text-dark dark:text-dark-6 dark:hover:bg-dark-3 dark:hover:text-white"
                >
                  <LogOut className="size-4" aria-hidden />
                  <span>Keluar</span>
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
