"use client";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
};

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
  ghost: "text-gray-600 hover:bg-gray-100",
  danger: "bg-red-500 text-white hover:bg-red-600",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-2 text-sm gap-1.5",
  md: "py-3 px-6 text-sm gap-2",
  lg: "px-8 py-3 text-base gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {icon && <span className="-ml-0.5 shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
