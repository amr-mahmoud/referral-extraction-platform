import { cva, type VariantProps } from "class-variance-authority";

export const formErrorVariants = cva([
  "rounded-lg border border-danger-border bg-danger-tint px-3 py-2.5",
  "text-xs font-medium text-danger",
]);

export type FormErrorVariantProps = VariantProps<typeof formErrorVariants>;
