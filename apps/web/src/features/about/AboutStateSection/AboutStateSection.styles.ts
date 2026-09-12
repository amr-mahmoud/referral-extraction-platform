import { cva, type VariantProps } from "class-variance-authority";

export const aboutStateSectionStripVariants = cva(
  "grid grid-cols-2 border-y border-hairline sm:grid-cols-3 lg:grid-cols-6",
);

export const aboutStateSectionCellVariants = cva(
  "flex flex-col gap-1 border-r border-b border-hairline px-5 py-5 [&:nth-child(2n)]:border-r-0 sm:[&:nth-child(2n)]:border-r sm:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(3n)]:border-r lg:last:border-r-0 [&:nth-child(n+5)]:border-b-0 sm:[&:nth-child(n+4)]:border-b-0 lg:border-b-0",
);

export const aboutStateSectionValueVariants = cva(
  "text-2xl font-extrabold tracking-tight text-ink",
);

export const aboutStateSectionLabelVariants = cva(
  "text-[11px] font-semibold tracking-[0.04em] text-brand-deep uppercase",
);

export const aboutStateSectionNoteVariants = cva(
  "text-[11.5px] leading-snug text-muted",
);

export type AboutStateSectionStripVariantProps = VariantProps<
  typeof aboutStateSectionStripVariants
>;
