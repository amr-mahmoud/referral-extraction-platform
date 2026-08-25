"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { CloseIcon } from "@/shared/Icon";
import type { FileUploadProgress } from "@/hooks/use-custom-upload-files-to-presigned-urls-with-progress";
import type { UploadCandidate } from "@/managers/upload-candidate.manager";

import {
  uploadFileChipMetaVariants,
  uploadFileChipNameVariants,
  uploadFileChipRemoveVariants,
  uploadFileChipVariants,
} from "./UploadFileChip.styles";

export interface UploadFileChipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  candidate: UploadCandidate;
  onRemove?: (id: string) => void;
  /** Live upload progress once the batch has been submitted — overrides the size/rejection meta while present. */
  uploadStatus?: FileUploadProgress;
}

/** One queued file — its size when accepted, why it was turned away when not. */
const UploadFileChip = React.forwardRef<HTMLDivElement, UploadFileChipProps>(
  ({ candidate, className, onRemove, uploadStatus, ...props }, ref) => {
    const baseTone = candidate.status === "accepted" ? "accepted" : "rejected";
    const baseMeta =
      candidate.status === "accepted" ? candidate.sizeLabel : candidate.reason;

    // Live upload progress overrides the base accepted/rejected presentation
    // once the batch has been submitted — reuses the existing tones (no new
    // CVA variant needed: "error" maps onto "rejected").
    const tone =
      uploadStatus?.status === "error" ? "rejected" : baseTone;
    // Real bytes-sent percentage, not just a static "Uploading…" label.
    const meta =
      uploadStatus?.status === "uploading"
        ? `Uploading… ${uploadStatus.percent}%`
        : uploadStatus?.status === "done"
          ? "Uploaded"
          : uploadStatus?.status === "error"
            ? (uploadStatus.error ?? "Upload failed")
            : baseMeta;

    // Ties each chip's label color to the same progress signal as the
    // submit button (brand while in flight, success once done) — the CVA
    // tone alone only distinguishes accepted/rejected, so these layer on
    // top of it rather than becoming two more tone variants.
    const metaColorClassName =
      uploadStatus?.status === "uploading"
        ? "text-brand"
        : uploadStatus?.status === "done"
          ? "text-success"
          : undefined;

    const removeDisabled = uploadStatus?.status === "uploading";

    return (
      <div
        ref={ref}
        data-component="UploadFileChip"
        data-tone={tone}
        {...props}
        className={cn(uploadFileChipVariants({ tone, className }))}
      >
        <span className={cn(uploadFileChipNameVariants())}>{candidate.name}</span>
        <span
          className={cn(
            uploadFileChipMetaVariants({ tone }),
            metaColorClassName,
          )}
        >
          {meta}
        </span>

        {onRemove && !removeDisabled ? (
          <button
            type="button"
            aria-label={`Remove ${candidate.name}`}
            onClick={(event) => {
              // The chip sits inside the click-to-browse dropzone — without this
              // the remove click would bubble up and reopen the file picker.
              event.stopPropagation();
              onRemove(candidate.id);
            }}
            className={cn(uploadFileChipRemoveVariants())}
          >
            <CloseIcon size="sm" />
          </button>
        ) : null}
      </div>
    );
  },
);
UploadFileChip.displayName = "UploadFileChip";

export { UploadFileChip };
