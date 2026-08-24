import * as React from "react";

import { cn } from "@/lib/utils";

import {
  brandLockupMarkVariants,
  brandLockupVariants,
  type BrandLockupVariantProps,
} from "./BrandLockup.styles";

export interface BrandLockupProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    BrandLockupVariantProps {
  /** Wordmark next to the ring. Defaults to the product name. */
  name?: string;
}

/** The ring-and-wordmark pairing used in the header and the auth brand panel. */
const BrandLockup = React.forwardRef<HTMLSpanElement, BrandLockupProps>(
  ({ className, name = "Referral Workbench", size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-component="BrandLockup"
        data-size={size ?? "sm"}
        {...props}
        className={cn(brandLockupVariants({ size, className }))}
      >
        <span aria-hidden className={cn(brandLockupMarkVariants({ size }))} />
        {name}
      </span>
    );
  },
);
BrandLockup.displayName = "BrandLockup";

export { BrandLockup };
