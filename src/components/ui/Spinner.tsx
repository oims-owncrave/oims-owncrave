import { cn } from "@/lib/utils";

interface SpinnerProps {
  /** Diameter in px (default 20). */
  size?: number;
  /** Border color class for the spinning arc (default inherits primary). */
  className?: string;
}

/** Minimal loading spinner — bordered circle with animate-spin. */
export function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Memuat"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
