"use client";

import * as React from "react";

import { AUTH_MODE_HEADINGS, AUTH_MODES } from "@/constants/auth";
import { useAuthMode } from "@/hooks/use-auth-mode";
import { cn } from "@/lib/utils";
import { SegmentedControl } from "@/shared/SegmentedControl";
import type { SignInCredentials, SignUpCredentials } from "@/types/auth/credentials";

import { SignInForm } from "../SignInForm";
import { SignUpForm } from "../SignUpForm";
import {
  authPanelContentVariants,
  authPanelHeadingVariants,
  authPanelVariants,
  type AuthPanelVariantProps,
} from "./AuthPanel.styles";

export interface AuthPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    AuthPanelVariantProps {
  onSignIn?: (credentials: SignInCredentials) => void;
  onSignUp?: (credentials: SignUpCredentials) => void;
}

const AuthPanel = React.forwardRef<HTMLDivElement, AuthPanelProps>(
  ({ className, onSignIn, onSignUp, ...props }, ref) => {
    const { mode, isSignIn, items, setMode } = useAuthMode();

    return (
      <div
        ref={ref}
        data-component="AuthPanel"
        data-state={mode}
        {...props}
        className={cn(authPanelVariants({ className }))}
      >
        <div className={cn(authPanelContentVariants())}>
          <SegmentedControl
            items={items}
            value={mode}
            onChange={setMode}
            label="Sign in or sign up"
          />

          <h2 className={cn(authPanelHeadingVariants())}>
            {AUTH_MODE_HEADINGS[mode]}
          </h2>

          {isSignIn ? (
            <SignInForm
              id={`${AUTH_MODES.SIGN_IN}-panel`}
              role="tabpanel"
              aria-labelledby={`${AUTH_MODES.SIGN_IN}-tab`}
              onSubmit={onSignIn}
              onSwitchToSignUp={() => setMode(AUTH_MODES.SIGN_UP)}
            />
          ) : (
            <SignUpForm
              id={`${AUTH_MODES.SIGN_UP}-panel`}
              role="tabpanel"
              aria-labelledby={`${AUTH_MODES.SIGN_UP}-tab`}
              onSubmit={onSignUp}
              onSwitchToSignIn={() => setMode(AUTH_MODES.SIGN_IN)}
            />
          )}
        </div>
      </div>
    );
  },
);
AuthPanel.displayName = "AuthPanel";

export { AuthPanel };
