import { cva, type VariantProps } from "class-variance-authority";

export const avatarVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center rounded-full",
    "bg-[#e4e2fd] font-bold text-brand-deep uppercase select-none",
  ],
  {
    variants: {
      size: {
        sm: "size-8 text-[11px]",
        md: "size-10 text-[13px]",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
);

export type AvatarVariantProps = VariantProps<typeof avatarVariants>;
