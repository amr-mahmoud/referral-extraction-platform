import * as React from "react";

import { cn } from "@/lib/utils";
import { LoaderIcon } from "@/shared/Icon";

import {
  statusPillVariants,
  type StatusPillVariantProps,
} from "./StatusPill.styles";

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    StatusPillVariantProps {
  /** Shows a small spinner (in the pill's tone color) next to the label, e.g. while processing. */
  loading?: boolean;
}

const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ className, children, loading, tone, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-component="StatusPill"
        data-tone={tone ?? "neutral"}
        data-loading={loading ?? false}
        {...props}
        className={cn(statusPillVariants({ tone, className }))}
      >
        {loading ? (
          <LoaderIcon
            size="sm"
            className="size-3 animate-spin"
            aria-hidden
          />
        ) : null}
        {children}
      </span>
    );
  },
);
StatusPill.displayName = "StatusPill";

export { StatusPill };
