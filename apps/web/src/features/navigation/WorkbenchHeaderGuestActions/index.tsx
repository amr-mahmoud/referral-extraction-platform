import * as React from "react";
import Link from "next/link";

import {
  AUTH_GUEST_REGISTER_LABEL,
  AUTH_MODE_LABELS,
  AUTH_MODES,
} from "@/constants/auth";
import { cn } from "@/lib/utils";
import { authRouteWithMode } from "@/routes";

import {
  workbenchHeaderGuestActionsVariants,
  workbenchHeaderGuestRegisterLinkVariants,
  workbenchHeaderGuestSignInLinkVariants,
} from "../WorkbenchHeader/WorkbenchHeader.styles";

export type WorkbenchHeaderGuestActionsProps =
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Header actions for a visitor with no clinic session: a quiet "Sign in" link
 * and a primary "Register" CTA, both deep-linking into the matching auth mode.
 * Replaces the clinic identity chip that signed-in users see.
 */
const WorkbenchHeaderGuestActions = React.forwardRef<
  HTMLDivElement,
  WorkbenchHeaderGuestActionsProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-component="WorkbenchHeaderGuestActions"
      {...props}
      className={cn(workbenchHeaderGuestActionsVariants({ className }))}
    >
      <Link
        href={authRouteWithMode(AUTH_MODES.SIGN_IN)}
        data-component="WorkbenchHeaderGuestActions-signInLink"
        className={cn(workbenchHeaderGuestSignInLinkVariants())}
      >
        {AUTH_MODE_LABELS[AUTH_MODES.SIGN_IN]}
      </Link>

      <Link
        href={authRouteWithMode(AUTH_MODES.SIGN_UP)}
        data-component="WorkbenchHeaderGuestActions-registerLink"
        className={cn(workbenchHeaderGuestRegisterLinkVariants())}
      >
        {AUTH_GUEST_REGISTER_LABEL}
      </Link>
    </div>
  );
});
WorkbenchHeaderGuestActions.displayName = "WorkbenchHeaderGuestActions";

export { WorkbenchHeaderGuestActions };
