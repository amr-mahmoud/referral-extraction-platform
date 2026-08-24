import * as React from "react";

import { cn } from "@/lib/utils";

import {
  textFieldControlVariants,
  textFieldInputVariants,
  textFieldLabelVariants,
  textFieldMessageVariants,
  textFieldVariants,
  type TextFieldVariantProps,
} from "./TextField.styles";

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    TextFieldVariantProps {
  label: string;
  /** Validation or helper copy rendered under the control. */
  message?: string;
  /** Rendered inside the control, after the input (e.g. a show/hide toggle). */
  trailing?: React.ReactNode;
  /** Applied to the wrapper rather than the `<input>`. */
  containerClassName?: string;
  /** Lets a wrapping component claim the root identifier as its own. */
  "data-component"?: string;
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      containerClassName,
      id,
      label,
      message,
      tone,
      trailing,
      "data-component": dataComponent = "TextField",
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const messageId = message ? `${inputId}-message` : undefined;

    return (
      <div
        data-component={dataComponent}
        data-tone={tone ?? "default"}
        className={cn(textFieldVariants({ className: containerClassName }))}
      >
        <label htmlFor={inputId} className={cn(textFieldLabelVariants())}>
          {label}
        </label>

        <div className={cn(textFieldControlVariants({ tone }))}>
          <input
            ref={ref}
            id={inputId}
            aria-describedby={messageId}
            aria-invalid={tone === "error" || undefined}
            {...props}
            className={cn(textFieldInputVariants({ className }))}
          />
          {trailing}
        </div>

        {message ? (
          <p id={messageId} className={cn(textFieldMessageVariants({ tone }))}>
            {message}
          </p>
        ) : null}
      </div>
    );
  },
);
TextField.displayName = "TextField";

export { TextField };
