import type { ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem } from "./Breadcrumb";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  breadcrumb?: BreadcrumbItem[];
  className?: string;
  children?: ReactNode;
};

/**
 * Reusable Page Header component for desktop views.
 * Hidden on mobile (<850px) because MobilePageHeader handles sticky title on mobile.
 */
export function PageHeader({
  title,
  breadcrumb,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "hidden min-[850px]:flex items-center justify-between gap-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-dark dark:text-white">{title}</h2>
        {children}
      </div>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
    </div>
  );
}
