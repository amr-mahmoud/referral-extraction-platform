import { cva, type VariantProps } from "class-variance-authority";

export const workbenchHeaderVariants = cva([
  "flex h-18 shrink-0 items-center justify-between gap-4 py-5",
  "border-b border-hairline bg-white px-5 sm:px-7",
]);

export const workbenchHeaderLeadVariants = cva(
  "flex min-w-0 items-center gap-4 sm:gap-7",
);

export const workbenchHeaderNavVariants = cva(
  "hidden items-center gap-1.5 sm:flex",
);

export const workbenchHeaderNavLinkVariants = cva(
  [
    "rounded-full px-3.5 py-[7px] text-[13px] font-semibold transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  ],
  {
    variants: {
      active: {
        true: "bg-brand-tint text-brand-deep",
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
