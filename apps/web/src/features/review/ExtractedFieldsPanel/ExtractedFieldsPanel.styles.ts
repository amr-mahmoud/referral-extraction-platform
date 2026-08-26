import { cva, type VariantProps } from "class-variance-authority";

export const extractedFieldsPanelVariants = cva(
  "flex min-w-0 flex-col border-l border-hairline bg-white",
);

export const extractedFieldsPanelTabVariants = cva(
  "border-b border-hairline px-5 pt-0",
);

export const extractedFieldsPanelTabActiveVariants = cva(
  "inline-block border-b-2 border-brand pb-3.5 pt-4 text-[12.5px] font-semibold text-ink",
);

export const extractedFieldsPanelBodyVariants = cva(
  "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5",
);

export const extractedFieldsPanelHintVariants = cva(
  "text-[11.5px] leading-snug text-muted",
);

export const extractedFieldsPanelListVariants = cva(
  "flex flex-col gap-2",
);

export const extractedFieldsPanelColumnHeaderVariants = cva(
  "flex w-full items-center gap-3 px-3 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint",
);

export const extractedFieldsPanelColumnHeaderKeyVariants = cva(
  "w-[130px] shrink-0",
);

export const extractedFieldsPanelColumnHeaderValueVariants = cva(
  "min-w-0 flex-1",
);

export const extractedFieldsPanelColumnHeaderPageVariants = cva(
  "shrink-0",
);

export const extractedFieldsPanelRowVariants = cva(
  [
    "flex w-full items-center gap-3 rounded-[9px] border border-hairline px-3 py-2.5 text-left",
    "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/45",
  ],
  {
    variants: {
      selected: {
        true: "border-brand bg-brand/[0.04]",
        false: "hover:border-brand/40 hover:bg-brand/[0.03]",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export const extractedFieldsPanelRowKeyVariants = cva(
  "w-[130px] shrink-0 truncate text-[11.5px] font-medium text-muted",
);

export const extractedFieldsPanelRowValueVariants = cva(
  "min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink",
);

export const extractedFieldsPanelPageBadgeVariants = cva(
  "shrink-0 rounded-[5px] bg-brand-tint px-1.5 py-0.5 text-[10px] font-semibold text-brand-deep",
);

export const extractedFieldsPanelPageBadgeMutedVariants = cva(
  "shrink-0 rounded-[5px] bg-shell px-1.5 py-0.5 text-[10px] font-semibold text-faint",
);

export const extractedFieldsPanelEmptyVariants = cva([
  "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[10px] px-6 py-10 text-center",
  "border border-dashed border-hairline-strong bg-canvas",
]);

export const extractedFieldsPanelEmptyTitleVariants = cva(
  "text-[13px] font-semibold text-ink",
);

export const extractedFieldsPanelEmptyHintVariants = cva(
  "text-[12px] leading-snug text-muted",
);

export const extractedFieldsPanelErrorVariants = cva(
  "rounded-[9px] border border-danger-border bg-danger-tint/50 px-3 py-2.5 text-[12px] leading-relaxed text-danger",
);

export type ExtractedFieldsPanelVariantProps = VariantProps<
  typeof extractedFieldsPanelVariants
>;
