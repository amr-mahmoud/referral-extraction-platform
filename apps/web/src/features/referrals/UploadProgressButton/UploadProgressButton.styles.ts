import { cva, type VariantProps } from "class-variance-authority";

/**
 * The button shell — identical footprint to `Button variant="dark" size="md"`
 * (rounded-full, h-11, white text) but `relative overflow-hidden` so the
 * fill bar beneath the label can be clipped to its rounded corners.
 */
export const uploadProgressButtonVariants = cva([
  "relative isolate h-11 w-full overflow-hidden rounded-full",
  "inline-flex items-center justify-center",
  "bg-ink font-semibold text-white",
  "disabled:pointer-events-none",
]);

/**
 * The fill layer. Width is set inline (a dynamic percentage, not a fixed
 * Tailwind class); the tone drives its color, and both width and color
 * transition smoothly so the bar visibly grows and shifts to green on
 * completion rather than snapping.
 */
export const uploadProgressButtonFillVariants = cva(
  "absolute inset-y-0 left-0 -z-10 transition-[width,background-color] duration-300 ease-out",
  {
    variants: {
      tone: {
        progress: "bg-brand",
        success: "bg-success",
        danger: "bg-danger",
      },
    },
    defaultVariants: {
      tone: "progress",
    },
  },
);

export const uploadProgressButtonLabelVariants = cva(
  "relative flex items-center gap-1.5 px-6 text-sm",
);

export type UploadProgressButtonFillVariantProps = VariantProps<
  typeof uploadProgressButtonFillVariants
>;
