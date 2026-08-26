import { cva, type VariantProps } from "class-variance-authority";

export const brandLockupVariants = cva("flex shrink-0 items-center", {
  variants: {
    size: {
      sm: "h-6",
      md: "h-9",
      lg: "h-[30px]",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

/** The wordmark image already bakes in the mark and the company name at a fixed aspect ratio — height-only sizing keeps it crisp at any scale. */
export const brandLockupImageVariants = cva("h-full w-auto");

export type BrandLockupVariantProps = VariantProps<typeof brandLockupVariants>;
