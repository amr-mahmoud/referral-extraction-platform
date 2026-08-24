import { cva, type VariantProps } from "class-variance-authority";

export const brandLockupVariants = cva(
  "flex shrink-0 items-center font-bold text-ink",
  {
    variants: {
      size: {
        sm: "gap-2.5 text-[15px]",
        lg: "gap-2.5 text-[17px]/none",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
);

export const brandLockupMarkVariants = cva(
  "shrink-0 rounded-full border-2 border-brand",
  {
    variants: {
      size: {
        sm: "size-6",
        lg: "size-[30px]",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
);

export type BrandLockupVariantProps = VariantProps<typeof brandLockupVariants>;
