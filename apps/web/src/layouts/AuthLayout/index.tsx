import * as React from "react";

import { cn } from "@/lib/utils";

import {
  authLayoutCardVariants,
  authLayoutVariants,
  type AuthLayoutVariantProps,
} from "./AuthLayout.styles";

export interface AuthLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    AuthLayoutVariantProps {
  /** The branded left-hand column. */
  brand: React.ReactNode;
}

/**
 * Split shell shared by every unauthenticated screen: brand on the left,
 * the interactive panel on the right. Collapses to a single column below `lg`.
 */
const AuthLayout = React.forwardRef<HTMLDivElement, AuthLayoutProps>(
  ({ brand, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-component="AuthLayout"
        {...props}
        className={cn(authLayoutVariants({ className }))}
      >
        <div className={cn(authLayoutCardVariants())}>
          {brand}
          {children}
        </div>
      </div>
    );
  },
);
AuthLayout.displayName = "AuthLayout";

export { AuthLayout };
