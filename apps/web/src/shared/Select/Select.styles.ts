import { cva, type VariantProps } from "class-variance-authority";

export const selectVariants = cva("relative flex w-full items-center");

export const selectControlVariants = cva(
  [
    "h-[34px] w-full cursor-pointer appearance-none rounded-lg border border-hairline-strong",
    "bg-field pr-8 pl-[11px] text-[11.5px] text-ink outline-none transition-colors",
    "hover:border-control-border focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15",
    "disabled:cursor-not-allowed disabled:opacity-55",
  ],
  {
    variants: {
      size: {
        sm: "h-[34px] text-[11.5px]",
        md: "h-[42px] text-[13px]",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
);

export const selectIndicatorVariants = cva(
  "pointer-events-none absolute right-2.5 text-faint",
);

export type SelectVariantProps = VariantProps<typeof selectControlVariants>;
