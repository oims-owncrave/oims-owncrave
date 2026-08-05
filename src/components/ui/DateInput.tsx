"use client";

import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import type { Instance } from "flatpickr/dist/types/instance";
import { Indonesian } from "flatpickr/dist/l10n/id";
import "flatpickr/dist/flatpickr.css";
import { cn } from "@/lib/utils";

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const BTN = "px-3 py-1 text-xs rounded font-medium transition-colors cursor-pointer";

export function DateInput({ value, onChange, placeholder = "Pilih tanggal", className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<Instance | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!inputRef.current) return;
    fpRef.current = flatpickr(inputRef.current, {
      locale: Indonesian,
      dateFormat: "Y-m-d",
      defaultDate: value || undefined,
      onChange: ([date]) => {
        if (!date) return;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        onChangeRef.current?.(`${y}-${m}-${d}`);
      },
      onReady: (_dates, _str, fp) => {
        const footer = document.createElement("div");
        footer.className = "flex justify-between gap-2 border-t border-gray-200 px-3 py-2";

        const todayBtn = document.createElement("button");
        todayBtn.textContent = "Hari ini";
        todayBtn.className = `${BTN} bg-primary text-white hover:bg-primary-dark`;
        todayBtn.addEventListener("click", () => {
          fp.setDate(new Date(), true);
        });

        const clearBtn = document.createElement("button");
        clearBtn.textContent = "Hapus";
        clearBtn.className = `${BTN} text-gray-500 hover:bg-gray-100`;
        clearBtn.addEventListener("click", () => {
          fp.clear();
          onChangeRef.current?.("");
        });

        footer.appendChild(todayBtn);
        footer.appendChild(clearBtn);
        fp.calendarContainer.appendChild(footer);
      },
    }) as Instance;
    return () => fpRef.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!fpRef.current) return;
    if (value) fpRef.current.setDate(value, false);
    else fpRef.current.clear();
  }, [value]);

  return (
    <input
      ref={inputRef}
      readOnly
      placeholder={placeholder}
      className={cn(
        "h-10 min-w-36 cursor-pointer rounded-lg border border-primary bg-white px-3 text-sm text-primary outline-none placeholder:text-primary focus:ring-1 focus:ring-primary dark:border-primary dark:bg-gray-dark dark:text-white",
        className,
      )}
    />
  );
}
