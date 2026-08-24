"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/Button";
import { FormError } from "@/shared/FormError";
import { PasswordField } from "@/shared/PasswordField";
import { TextField } from "@/shared/TextField";

import {
  signInFormFieldsVariants,
  signInFormFootnoteVariants,
  signInFormVariants,
  type SignInFormVariantProps,
} from "./SignInForm.styles";

export interface SignInFormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit">,
    SignInFormVariantProps {
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit?: (credentials: { username: string; password: string }) => void;
  /** Renders the "New clinic? Create an account" switch. */
  onSwitchToSignUp?: () => void;
}

const SignInForm = React.forwardRef<HTMLFormElement, SignInFormProps>(
  (
    { className, isSubmitting, error, onSubmit, onSwitchToSignUp, ...props },
    ref,
  ) => {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);

      const username = String(form.get("username") ?? "").trim();
      const password = String(form.get("password") ?? "");

      if (!username || !password) return;

      onSubmit?.({ username, password });
    };

    return (
      <form
        ref={ref}
        noValidate
        data-component="SignInForm"
        {...props}
        onSubmit={handleSubmit}
        className={cn(signInFormVariants({ className }))}
      >
        {error ? <FormError>{error}</FormError> : null}

        <div className={cn(signInFormFieldsVariants())}>
          <TextField
            name="username"
            label="Username"
            placeholder="unique per clinic"
            autoComplete="username"
            required
          />
          <PasswordField
            name="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
          <span aria-hidden>→</span>
        </Button>

        <p className={cn(signInFormFootnoteVariants())}>
          New clinic?{" "}
          <Button variant="link" size="inline" type="button" onClick={onSwitchToSignUp}>
            Create an account
          </Button>{" "}
          — you&rsquo;ll set a default extraction schema after signup.
        </p>
      </form>
    );
  },
);
SignInForm.displayName = "SignInForm";

export { SignInForm };
