import { cva, type VariantProps } from "class-variance-authority";

export const signInFormVariants = cva("flex flex-col gap-[26px]");

export const signInFormFieldsVariants = cva("flex flex-col gap-[18px]");

export const signInFormFootnoteVariants = cva("text-xs text-muted");

export type SignInFormVariantProps = VariantProps<typeof signInFormVariants>;
