"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { CloseIcon } from "@/shared/Icon";
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
}

/** One queued file — its size when accepted, why it was turned away when not. */
const UploadFileChip = React.forwardRef<HTMLDivElement, UploadFileChipProps>(
  ({ candidate, className, onRemove, ...props }, ref) => {
    const tone = candidate.status === "accepted" ? "accepted" : "rejected";
    const meta =
      candidate.status === "accepted" ? candidate.sizeLabel : candidate.reason;

    return (
      <div
        ref={ref}
        data-component="UploadFileChip"
        data-tone={tone}
        {...props}
        className={cn(uploadFileChipVariants({ tone, className }))}
      >
        <span className={cn(uploadFileChipNameVariants())}>{candidate.name}</span>
        <span className={cn(uploadFileChipMetaVariants({ tone }))}>{meta}</span>

        {onRemove ? (
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
