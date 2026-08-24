import { cva, type VariantProps } from "class-variance-authority";

export const referralDropzoneVariants = cva(
  [
    "flex min-h-[260px] flex-1 flex-col items-center justify-center gap-3",
    "rounded-[14px] border-2 border-dashed p-6 text-center transition-colors",
  ],
  {
    variants: {
      dragging: {
        true: "border-brand bg-brand/5",
        false: "border-[#c8c5ee] bg-field hover:border-brand/60",
      },
      disabled: {
        true: "cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      dragging: false,
      disabled: false,
    },
  },
);

export const referralDropzoneIconVariants = cva([
  "flex size-11 items-center justify-center rounded-xl",
  "bg-brand-tint text-brand",
]);

export const referralDropzoneTitleVariants = cva(
  "text-[17px] font-bold text-ink",
);

export const referralDropzoneHintVariants = cva("text-[12.5px] text-muted");

export const referralDropzoneInputVariants = cva("sr-only");

export const referralDropzoneQueueVariants = cva(
  "mt-1.5 flex max-w-full flex-wrap justify-center gap-2",
);

export type ReferralDropzoneVariantProps = VariantProps<
  typeof referralDropzoneVariants
>;
