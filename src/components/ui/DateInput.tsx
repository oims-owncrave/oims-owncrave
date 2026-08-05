"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value?: string; // YYYY-MM-DD
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
}

function toDate(s: string | undefined): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function DateInput({ value, onChange, placeholder = "Pilih tanggal", className, containerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selected = toDate(value);
  const display = selected
    ? selected.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return (
    <div ref={ref} className={cn("relative", containerClassName)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-10 min-w-36 cursor-pointer rounded-lg border border-primary bg-white px-3 text-left text-sm text-primary outline-none transition focus:ring-1 focus:ring-primary dark:border-primary dark:bg-gray-dark dark:text-white",
          !display && "text-primary/60",
          className,
        )}
      >
        {display || placeholder}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-dark-3 dark:bg-gray-dark">
          <DayPicker
            mode="single"
            selected={selected}
            locale={id}
            onSelect={(date) => {
              if (date) {
                onChange?.(toStr(date));
                setOpen(false);
              }
            }}
            footer={
              <div className="border-t border-gray-100 pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { onChange?.(toStr(new Date())); setOpen(false); }}
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  Today
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={() => { onChange?.(""); setOpen(false); }}
                    className="ml-4 text-sm text-gray-400 hover:text-gray-600"
                  >
                    Hapus
                  </button>
                )}
              </div>
            }
            classNames={{
              root: "p-3 w-69",
              months: "flex flex-col",
              month_caption: "relative flex items-center justify-center mb-3",
              caption_label: "text-sm font-bold text-gray-900 dark:text-white pointer-events-none",
              nav: "absolute inset-x-0 top-0 flex justify-between z-10",
              button_previous: "p-2 mt-2 ml-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer min-w-7 min-h-7 flex items-center justify-center",
              button_next: "p-2 mt-2 mr-2 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer min-w-7 min-h-7 flex items-center justify-center",
              month_grid: "w-full border-collapse",
              weekdays: "flex mb-1",
              weekday: "w-9 text-center text-xs font-medium text-gray-400 py-1",
              weeks: "flex flex-col gap-0.5",
              week: "flex",
              day: "w-9 h-9 text-center p-0",
              day_button: cn(
                "w-9 h-9 rounded-md text-sm font-normal text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer dark:text-white dark:hover:bg-dark-2",
              ),
              selected: "[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary [&>button]:rounded-md",
              today: "[&>button]:font-semibold [&>button]:text-primary",
              outside: "[&>button]:text-gray-300 dark:[&>button]:text-gray-600",
              disabled: "[&>button]:text-gray-200 [&>button]:cursor-not-allowed",
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? (
                  <ChevronLeft size={14} />
                ) : (
                  <ChevronRight size={14} />
                ),
            }}
          />
        </div>
      )}
    </div>
  );
}
