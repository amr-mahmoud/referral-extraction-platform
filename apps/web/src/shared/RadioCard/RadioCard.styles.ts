import { cva, type VariantProps } from "class-variance-authority";

export const radioCardVariants = cva(
  [
    "flex cursor-pointer items-start gap-2.5 rounded-[10px] p-3 transition-colors",
    "has-focus-visible:ring-2 has-focus-visible:ring-brand/45 has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-white",
  ],
  {
    variants: {
      checked: {
        true: "border-[1.5px] border-brand bg-brand/5",
        false: "border border-hairline-strong hover:border-control-border",
      },
    },
    defaultVariants: {
      checked: false,
    },
  },
);

export const radioCardInputVariants = cva("sr-only");

export const radioCardDotVariants = cva(
  "mt-0.5 size-[15px] shrink-0 rounded-full transition-[border-width,border-color]",
  {
    variants: {
      checked: {
        true: "border-4 border-brand",
        false: "border-[1.5px] border-control-border",
      },
    },
    defaultVariants: {
      checked: false,
    },
  },
);

export const radioCardBodyVariants = cva("flex min-w-0 flex-1 flex-col");

export const radioCardLabelVariants = cva(
  "text-[12.5px] font-semibold text-ink",
);

export const radioCardDescriptionVariants = cva("text-[11.5px] text-muted");

/** Slot below the label for a nested control (a select, a small dropzone). */
export const radioCardSlotVariants = cva("mt-[7px]");

export type RadioCardVariantProps = VariantProps<typeof radioCardVariants>;
