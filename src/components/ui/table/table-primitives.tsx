import { cn } from "@/lib/utils";
import * as React from "react";

export function Table({
  className,
  containerClassName,
  containerStyle,
  ...props
}: React.HTMLAttributes<HTMLTableElement> & {
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("relative w-full overflow-auto", containerClassName)}
      style={containerStyle}
    >
      <table
        className={cn("w-full caption-bottom", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}

export function TableFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn(
        "border-t bg-gray-1 font-medium dark:bg-dark-2 [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-stroke transition-colors hover:bg-gray-1 data-[state=selected]:bg-gray-1 dark:border-dark-3 dark:hover:bg-dark-2 dark:data-[state=selected]:bg-dark-2",
        className,
      )}
      {...props}
    />
  );
}

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-dark-5 dark:text-dark-6 [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}
