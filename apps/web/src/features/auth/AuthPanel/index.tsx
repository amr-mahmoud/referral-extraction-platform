"use client";

import * as React from "react";

import { AUTH_MODE_HEADINGS, AUTH_MODES } from "@/constants/auth";
import { useAuthMode } from "@/hooks/use-auth-mode";
import { cn } from "@/lib/utils";
import { useLogin } from "@/server-hooks/auth/use-login";
import { useSignup } from "@/server-hooks/auth/use-signup";
import { SegmentedControl } from "@/shared/SegmentedControl";

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
    AuthPanelVariantProps {}

const AuthPanel = React.forwardRef<HTMLDivElement, AuthPanelProps>(
  ({ className, ...props }, ref) => {
    const { mode, isSignIn, items, setMode } = useAuthMode();

    const {
      execute: loginExecute,
      isLoading: isLoginLoading,
      error: loginError,
    } = useLogin();

    const {
      execute: signupExecute,
      isLoading: isSignupLoading,
      error: signupError,
    } = useSignup();

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
              isSubmitting={isLoginLoading}
              error={loginError}
              onSubmit={loginExecute}
              onSwitchToSignUp={() => setMode(AUTH_MODES.SIGN_UP)}
            />
          ) : (
            <SignUpForm
              id={`${AUTH_MODES.SIGN_UP}-panel`}
              role="tabpanel"
              aria-labelledby={`${AUTH_MODES.SIGN_UP}-tab`}
              isSubmitting={isSignupLoading}
              error={signupError}
              onSubmit={signupExecute}
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
