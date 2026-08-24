import * as React from "react";

import { cn } from "@/lib/utils";

import {
  formErrorVariants,
  type FormErrorVariantProps,
} from "./FormError.styles";

export interface FormErrorProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    FormErrorVariantProps {}

/** Server-validation error banner shown above a form's fields. */
const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        role="alert"
        data-component="FormError"
        {...props}
        className={cn(formErrorVariants({ className }))}
      />
    );
  },
);
FormError.displayName = "FormError";

export { FormError };
