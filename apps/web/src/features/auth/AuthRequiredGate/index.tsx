"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AUTH_MODES,
  AUTH_REQUIRED_DIALOG,
} from "@/constants/auth";
import { cn } from "@/lib/utils";
import { authRouteWithMode, ROUTES } from "@/routes";
import { Modal } from "@/shared/Modal";

import {
  authRequiredGateActionsVariants,
  authRequiredGateBackdropVariants,
  authRequiredGateEyebrowVariants,
  authRequiredGateMessageVariants,
  authRequiredGatePanelVariants,
  authRequiredGateRegisterLinkVariants,
  authRequiredGateSignInLinkVariants,
  authRequiredGateTitleVariants,
  authRequiredGateVariants,
} from "./AuthRequiredGate.styles";

const TITLE_ID = "auth-required-title";

/**
 * Dimmed registration gate shown over the dashboard when a visitor has no
 * clinic session. It reuses the shared `Modal` (backdrop dim + focus trap) and
 * dismisses to the public About page, so an unauthenticated visitor always has
 * a way forward instead of a dead end.
 */
export function AuthRequiredGate() {
  const router = useRouter();

  return (
    <Modal
      labelledBy={TITLE_ID}
      className={cn(authRequiredGatePanelVariants())}
      backdropClassName={cn(authRequiredGateBackdropVariants())}
      onClose={() => router.push(ROUTES.ABOUT)}
    >
      <div data-component="AuthRequiredGate" className={cn(authRequiredGateVariants())}>
        <span
          data-component="AuthRequiredGate-eyebrow"
          className={cn(authRequiredGateEyebrowVariants())}
        >
          {AUTH_REQUIRED_DIALOG.eyebrow}
        </span>

        <h2
          id={TITLE_ID}
          data-component="AuthRequiredGate-title"
          className={cn(authRequiredGateTitleVariants())}
        >
          {AUTH_REQUIRED_DIALOG.title}
        </h2>

        <p
          data-component="AuthRequiredGate-message"
          className={cn(authRequiredGateMessageVariants())}
        >
          {AUTH_REQUIRED_DIALOG.message}
        </p>

        <div
          data-component="AuthRequiredGate-actions"
          className={cn(authRequiredGateActionsVariants())}
        >
          <Link
            href={authRouteWithMode(AUTH_MODES.SIGN_UP)}
            data-component="AuthRequiredGate-registerLink"
            className={cn(authRequiredGateRegisterLinkVariants())}
          >
            {AUTH_REQUIRED_DIALOG.registerLabel}
          </Link>

          <Link
            href={authRouteWithMode(AUTH_MODES.SIGN_IN)}
            data-component="AuthRequiredGate-signInLink"
            className={cn(authRequiredGateSignInLinkVariants())}
          >
            {AUTH_REQUIRED_DIALOG.signInLabel}
          </Link>
        </div>
      </div>
    </Modal>
  );
}
