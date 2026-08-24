import { cva, type VariantProps } from "class-variance-authority";

export const iconVariants = cva("shrink-0", {
  variants: {
    size: {
      sm: "size-3.5",
      md: "size-4",
      lg: "size-5",
      xl: "size-6",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type IconVariantProps = VariantProps<typeof iconVariants>;
