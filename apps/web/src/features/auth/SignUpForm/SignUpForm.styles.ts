import { cva, type VariantProps } from "class-variance-authority";

export const signUpFormVariants = cva("flex flex-col gap-[26px]");

export const signUpFormFieldsVariants = cva("flex flex-col gap-[18px]");

export const signUpFormFootnoteVariants = cva("text-xs text-muted");

export type SignUpFormVariantProps = VariantProps<typeof signUpFormVariants>;
