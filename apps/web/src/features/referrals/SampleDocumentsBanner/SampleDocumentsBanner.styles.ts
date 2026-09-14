import { cva, type VariantProps } from "class-variance-authority";

export const sampleDocumentsBannerVariants = cva([
  "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-hairline-strong",
  "bg-gradient-to-r from-brand-mist via-white to-brand-tint/35 p-4 sm:px-5 sm:py-3.5",
  "shadow-[0_2px_8px_rgba(23,22,58,0.03)] transition-all",
]);

export const sampleDocumentsBannerLeftVariants = cva(
  "flex items-start sm:items-center gap-3.5",
);

export const sampleDocumentsBannerIconBoxVariants = cva([
  "flex size-10 shrink-0 items-center justify-center rounded-xl",
  "border border-brand/20 bg-brand-tint text-brand shadow-xs",
]);

export const sampleDocumentsBannerContentVariants = cva(
  "flex flex-col gap-0.5",
);

export const sampleDocumentsBannerTitleRowVariants = cva(
  "flex flex-wrap items-center gap-2",
);

export const sampleDocumentsBannerTitleVariants = cva(
  "text-[14px] sm:text-[14.5px] font-bold tracking-tight text-ink",
);

export const sampleDocumentsBannerBadgeVariants = cva(
  "rounded-full bg-brand-tint px-2 py-0.5 text-[10.5px] font-bold text-brand-deep tracking-wide uppercase",
);

export const sampleDocumentsBannerDescriptionVariants = cva(
  "text-[12.5px] leading-relaxed text-ink-soft",
);

export const sampleDocumentsBannerButtonVariants = cva(
  "shrink-0 gap-2 font-semibold text-[13px] h-10 px-4.5 shadow-xs transition-transform active:scale-[0.98]",
);

export type SampleDocumentsBannerVariantProps = VariantProps<
  typeof sampleDocumentsBannerVariants
>;
