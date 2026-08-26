import { cva, type VariantProps } from "class-variance-authority";

export const pdfViewerVariants = cva(
  "flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto bg-canvas p-5",
);

export const pdfViewerToolbarVariants = cva(
  "flex shrink-0 items-center justify-between text-[11.5px] font-medium text-muted",
);

export const pdfViewerToolbarGroupVariants = cva("flex items-center gap-2");

export const pdfViewerZoomLabelVariants = cva(
  "min-w-[42px] text-center tabular-nums",
);

export const pdfViewerIconButtonVariants = cva([
  "inline-flex size-6 items-center justify-center rounded-[6px] border border-hairline-strong bg-white text-muted",
  "transition-colors outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/45",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted",
]);

export const pdfViewerStageVariants = cva(
  "flex w-full flex-1 flex-col items-center justify-start",
);

export const pdfViewerNoSourceVariants = cva(
  "mb-2 rounded-full border border-hairline-strong bg-white px-3 py-1 text-[11px] font-medium text-muted",
);

export const pdfViewerPageWrapVariants = cva(
  "relative inline-block rounded-[8px] bg-white shadow-[0_1px_3px_rgba(23,22,58,0.06)]",
);

export const pdfViewerHighlightVariants = cva([
  "pointer-events-none absolute rounded-[3px] ",
  "border-[2px] border-brand bg-brand/15",
]);

export const pdfViewerHighlightTagVariants = cva([
  "pointer-events-none absolute -top-[20px] right-0",
  "rounded-[4px] bg-brand px-1.5 py-0.5 text-[9.5px] font-semibold text-white",
  "whitespace-nowrap",
]);

export const pdfViewerPlaceholderVariants = cva([
  "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[10px] px-6 py-12 text-center",
  "border border-dashed border-hairline-strong bg-white",
]);

export const pdfViewerPlaceholderTitleVariants = cva(
  "text-[13px] font-semibold text-ink",
);

export const pdfViewerPlaceholderHintVariants = cva("text-[12px] text-muted");

export type PdfViewerVariantProps = VariantProps<typeof pdfViewerVariants>;
