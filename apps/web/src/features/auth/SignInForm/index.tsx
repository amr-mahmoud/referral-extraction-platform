"use client";

import * as React from "react";

import { REMEMBER_SESSION_DAYS } from "@/constants/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/Button";
import { Checkbox } from "@/shared/Checkbox";
import { PasswordField } from "@/shared/PasswordField";
import { TextField } from "@/shared/TextField";
import type { SignInCredentials } from "@/types/auth/credentials";

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
  onSubmit?: (credentials: SignInCredentials) => void;
  /** Renders the "New clinic? Create an account" switch. */
  onSwitchToSignUp?: () => void;
}

const SignInForm = React.forwardRef<HTMLFormElement, SignInFormProps>(
  ({ className, isSubmitting, onSubmit, onSwitchToSignUp, ...props }, ref) => {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);

      onSubmit?.({
        clinicName: String(form.get("clinicName") ?? ""),
        username: String(form.get("username") ?? ""),
        password: String(form.get("password") ?? ""),
        rememberSession: form.get("rememberSession") === "on",
      });
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
        <div className={cn(signInFormFieldsVariants())}>
          <TextField
            name="clinicName"
            label="Clinic name"
            placeholder="Hamzavi Dermatology"
            autoComplete="organization"
            required
          />
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
          <Button variant="link" size="inline" onClick={onSwitchToSignUp}>
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
