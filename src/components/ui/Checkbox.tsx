"use client";

import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  indeterminate,
  disabled,
  size = "md",
  label,
  className,
}: CheckboxProps) {
  const dim = size === "sm" ? "size-4.5" : "size-5";
  const iconDim = size === "sm" ? "size-3" : "size-3.5";
  const isChecked = indeterminate || checked;

  const box = (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        dim,
        "flex shrink-0 cursor-pointer items-center justify-center rounded border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        isChecked
          ? "border-primary bg-primary text-white"
          : "border-stroke bg-white dark:border-dark-3 dark:bg-dark-2",
        className,
      )}
    >
      {indeterminate ? (
        <span className="block h-0.5 w-2 rounded bg-white" />
      ) : checked ? (
        <svg className={iconDim} viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  );

  if (!label) return box;

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {box}
      <span className="text-sm font-medium text-dark dark:text-white">
        {label}
      </span>
    </label>
  );
}
