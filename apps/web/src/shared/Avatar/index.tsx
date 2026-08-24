import * as React from "react";

import { cn } from "@/lib/utils";

import { avatarVariants, type AvatarVariantProps } from "./Avatar.styles";

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    AvatarVariantProps {
  /** Full name; reduced to at most two initials. */
  name: string;
}

function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, name, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        role="img"
        aria-label={name}
        data-component="Avatar"
        data-size={size ?? "sm"}
        {...props}
        className={cn(avatarVariants({ size, className }))}
      >
        {toInitials(name)}
      </span>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
