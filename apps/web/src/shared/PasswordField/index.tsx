"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { TextField, type TextFieldProps } from "@/shared/TextField";

import { passwordFieldToggleVariants } from "./PasswordField.styles";

export type PasswordFieldProps = Omit<TextFieldProps, "type" | "trailing">;

const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  (props, ref) => {
    const [isRevealed, setIsRevealed] = React.useState(false);

    return (
      <TextField
        ref={ref}
        data-component="PasswordField"
        type={isRevealed ? "text" : "password"}
        {...props}
        trailing={
          <button
            type="button"
            aria-pressed={isRevealed}
            data-state={isRevealed ? "revealed" : "hidden"}
            onClick={() => setIsRevealed((revealed) => !revealed)}
            className={cn(passwordFieldToggleVariants())}
          >
            {isRevealed ? "Hide" : "Show"}
          </button>
        }
      />
    );
  },
);
PasswordField.displayName = "PasswordField";

export { PasswordField };
