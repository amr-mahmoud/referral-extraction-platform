"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { WorkbenchHeaderGuestActions } from "@/features/navigation/WorkbenchHeaderGuestActions";
import { WorkbenchHeaderIdentity } from "@/features/navigation/WorkbenchHeaderIdentity";
import { cn } from "@/lib/utils";
import { ROUTES, WORKBENCH_NAV_ITEMS } from "@/routes";
import { BrandLockup } from "@/shared/BrandLockup";

import {
  workbenchHeaderActionsVariants,
  workbenchHeaderBarVariants,
  workbenchHeaderMobileNavVariants,
  workbenchHeaderMobileNavWrapVariants,
  workbenchHeaderNavLinkVariants,
  workbenchHeaderNavVariants,
  workbenchHeaderVariants,
} from "./WorkbenchHeader.styles";

export interface WorkbenchHeaderProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Clinic the signed-in session belongs to. `null`/omitted renders guest actions instead of the identity chip. */
  clinicName?: string | null;
}

const WorkbenchHeader = React.forwardRef<HTMLElement, WorkbenchHeaderProps>(
  ({ className, clinicName, ...props }, ref) => {
    const pathname = usePathname();
    const hasClinicSession = Boolean(clinicName);

    const navLinks = WORKBENCH_NAV_ITEMS.map((item) => {
      const isActive =
        item.href === ROUTES.DASHBOARD
          ? pathname === ROUTES.DASHBOARD ||
            pathname.startsWith(`${ROUTES.REFERRALS}/`)
          : pathname === item.href;

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
    });

    return (
      <header
        ref={ref}
        data-component="WorkbenchHeader"
        data-authenticated={hasClinicSession}
        {...props}
        className={cn(workbenchHeaderVariants({ className }))}
      >
        <div className={cn(workbenchHeaderBarVariants())}>
          <Link
            href={ROUTES.DASHBOARD}
            data-component="WorkbenchHeader-logoLink"
            className="flex items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/45"
          >
            <BrandLockup className="h-7 sm:h-9" />
          </Link>

          {/* Desktop navigation: inline beside logo */}
          <nav
            aria-label="Workbench sections"
            className={cn(workbenchHeaderNavVariants())}
          >
            {navLinks}
          </nav>

          <div className={cn(workbenchHeaderActionsVariants())}>
            {clinicName ? (
              <WorkbenchHeaderIdentity clinicName={clinicName} />
            ) : (
              <WorkbenchHeaderGuestActions />
            )}
          </div>
        </div>

        {/* Mobile navigation: clean segmented pill control below top bar */}
        <div className={cn(workbenchHeaderMobileNavWrapVariants())}>
          <nav
            aria-label="Workbench sections mobile"
            className={cn(workbenchHeaderMobileNavVariants())}
          >
            {navLinks}
          </nav>
        </div>
      </header>
    );
  },
);
WorkbenchHeader.displayName = "WorkbenchHeader";

export { WorkbenchHeader };
