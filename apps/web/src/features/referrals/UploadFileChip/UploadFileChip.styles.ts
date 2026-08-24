import { cva, type VariantProps } from "class-variance-authority";

export const uploadFileChipVariants = cva(
  [
    "flex max-w-full items-center gap-2 rounded-lg border px-2.5 py-[7px]",
    "text-[11.5px] font-medium",
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

export const uploadFileChipMetaVariants = cva("shrink-0", {
  variants: {
    tone: {
      accepted: "text-muted",
      rejected: "text-danger/85",
    },
  },
  defaultVariants: {
    tone: "accepted",
  },
});

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
