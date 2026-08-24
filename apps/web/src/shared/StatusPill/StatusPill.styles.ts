import { cva, type VariantProps } from "class-variance-authority";

export const statusPillVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1",
    "text-[10.5px] font-semibold tracking-[0.03em] uppercase",
  ],
  {
    variants: {
      tone: {
        success: "bg-success-tint text-success",
        brand: "bg-brand-tint text-brand-deep",
        neutral: "bg-shell text-muted",
        danger: "bg-danger-tint text-danger",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export type StatusPillVariantProps = VariantProps<typeof statusPillVariants>;
export type StatusPillTone = NonNullable<StatusPillVariantProps["tone"]>;
