import { cva, type VariantProps } from "class-variance-authority";

export const textFieldVariants = cva("flex flex-col gap-[7px]");

export const textFieldLabelVariants = cva(
  "text-xs font-semibold text-ink-soft",
);

export const textFieldControlVariants = cva(
  [
    "flex h-[46px] items-center gap-2 rounded-[10px] border bg-field px-3.5",
    "transition-colors focus-within:ring-2",
  ],
  {
    variants: {
      tone: {
        default:
          "border-field-border focus-within:border-brand focus-within:ring-brand/15",
        error:
          "border-danger/55 focus-within:border-danger focus-within:ring-danger/15",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

export const textFieldInputVariants = cva(
  "min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint",
);

export const textFieldMessageVariants = cva("text-[11.5px]", {
  variants: {
    tone: {
      default: "text-muted",
      error: "text-danger",
    },
  },
  defaultVariants: {
    tone: "default",
  },
});

export type TextFieldVariantProps = VariantProps<
  typeof textFieldControlVariants
>;
