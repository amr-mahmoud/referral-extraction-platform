import { cva, type VariantProps } from "class-variance-authority";

export const schemaSelectorVariants = cva([
  "flex flex-col gap-3.5 rounded-[14px] border border-hairline-strong",
  "bg-white p-5",
]);

export const schemaSelectorTitleVariants = cva("text-sm font-bold text-ink");

export const schemaSelectorOptionsVariants = cva("flex flex-col gap-2.5");

export const schemaSelectorFooterVariants = cva([
  "flex items-center justify-between gap-3",
  "border-t border-hairline pt-3.5",
]);

export const schemaSelectorHintVariants = cva("text-[11px] text-faint");

/** Pushes the submit button to the bottom when the panel is stretched. */
export const schemaSelectorActionsVariants = cva("mt-auto flex flex-col gap-2");

export const schemaSelectorErrorVariants = cva(
  "text-[11.5px] font-medium text-danger",
);

export type SchemaSelectorVariantProps = VariantProps<
  typeof schemaSelectorVariants
>;
