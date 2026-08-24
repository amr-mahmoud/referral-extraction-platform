import * as React from "react";

import { cn } from "@/lib/utils";

import { buttonVariants, type ButtonVariantProps } from "./Button.styles";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        data-component="Button"
        data-variant={variant ?? "primary"}
        data-size={size ?? "md"}
        {...props}
        className={cn(buttonVariants({ variant, size, className }))}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
