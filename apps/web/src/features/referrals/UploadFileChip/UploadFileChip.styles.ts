import { cva, type VariantProps } from "class-variance-authority";

export const uploadFileChipVariants = cva(
  [
    "flex max-w-full items-center gap-2 rounded-lg border px-4 py-2.5",
    "text-[13.5px] font-medium",
  ],
  {
    variants: {
      tone: {
        accepted: "border-hairline-strong bg-white text-ink",
        rejected: "border-danger-border bg-white text-danger",
      },
    },
    defaultVariants: {
      tone: "accepted",
    },
  },
);

export const uploadFileChipNameVariants = cva("truncate");

/**
 * The status label — file size, rejection reason, or (once a batch is
 * submitted) live upload progress. Sized up from the chip's base text and
 * bolded so it reads as the primary signal in the chip, not a caption.
 */
export const uploadFileChipMetaVariants = cva(
  "shrink-0 text-[13.5px] font-semibold",
  {
    variants: {
      tone: {
        accepted: "text-muted",
        rejected: "text-danger/85",
      },
    },
    defaultVariants: {
      tone: "accepted",
    },
  },
);

export const uploadFileChipRemoveVariants = cva([
  "-mr-0.5 shrink-0 cursor-pointer rounded p-0.5 text-faint transition-colors",
  "hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/45 outline-none",
]);

export type UploadFileChipVariantProps = VariantProps<
  typeof uploadFileChipVariants
>;
export type UploadFileChipTone = NonNullable<
  UploadFileChipVariantProps["tone"]
>;
