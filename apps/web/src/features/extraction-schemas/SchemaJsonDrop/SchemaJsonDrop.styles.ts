import { cva, type VariantProps } from "class-variance-authority";

export const schemaJsonDropVariants = cva(
  [
    "flex h-[34px] w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed",
    "px-[11px] text-[11.5px] transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-brand/45",
    "disabled:cursor-not-allowed disabled:opacity-55",
  ],
  {
    variants: {
      filled: {
        true: "border-brand/60 bg-brand/5 text-ink",
        false: "border-[#c8c5ee] text-faint hover:border-brand/60",
      },
    },
    defaultVariants: {
      filled: false,
    },
  },
);

export const schemaJsonDropInputVariants = cva("sr-only");

export const schemaJsonDropNameVariants = cva("truncate");

export const schemaJsonDropWrapVariants = cva("flex flex-col gap-1.5");

export const schemaJsonDropMetaVariants = cva("text-[11px] text-muted");

export const schemaJsonDropErrorVariants = cva(
  "text-[11px] font-medium text-danger",
);

export type SchemaJsonDropVariantProps = VariantProps<
  typeof schemaJsonDropVariants
>;
