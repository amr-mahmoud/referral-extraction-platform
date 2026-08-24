import * as React from "react";

import { cn } from "@/lib/utils";

import {
  checkboxBoxVariants,
  checkboxIconVariants,
  checkboxInputVariants,
  checkboxVariants,
  type CheckboxVariantProps,
} from "./Checkbox.styles";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
    CheckboxVariantProps {
  label: React.ReactNode;
  /** Applied to the wrapping `<label>` rather than the `<input>`. */
  containerClassName?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, containerClassName, label, ...props }, ref) => {
    return (
      <label
        data-component="Checkbox"
        className={cn(checkboxVariants({ className: containerClassName }))}
      >
        <input
          ref={ref}
          type="checkbox"
          {...props}
          className={cn(checkboxInputVariants({ className }))}
        />
        <span aria-hidden className={cn(checkboxBoxVariants())}>
          <svg
            viewBox="0 0 12 12"
            fill="none"
            className={cn(checkboxIconVariants())}
          >
            <path
              d="M1.75 6.25 4.5 9l5.75-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {label}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
