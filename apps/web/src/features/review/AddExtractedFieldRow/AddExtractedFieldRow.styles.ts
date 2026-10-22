import { cva, type VariantProps } from "class-variance-authority";

export const addExtractedFieldRowVariants = cva(
  "flex w-full flex-col gap-2 rounded-[9px] border border-dashed border-hairline-strong px-3 py-2.5",
  {
    variants: {
      state: {
        view: "",
        editing: "border-solid border-brand bg-white",
        saving: "opacity-80",
        error: "border-danger-border",
      },
    },
    defaultVariants: { state: "view" },
  },
);

export const addExtractedFieldRowTriggerVariants = cva(
  "flex items-center gap-1.5 rounded-[6px] text-[12px] font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/45",
);

export const addExtractedFieldRowFormVariants = cva("flex flex-col gap-2");

export const addExtractedFieldRowInputsVariants = cva("flex flex-wrap gap-2");

export const addExtractedFieldRowInputVariants = cva(
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

export const addExtractedFieldRowActionsVariants = cva(
  "flex items-center gap-3 text-[11px] text-faint",
);

export const addExtractedFieldRowTextButtonVariants = cva(
  "shrink-0 rounded-[4px] text-[11px] font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/45 disabled:opacity-55",
);

export const addExtractedFieldRowErrorVariants = cva(
  "text-[11.5px] leading-snug text-danger",
);

export type AddExtractedFieldRowVariantProps = VariantProps<
  typeof addExtractedFieldRowVariants
>;
