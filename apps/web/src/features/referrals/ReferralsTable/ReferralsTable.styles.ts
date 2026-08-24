import { cva, type VariantProps } from "class-variance-authority";

export const referralsTableVariants = cva("flex flex-col gap-3");

export const referralsTableHeadVariants = cva([
  "px-3.5 text-[10.5px] font-semibold tracking-[0.06em] text-faint uppercase",
]);

export const referralsTableHeadCellVariants = cva("truncate");

/** Columns the row hides below `md` — the heading must hide with them. */
export const referralsTableSecondaryHeadCellVariants = cva(
  "hidden truncate md:block",
);

export const referralsTableBodyVariants = cva("flex flex-col gap-2");

export const referralsTableEmptyVariants = cva([
  "flex flex-col items-center justify-center gap-1.5 rounded-[10px]",
  "border border-dashed border-hairline-strong bg-white px-6 py-12 text-center",
]);

export const referralsTableEmptyTitleVariants = cva(
  "text-[13px] font-semibold text-ink",
);

export const referralsTableEmptyHintVariants = cva("text-[12px] text-muted");

export type ReferralsTableVariantProps = VariantProps<
  typeof referralsTableVariants
>;
