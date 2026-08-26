import { cva, type VariantProps } from "class-variance-authority";

export const tabsVariants = cva(
  "flex items-center gap-5 overflow-x-auto border-b border-hairline ",
);

export const tabsTriggerVariants = cva(
  [
    "-mb-px flex shrink-0 cursor-pointer items-center border-b-2 py-2.5 px-1",
    "text-[13px] font-semibold whitespace-nowrap transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:rounded-t-sm",
  ],
  {
    variants: {
      active: {
        true: "border-brand text-ink",
        false: "border-transparent text-muted hover:text-ink",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export const tabsCountVariants = cva(
  "rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums",
  {
    variants: {
      active: {
        true: "bg-brand-tint text-brand-deep",
        false: "bg-shell text-muted",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export type TabsTriggerVariantProps = VariantProps<typeof tabsTriggerVariants>;
