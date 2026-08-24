"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { WorkbenchHeaderIdentity } from "@/features/navigation/WorkbenchHeaderIdentity";
import { cn } from "@/lib/utils";
import { WORKBENCH_NAV_ITEMS } from "@/routes";
import { BrandLockup } from "@/shared/BrandLockup";

import {
  workbenchHeaderLeadVariants,
  workbenchHeaderNavLinkVariants,
  workbenchHeaderNavVariants,
  workbenchHeaderVariants,
} from "./WorkbenchHeader.styles";

export interface WorkbenchHeaderProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Clinic the signed-in session belongs to. */
  clinicName: string;
}

const WorkbenchHeader = React.forwardRef<HTMLElement, WorkbenchHeaderProps>(
  ({ className, clinicName, ...props }, ref) => {
    const pathname = usePathname();

    return (
      <header
        ref={ref}
        data-component="WorkbenchHeader"
        {...props}
        className={cn(workbenchHeaderVariants({ className }))}
      >
        <div className={cn(workbenchHeaderLeadVariants())}>
          <BrandLockup />

          <nav aria-label="Workbench sections" className={cn(workbenchHeaderNavVariants())}>
            {WORKBENCH_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  data-state={isActive ? "active" : "inactive"}
                  className={cn(workbenchHeaderNavLinkVariants({ active: isActive }))}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <WorkbenchHeaderIdentity clinicName={clinicName} />
      </header>
    );
  },
);
WorkbenchHeader.displayName = "WorkbenchHeader";

export { WorkbenchHeader };
