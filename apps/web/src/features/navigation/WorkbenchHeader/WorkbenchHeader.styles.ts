import { cva, type VariantProps } from "class-variance-authority";

export const workbenchHeaderVariants = cva([
  "sticky top-0 z-40 flex w-full flex-col shrink-0 border-b border-hairline bg-white/95 backdrop-blur-md",
  "sm:min-h-18 sm:justify-center sm:px-7",
]);

export const workbenchHeaderBarVariants = cva([
  "flex w-full items-center justify-between gap-3 px-4 py-2.5 sm:px-0 sm:py-3.5",
]);

export const workbenchHeaderNavVariants = cva(
  "hidden sm:flex items-center gap-1 sm:gap-1.5 ml-4 sm:ml-7 mr-auto",
);

export const workbenchHeaderMobileNavWrapVariants = cva(
  "flex sm:hidden w-full items-center justify-center border-t border-hairline/60 bg-brand-mist/35 px-3 py-1.5",
);

export const workbenchHeaderMobileNavVariants = cva(
  "flex w-full max-w-xs items-center justify-center gap-1.5",
);

export const workbenchHeaderActionsVariants = cva(
  "flex shrink-0 items-center ml-auto",
);

export const workbenchHeaderNavLinkVariants = cva(
  [
    "flex flex-1 sm:flex-initial items-center justify-center rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors outline-none whitespace-nowrap",
    "sm:px-3.5 sm:py-[7px] sm:text-[13px]",
    "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  ],
  {
    variants: {
      active: {
        true: "bg-brand-tint text-brand-deep font-bold",
        false: "text-muted hover:bg-shell hover:text-ink",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export type WorkbenchHeaderNavLinkVariantProps = VariantProps<
  typeof workbenchHeaderNavLinkVariants
>;

/** Guest-only header actions (Register / Sign in) shown when no clinic session exists. */
export const workbenchHeaderGuestActionsVariants = cva(
  "ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2",
);

const workbenchHeaderGuestLinkBase =
  "inline-flex h-8 sm:h-9 items-center justify-center rounded-full px-2.5 sm:px-3.5 text-[12px] sm:text-[12.5px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const workbenchHeaderGuestSignInLinkVariants = cva([
  workbenchHeaderGuestLinkBase,
  "text-ink hover:bg-shell",
]);

export const workbenchHeaderGuestRegisterLinkVariants = cva([
  workbenchHeaderGuestLinkBase,
  "bg-brand text-white hover:bg-brand-deep",
]);
