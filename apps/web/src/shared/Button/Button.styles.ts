import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "cursor-pointer transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    "disabled:pointer-events-none disabled:opacity-55",
  ],
  {
    variants: {
      variant: {
        primary: "rounded-full bg-brand text-white hover:bg-brand-deep",
        dark: "rounded-full bg-ink text-white hover:bg-ink/90",
        outline:
          "rounded-full border border-hairline-strong bg-white text-ink hover:bg-brand-mist",
        link: "text-brand underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-offset-1",
      },
      size: {
        sm: "h-10 px-4 text-[12.5px]",
        md: "h-12 px-6 text-sm",
        inline: "h-auto p-0 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
