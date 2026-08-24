"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import {
  radioCardBodyVariants,
  radioCardDescriptionVariants,
  radioCardDotVariants,
  radioCardInputVariants,
  radioCardLabelVariants,
  radioCardSlotVariants,
  radioCardVariants,
} from "./RadioCard.styles";

export interface RadioCardProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  label: string;
  description?: string;
  /**
   * Control revealed under the label — a saved-schema select, a JSON dropzone.
   * Kept as a slot so the card stays a choice primitive rather than growing a
   * branch per schema source.
   */
  children?: React.ReactNode;
  /** Applied to the wrapping `<label>` rather than the `<input>`. */
  containerClassName?: string;
}

const RadioCard = React.forwardRef<HTMLInputElement, RadioCardProps>(
  (
    { checked, children, className, containerClassName, description, label, ...props },
    ref,
  ) => {
    const isChecked = Boolean(checked);

    return (
      <label
        data-component="RadioCard"
        data-state={isChecked ? "checked" : "unchecked"}
        className={cn(
          radioCardVariants({ checked: isChecked, className: containerClassName }),
        )}
      >
        <input
          ref={ref}
          type="radio"
          checked={checked}
          {...props}
          className={cn(radioCardInputVariants({ className }))}
        />

        <span aria-hidden className={cn(radioCardDotVariants({ checked: isChecked }))} />

        <span className={cn(radioCardBodyVariants())}>
          <span className={cn(radioCardLabelVariants())}>{label}</span>

          {description ? (
            <span className={cn(radioCardDescriptionVariants())}>{description}</span>
          ) : null}

          {children ? (
            <span className={cn(radioCardSlotVariants())}>{children}</span>
          ) : null}
        </span>
      </label>
    );
  },
);
RadioCard.displayName = "RadioCard";

export { RadioCard };
