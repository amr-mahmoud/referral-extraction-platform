import * as React from "react";

import { cn } from "@/lib/utils";

import {
  dashboardLayoutContentVariants,
  dashboardLayoutMainVariants,
  dashboardLayoutVariants,
  type DashboardLayoutContentWidth,
  type DashboardLayoutVariantProps,
} from "./DashboardLayout.styles";

export interface DashboardLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>, DashboardLayoutVariantProps {
  /** Full-bleed strip above the header — throughput stats, incident notices. */
  banner?: React.ReactNode;
  /** The application header bar. */
  header: React.ReactNode;
  /** `contained` (default) pads/centres the content column; `full` bleeds it edge-to-edge. */
  contentWidth?: DashboardLayoutContentWidth;
  /** Optional class override for the content container (`DashboardLayout-content`). */
  contentClassName?: string;
}

/**
 * Full-viewport shell for every authenticated screen: optional banner, header,
 * then a scrolling content column that owns the remaining height.
 */
const DashboardLayout = React.forwardRef<HTMLDivElement, DashboardLayoutProps>(
  (
    {
      banner,
      children,
      className,
      contentClassName,
      contentWidth,
      header,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-component="DashboardLayout"
        {...props}
        className={cn(dashboardLayoutVariants({ className }))}
      >
        {banner}
        {header}

        <main className={cn(dashboardLayoutMainVariants())}>
          <div
            data-component="DashboardLayout-content"
            data-width={contentWidth ?? "contained"}
            className={cn(
              dashboardLayoutContentVariants({ width: contentWidth }),
              contentClassName,
            )}
          >
            {children}
          </div>
        </main>
      </div>
    );
  },
);
DashboardLayout.displayName = "DashboardLayout";

export { DashboardLayout };
