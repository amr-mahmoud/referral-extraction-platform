"use client";

import * as React from "react";

import { useHoverMenu } from "@/hooks/use-hover-menu";
import { cn } from "@/lib/utils";
import { useLogout } from "@/server-hooks/auth/use-logout";
import { Avatar } from "@/shared/Avatar";
import { ChevronDownIcon, LogoutIcon } from "@/shared/Icon";

import {
  workbenchHeaderIdentityChevronVariants,
  workbenchHeaderIdentityClinicVariants,
  workbenchHeaderIdentityMenuItemVariants,
  workbenchHeaderIdentityPanelHeaderVariants,
  workbenchHeaderIdentityPanelHintVariants,
  workbenchHeaderIdentityPanelNameVariants,
  workbenchHeaderIdentityPanelVariants,
  workbenchHeaderIdentityPanelWrapVariants,
  workbenchHeaderIdentityTriggerVariants,
  workbenchHeaderIdentityVariants,
} from "./WorkbenchHeaderIdentity.styles";

export interface WorkbenchHeaderIdentityProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Clinic the signed-in session belongs to. */
  clinicName: string;
}

/**
 * The clinic name + avatar in the header, hover-expanding into a menu with
 * "Log out". Hover opens it (with a short close delay so the cursor can cross
 * into the panel); the trigger is still a real button so click and keyboard
 * work identically for touch and screen-reader users.
 */
const WorkbenchHeaderIdentity = React.forwardRef<
  HTMLDivElement,
  WorkbenchHeaderIdentityProps
>(({ className, clinicName, ...props }, ref) => {
  const menu = useHoverMenu<HTMLDivElement>();
  const logout = useLogout({ onError: menu.close });

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      menu.containerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [menu.containerRef, ref],
  );

  return (
    <div
      ref={setRefs}
      data-component="WorkbenchHeader-identity"
      data-state={menu.isOpen ? "open" : "closed"}
      {...menu.containerProps}
      {...props}
      className={cn(workbenchHeaderIdentityVariants({ className }))}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menu.isOpen}
        onClick={menu.toggle}
        className={cn(workbenchHeaderIdentityTriggerVariants({ open: menu.isOpen }))}
      >
        <span className={cn(workbenchHeaderIdentityClinicVariants())}>
          {clinicName}
        </span>
        <Avatar name={clinicName} />
        <ChevronDownIcon
          size="sm"
          className={cn(workbenchHeaderIdentityChevronVariants({ open: menu.isOpen }))}
        />
      </button>

      <div className={cn(workbenchHeaderIdentityPanelWrapVariants({ open: menu.isOpen }))}>
        <div
          role="menu"
          aria-label="Account menu"
          className={cn(workbenchHeaderIdentityPanelVariants())}
        >
     

          <button
            type="button"
            role="menuitem"
            disabled={logout.isLoading}
            onClick={() => logout.execute()}
            className={cn(workbenchHeaderIdentityMenuItemVariants())}
          >
            <LogoutIcon size="sm" />
            {logout.isLoading ? "Signing out…" : "Log out"}
          </button>
        </div>
      </div>
    </div>
  );
});
WorkbenchHeaderIdentity.displayName = "WorkbenchHeaderIdentity";

export { WorkbenchHeaderIdentity };
