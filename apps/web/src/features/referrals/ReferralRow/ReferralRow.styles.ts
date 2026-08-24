import { cva, type VariantProps } from "class-variance-authority";

/**
 * The column template is declared once here and reused by the table's header
 * row, so headings and cells cannot drift apart.
 */
export const referralGridVariants = cva([
  "grid items-center gap-3",
  "grid-cols-[34px_minmax(0,1.2fr)_minmax(0,0.9fr)_28px]",
  "md:grid-cols-[34px_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_28px]",
]);

export const referralRowVariants = cva(
  [
    "w-full rounded-[10px] border border-hairline bg-white px-3.5 py-3 text-left",
    "text-[12.5px] font-medium text-ink transition-colors outline-none",
    "hover:border-brand/40 hover:bg-brand/[0.03]",
    "focus-visible:ring-2 focus-visible:ring-brand/45",
  ],
  {
    variants: {
      failed: {
        true: "border-danger-border/70",
        false: "",
      },
    },
    defaultVariants: {
      failed: false,
    },
  },
);

export const referralThumbVariants = cva([
  "flex h-[42px] w-[34px] items-center justify-center rounded-[5px]",
  "border border-hairline-strong bg-[#fafafd] text-faint",
]);

export const referralPatientVariants = cva("truncate");

export const referralMetaVariants = cva("truncate text-muted");

/** Columns that fold away before the row starts truncating awkwardly. */
export const referralSecondaryCellVariants = cva("hidden truncate md:block");

export const referralChevronVariants = cva("justify-self-end text-[#c0bede]");

export type ReferralRowVariantProps = VariantProps<typeof referralRowVariants>;
