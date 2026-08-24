"use client";

import * as React from "react";

import { PASSWORD_MIN_LENGTH } from "@/constants/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/Button";
import { FormError } from "@/shared/FormError";
import { PasswordField } from "@/shared/PasswordField";
import { TextField } from "@/shared/TextField";

import {
  signUpFormFieldsVariants,
  signUpFormFootnoteVariants,
  signUpFormVariants,
  type SignUpFormVariantProps,
} from "./SignUpForm.styles";

export interface SignUpFormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit">,
    SignUpFormVariantProps {
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit?: (credentials: {
    clinicName: string;
    username: string;
    password: string;
  }) => void;
  /** Renders the "Already registered? Sign in" switch. */
  onSwitchToSignIn?: () => void;
}

const SignUpForm = React.forwardRef<HTMLFormElement, SignUpFormProps>(
  (
    { className, isSubmitting, error, onSubmit, onSwitchToSignIn, ...props },
    ref,
  ) => {
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");

    const hasMismatch =
      confirmPassword.length > 0 && password !== confirmPassword;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (hasMismatch) return;

      const form = new FormData(event.currentTarget);
      const clinicName = String(form.get("clinicName") ?? "").trim();
      const username = String(form.get("username") ?? "").trim();

      if (!clinicName || !username || !password) return;

      onSubmit?.({
        clinicName,
        username,
        password,
      });
    };

    return (
      <form
        ref={ref}
        noValidate
        data-component="SignUpForm"
        {...props}
        onSubmit={handleSubmit}
        className={cn(signUpFormVariants({ className }))}
      >
        {error ? <FormError>{error}</FormError> : null}

        <div className={cn(signUpFormFieldsVariants())}>
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
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            message={`At least ${PASSWORD_MIN_LENGTH} characters.`}
            required
          />
          <PasswordField
            name="confirmPassword"
            label="Confirm password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            tone={hasMismatch ? "error" : "default"}
            message={hasMismatch ? "Passwords do not match." : undefined}
            required
          />
        </div>

        <Button type="submit" disabled={isSubmitting || hasMismatch}>
          {isSubmitting ? "Creating account…" : "Create clinic account"}
          <span aria-hidden>→</span>
        </Button>

        <p className={cn(signUpFormFootnoteVariants())}>
          Already registered?{" "}
          <Button variant="link" size="inline" type="button" onClick={onSwitchToSignIn}>
            Sign in instead
          </Button>{" "}
          — you&rsquo;ll set a default extraction schema right after signup.
        </p>
      </form>
    );
  },
);
SignUpForm.displayName = "SignUpForm";

export { SignUpForm };
