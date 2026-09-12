import * as React from "react";
import Image from "next/image";

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
        className={cn(brandLockupVariants({ size: size ?? "md" }), className)}
      >
        <Image
          src="/combinedlogo.png"
          alt={name}
          width={2224}
          height={713}
          priority
          className={cn(brandLockupImageVariants())}
        />
      </span>
    );
  },
);
BrandLockup.displayName = "BrandLockup";

export { BrandLockup };
