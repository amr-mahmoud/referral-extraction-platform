import { cva, type VariantProps } from "class-variance-authority";

export const editableExtractedFieldVariants = cva(
  [
    "group flex w-full flex-col gap-1.5 rounded-[9px] border px-3 py-2.5 text-left transition-colors",
    "focus-within:border-brand/40",
  ],
  {
    variants: {
      selected: {
        true: "border-brand bg-brand/[0.04]",
        false: "border-hairline hover:border-brand/40 hover:bg-brand/[0.03]",
      },
      state: {
        view: "",
        editing: "border-brand bg-white",
        saving: "opacity-80",
        error: "border-danger-border bg-danger-tint/30",
      },
    },
    defaultVariants: { selected: false, state: "view" },
  },
);

export const editableExtractedFieldMainRowVariants = cva(
  "flex w-full items-center gap-3",
);

export const editableExtractedFieldSelectButtonVariants = cva(
  "flex min-w-0 flex-1 items-center gap-3 rounded-[6px] text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/45",
);

export const editableExtractedFieldKeyVariants = cva(
  "w-[130px] shrink-0 truncate text-[11.5px] font-medium text-muted",
);

export const editableExtractedFieldValueVariants = cva(
  "min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink",
);

export const editableExtractedFieldPageBadgeVariants = cva(
  "shrink-0 rounded-[5px] px-1.5 py-0.5 text-[10px] font-semibold",
  {
    variants: {
      hasSource: {
        true: "bg-brand-tint text-brand-deep",
        false: "bg-shell text-faint",
      },
    },
    defaultVariants: { hasSource: false },
  },
);

export const editableExtractedFieldEditedBadgeVariants = cva(
  "shrink-0 rounded-[5px] bg-shell px-1.5 py-0.5 text-[10px] font-medium text-muted",
);

export const editableExtractedFieldEditButtonVariants = cva(
  [
    "shrink-0 rounded-[6px] p-1 text-muted outline-none transition-opacity hover:text-brand",
    "opacity-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand/45",
    "group-hover:opacity-100 group-focus-within:opacity-100",
  ],
);

export const editableExtractedFieldSecondaryLineVariants = cva(
  "flex items-center gap-2 text-[11px] text-muted",
);

export const editableExtractedFieldAiOriginalVariants = cva("min-w-0 truncate");

export const editableExtractedFieldTextButtonVariants = cva(
  "shrink-0 rounded-[4px] text-[11px] font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/45 disabled:opacity-55",
);

export const editableExtractedFieldFormVariants = cva("flex flex-col gap-2");

export const editableExtractedFieldInputsVariants = cva("flex flex-wrap gap-2");

export const editableExtractedFieldInputVariants = cva(
  [
    "h-8 min-w-0 rounded-[7px] border border-field-border bg-field px-2.5 text-[12.5px] text-ink outline-none",
    "placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/15",
  ],
  {
    variants: {
      width: {
        key: "w-[130px] shrink-0",
        label: "w-[130px] shrink-0",
        value: "min-w-[140px] flex-1",
      },
    },
  },
);

export const editableExtractedFieldActionsVariants = cva(
  "flex items-center gap-3 text-[11px] text-faint",
);

export const editableExtractedFieldErrorVariants = cva(
  "text-[11.5px] leading-snug text-danger",
);

export type EditableExtractedFieldVariantProps = VariantProps<
  typeof editableExtractedFieldVariants
>;
