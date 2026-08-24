import { cva, type VariantProps } from "class-variance-authority";

export const segmentedControlVariants = cva(
  "inline-flex w-fit gap-1 rounded-full bg-brand-mist p-1",
);

export const segmentedControlOptionVariants = cva(
  [
    "cursor-pointer rounded-full px-[22px] py-2 text-[13px] font-semibold",
    "transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  ],
  {
    variants: {
      active: {
        true: "bg-brand text-white",
        false: "text-muted hover:text-ink",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export type SegmentedControlOptionVariantProps = VariantProps<
  typeof segmentedControlOptionVariants
>;
