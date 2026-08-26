import { cva, type VariantProps } from "class-variance-authority";

/**
 * Fills the viewport when content is short and grows past it when it isn't.
 * The review screen owns its remaining height below the breadcrumb header — the
 * PDF and field panels scroll independently, so the shell never scrolls itself.
 */
export const referralDetailLayoutVariants = cva(
  "flex min-h-dvh w-full flex-1 flex-col bg-white",
);

export const referralDetailLayoutMainVariants = cva(
  "flex w-full flex-1 flex-col bg-canvas",
);

export type ReferralDetailLayoutVariantProps = VariantProps<
  typeof referralDetailLayoutVariants
>;
