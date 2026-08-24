import { cva, type VariantProps } from "class-variance-authority";

export const passwordFieldToggleVariants = cva(
  [
    "shrink-0 cursor-pointer text-[11px] font-semibold text-brand",
    "transition-colors hover:text-brand-deep",
    "outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-brand/45",
  ],
);

export type PasswordFieldToggleVariantProps = VariantProps<
  typeof passwordFieldToggleVariants
>;
