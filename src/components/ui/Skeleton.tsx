import { cn } from "@/lib/utils";
import * as React from "react";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-md h-6 w-full", className)}
      {...props}
    />
  );
}
