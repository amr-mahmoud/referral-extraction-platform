import { cva, type VariantProps } from "class-variance-authority";

/**
 * Dropzone and schema panel sit side by side once there is room for the panel
 * at its natural 400px; below that they stack, dropzone first.
 */
export const uploadWorkspaceVariants = cva([
  "grid items-stretch gap-5",
  "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]",
]);

export type UploadWorkspaceVariantProps = VariantProps<
  typeof uploadWorkspaceVariants
>;
