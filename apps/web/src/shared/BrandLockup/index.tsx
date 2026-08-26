import * as React from "react";

import { cn } from "@/lib/utils";

import {
  brandLockupImageVariants,
  brandLockupVariants,
  type BrandLockupVariantProps,
} from "./BrandLockup.styles";

export interface BrandLockupProps
  extends React.HTMLAttributes<HTMLSpanElement>, BrandLockupVariantProps {
  /** Accessible name for the logo image. */
  name?: string;
}

/** The Plena Health wordmark used in the header and the auth brand panel. */
const BrandLockup = React.forwardRef<HTMLSpanElement, BrandLockupProps>(
  ({ className, name = "Plena Health", size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-component="BrandLockup"
        data-size={size ?? "md"}
        {...props}
        className={cn(brandLockupVariants({ size: "md", className }))}
      >
        <img
          src="/logo-wordmark.png"
          alt={name}
          className={cn(brandLockupImageVariants())}
        />
      </span>
    );
  },
);
BrandLockup.displayName = "BrandLockup";

export { BrandLockup };
