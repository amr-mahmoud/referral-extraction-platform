import { cva, type VariantProps } from "class-variance-authority";

export const workbenchHeaderIdentityVariants = cva("relative shrink-0");

export const workbenchHeaderIdentityTriggerVariants = cva(
  [
    "flex cursor-pointer items-center gap-3 rounded-full py-1 pr-1 pl-3 outline-none  px-2",
    "transition-colors hover:bg-shell",
    "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  ],
  {
    variants: {
      open: {
        true: "bg-shell rounded-[14px]",
        false: "",
      },
    },
    defaultVariants: {
      open: false,
    },
  },
);

export const workbenchHeaderIdentityClinicVariants = cva(
  "hidden text-xs font-medium text-muted md:block",
);

export const workbenchHeaderIdentityChevronVariants = cva(
  "hidden shrink-0 text-faint transition-transform duration-150 sm:block",
  {
    variants: {
      open: {
        true: "rotate-180",
        false: "",
      },
    },
    defaultVariants: {
      open: false,
    },
  },
);

/**
 * Bridges the visual gap between the trigger and the panel with padding
 * (not margin) so the pointer never leaves a hoverable element while moving
 * from one to the other.
 */
export const workbenchHeaderIdentityPanelWrapVariants = cva(
  "absolute right-0 top-full z-20 pt-1 transition-[opacity,visibility] duration-150",
  {
    variants: {
      open: {
        true: "visible opacity-100",
        false: "invisible opacity-0",
      },
    },
    defaultVariants: {
      open: false,
    },
  },
);

export const workbenchHeaderIdentityPanelVariants = cva([
  "w-56 overflow-hidden rounded-[14px] border border-hairline-strong bg-white",
  "shadow-lg",
]);

export const workbenchHeaderIdentityPanelHeaderVariants = cva(
  "flex flex-col gap-0.5 px-4 py-3",
);

export const workbenchHeaderIdentityPanelNameVariants = cva(
  "truncate text-[13px] font-semibold text-ink",
);

export const workbenchHeaderIdentityPanelHintVariants = cva(
  "text-[11px] text-muted",
);

export const workbenchHeaderIdentityMenuItemVariants = cva([
  "flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left",
  "text-[13px] font-semibold text-ink transition-colors outline-none",
  "hover:bg-shell focus-visible:bg-shell",
  "disabled:cursor-not-allowed disabled:opacity-55",
]);

export type WorkbenchHeaderIdentityVariantProps = VariantProps<
  typeof workbenchHeaderIdentityVariants
>;
