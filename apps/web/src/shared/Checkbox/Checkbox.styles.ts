import { cva, type VariantProps } from "class-variance-authority";

export const checkboxVariants = cva(
  "group inline-flex cursor-pointer items-center gap-[9px] text-xs text-muted select-none",
);

export const checkboxInputVariants = cva("peer sr-only");

export const checkboxBoxVariants = cva(
  [
    "grid size-4 shrink-0 place-items-center rounded-[4px] border border-control-border bg-white",
    "transition-colors group-hover:border-brand",
    "peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white",
    "peer-checked:[&>svg]:opacity-100",
    "peer-focus-visible:ring-2 peer-focus-visible:ring-brand/45 peer-focus-visible:ring-offset-2",
  ],
);

export const checkboxIconVariants = cva(
  "size-2.5 opacity-0 transition-opacity",
);

export type CheckboxVariantProps = VariantProps<typeof checkboxVariants>;
