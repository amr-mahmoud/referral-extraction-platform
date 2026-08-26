import { cva, type VariantProps } from "class-variance-authority";


export const referralGridVariants = cva([
  "grid items-center gap-3",
  "grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_28px]",
  "md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_28px]",
]);

export const referralRowVariants = cva(
  [
    "w-full rounded-[10px] border border-hairline bg-white px-3.5 py-3 text-left",
    "text-[12.5px] font-medium text-ink transition-colors outline-none",
  ],
  {
    variants: {
      failed: {
        true: "border-danger-border/70",
        false: "",
      },
      /**
       * Completed / failed rows open the review screen — they behave like a
       * link (pointer cursor, hover tint, focus ring). In-progress rows are
       * deliberately inert: no pointer, no hover, nothing to review yet.
       */
      interactive: {
        true: [
          "cursor-pointer hover:border-brand/40 hover:bg-brand/[0.03]",
          "focus-visible:ring-2 focus-visible:ring-brand/45",
        ],
        false: "cursor-default",
      },
    },
    defaultVariants: {
      failed: false,
      interactive: false,
    },
  },
);

export const referralPatientVariants = cva("truncate");

export const referralMetaVariants = cva("truncate text-muted");

/** The "# extractions" column — count when known, faint "N/A" otherwise. */
export const referralExtractionCountVariants = cva(
  "hidden truncate md:block",
);

export const referralExtractionCountValueVariants = cva("text-muted");

export const referralExtractionCountNaVariants = cva("text-faint");

/** Columns that fold away before the row starts truncating awkwardly. */
export const referralSecondaryCellVariants = cva("hidden truncate md:block");

export const referralChevronVariants = cva("justify-self-end text-[#c0bede]");

export type ReferralRowVariantProps = VariantProps<typeof referralRowVariants>;
