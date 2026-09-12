import * as React from "react";

import { cn } from "@/lib/utils";

import {
  authBrandPanelAccentVariants,
  authBrandPanelBlurbVariants,
  authBrandPanelCopyVariants,
  authBrandPanelHeadlineVariants,
  authBrandPanelVariants,
  type AuthBrandPanelVariantProps,
} from "./AuthBrandPanel.styles";

export interface AuthBrandPanelProps
  extends React.HTMLAttributes<HTMLDivElement>, AuthBrandPanelVariantProps {}

const AuthBrandPanel = React.forwardRef<HTMLDivElement, AuthBrandPanelProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-component="AuthBrandPanel"
        {...props}
        className={cn(authBrandPanelVariants({ className }))}
      >
        <div className={cn(authBrandPanelCopyVariants())}>
          <h1 className={cn(authBrandPanelHeadlineVariants())}>
            Referral
            <br />
            <span className={cn(authBrandPanelAccentVariants())}>
              Extraction Workbench
            </span>
          </h1>
          <p className={cn(authBrandPanelBlurbVariants())}>
            Upload referral PDFs, choose an extraction schema, review structured
            results — per clinic, in one place.
          </p>
        </div>
      </div>
    );
  },
);
AuthBrandPanel.displayName = "AuthBrandPanel";

export { AuthBrandPanel };
