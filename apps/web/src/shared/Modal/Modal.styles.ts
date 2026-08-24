import { cva, type VariantProps } from "class-variance-authority";

export const modalBackdropVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4",
);

export const modalPanelVariants = cva([
  "flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl bg-white outline-none",
  "shadow-[0_24px_60px_rgba(23,22,58,0.25)]",
]);

export type ModalPanelVariantProps = VariantProps<typeof modalPanelVariants>;
