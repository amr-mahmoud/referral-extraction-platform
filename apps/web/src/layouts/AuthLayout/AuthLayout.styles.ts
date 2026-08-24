import { cva, type VariantProps } from "class-variance-authority";

export const authLayoutVariants = cva("flex min-h-dvh w-full flex-1 bg-canvas");

export const authLayoutCardVariants = cva([
  "grid w-full flex-1 overflow-hidden bg-white",
  "grid-cols-1 lg:grid-cols-[440px_1fr]",
]);

export type AuthLayoutVariantProps = VariantProps<typeof authLayoutVariants>;
