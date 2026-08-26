import * as React from "react";

import { cn } from "@/lib/utils";

import {
  referralDetailLayoutMainVariants,
  referralDetailLayoutVariants,
  type ReferralDetailLayoutVariantProps,
} from "./ReferralDetailLayout.styles";

export interface ReferralDetailLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    ReferralDetailLayoutVariantProps {
  /** The slim breadcrumb bar across the top (wireframe 1e). */
  header: React.ReactNode;
}

/**
 * Full-viewport shell for the review screen: a slim breadcrumb header then a
 * scrolling content column. Deliberately separate from `DashboardLayout` —
 * the review header is a breadcrumb, not the full WorkbenchHeader with
 * logo/nav/clinic identity.
 */
const ReferralDetailLayout = React.forwardRef<
  HTMLDivElement,
  ReferralDetailLayoutProps
>(({ children, className, header, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-component="ReferralDetailLayout"
      {...props}
      className={cn(referralDetailLayoutVariants({ className }))}
    >
      {header}

      <main className={cn(referralDetailLayoutMainVariants())}>{children}</main>
    </div>
  );
});
ReferralDetailLayout.displayName = "ReferralDetailLayout";

export { ReferralDetailLayout };
