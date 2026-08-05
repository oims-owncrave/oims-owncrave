"use client";

import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
};

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "border border-transparent bg-primary text-white hover:bg-primary-dark",
  outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
  ghost: "border border-transparent text-gray-600 hover:bg-gray-100",
  danger: "border border-transparent bg-red-500 text-white hover:bg-red-600",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-2 text-sm gap-1.5",
  md: "py-2.5 px-6 text-sm gap-2",
  lg: "px-8 py-3 text-base gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner size={16} className="-ml-0.5 shrink-0" />
      ) : (
        icon && <span className="-ml-0.5 shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
