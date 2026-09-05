import { cva, type VariantProps } from "class-variance-authority";

/**
 * Top-anchored rather than centred: the sign-up form is taller than sign-in,
 * and centring would shift the mode toggle every time the user switches. The
 * offset is viewport-relative so it stays put no matter which form is showing.
 */
export const authPanelVariants = cva(
  "flex flex-col justify-center px-8 py-16 sm:px-12 lg:px-[72px] lg:pt-[12vh] lg:pb-16 xl:pt-36  min-h-[300px]",
);

/** Keeps the form at the wireframe's column width on wide viewports. */
export const authPanelContentVariants = cva(
  "mx-auto flex w-full max-w-[536px] flex-col gap-[26px] h-[600px]",
);

export const authPanelHeadingVariants = cva(
  "text-[26px]/[1.2] font-bold tracking-[-0.01em] text-ink",
);

export type AuthPanelVariantProps = VariantProps<typeof authPanelVariants>;
