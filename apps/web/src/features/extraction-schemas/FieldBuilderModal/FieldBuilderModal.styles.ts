import { cva, type VariantProps } from "class-variance-authority";

export const fieldBuilderModalVariants = cva("max-w-[520px]");

export const fieldBuilderHeaderVariants = cva(
  "flex items-center justify-between gap-4 px-[26px] pt-[22px] pb-3.5",
);

export const fieldBuilderTitleVariants = cva("text-xl text-ink");

export const fieldBuilderCloseVariants = cva([
  "flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-lg",
  "bg-shell text-muted transition-colors hover:bg-hairline-strong",
]);

export const fieldBuilderBodyVariants = cva(
  "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-[26px] pb-4",
);

export const fieldBuilderRowVariants = cva(
  "flex flex-col gap-2 rounded-xl border border-hairline p-3.5",
);

export const fieldBuilderRowHeadVariants = cva(
  "flex items-center justify-between",
);

export const fieldBuilderRowLabelVariants = cva(
  "text-[13px] font-semibold text-ink",
);

export const fieldBuilderRowRemoveVariants = cva([
  "cursor-pointer rounded p-0.5 text-faint transition-colors outline-none",
  "hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/45",
]);

export const fieldBuilderNameInputVariants = cva([
  "h-[38px] w-full rounded-lg border border-field-border bg-field px-[11px]",
  "text-xs font-medium text-ink outline-none placeholder:font-normal placeholder:text-faint",
  "transition-colors focus:border-brand",
]);

export const fieldBuilderTitleInputVariants = cva([
  "h-[42px] w-full rounded-lg border border-field-border bg-field px-[13px]",
  "text-sm font-semibold text-ink outline-none placeholder:font-normal placeholder:text-faint",
  "transition-colors focus:border-brand",
]);

export const fieldBuilderDescriptionInputVariants = cva([
  "min-h-[56px] w-full resize-none rounded-lg border border-field-border bg-field px-[11px] py-[9px]",
  "text-xs text-muted outline-none placeholder:text-faint",
  "transition-colors focus:border-brand",
]);

export const fieldBuilderAddRowVariants = cva([
  "flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-dashed border-[#c8c5ee]",
  "text-[12.5px] font-semibold text-brand-deep transition-colors hover:bg-brand-tint",
]);

/** One method of getting to a schema — the field rows, or the JSON upload. */
export const fieldBuilderSectionVariants = cva("flex flex-col gap-3");

export const fieldBuilderSectionLabelVariants = cva(
  "text-[13px] font-semibold text-ink",
);

export const fieldBuilderDividerVariants = cva(
  "flex shrink-0 items-center gap-3 py-0.5",
);

export const fieldBuilderDividerRuleVariants = cva(
  "h-px flex-1 bg-hairline-strong",
);

export const fieldBuilderDividerLabelVariants = cva(
  "text-[10.5px] font-semibold tracking-[0.04em] text-faint uppercase",
);

export const fieldBuilderUploadHintVariants = cva(
  "text-[11px]/[1.5] text-faint",
);

export const fieldBuilderFooterVariants = cva(
  "flex flex-col gap-3 border-t border-hairline px-[26px] pt-3.5 pb-4",
);

export const fieldBuilderErrorVariants = cva(
  "text-[11.5px] font-medium text-danger",
);

export const fieldBuilderActionsVariants = cva("flex justify-end gap-2.5");

export type FieldBuilderModalVariantProps = VariantProps<
  typeof fieldBuilderModalVariants
>;
