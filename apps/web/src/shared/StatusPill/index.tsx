import * as React from "react";

import { cn } from "@/lib/utils";

import {
  statusPillVariants,
  type StatusPillVariantProps,
} from "./StatusPill.styles";

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    StatusPillVariantProps {}

const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ className, tone, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-component="StatusPill"
        data-tone={tone ?? "neutral"}
        {...props}
        className={cn(statusPillVariants({ tone, className }))}
      />
    );
  },
);
StatusPill.displayName = "StatusPill";

export { StatusPill };
