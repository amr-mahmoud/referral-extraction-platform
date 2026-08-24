"use client";

import * as React from "react";

import {
  REFERRAL_ACCEPTED_EXTENSION,
  REFERRAL_ACCEPTED_MIME_TYPE,
} from "@/constants/referrals";
import type {
  DropzoneHandlers,
  DropzoneInputProps,
} from "@/hooks/use-file-dropzone";
import { cn } from "@/lib/utils";
import type { UploadCandidate } from "@/managers/upload-candidate.manager";
import { Button } from "@/shared/Button";
import { UploadIcon } from "@/shared/Icon";

import { UploadFileChip } from "../UploadFileChip";
import {
  referralDropzoneHintVariants,
  referralDropzoneIconVariants,
  referralDropzoneInputVariants,
  referralDropzoneQueueVariants,
  referralDropzoneTitleVariants,
  referralDropzoneVariants,
} from "./ReferralDropzone.styles";

export interface ReferralDropzoneProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrop"> {
  isDragging: boolean;
  candidates: readonly UploadCandidate[];
  dropzoneProps: DropzoneHandlers;
  inputProps: DropzoneInputProps;
  onBrowse: () => void;
  onRemoveCandidate: (id: string) => void;
  /** Locks the zone while a batch is in flight. */
  disabled?: boolean;
}

/**
 * The drop target. Presentation only — drag state and the candidate list are
 * owned by `useFileDropzone` so this stays a pure view of them.
 */
const ReferralDropzone = React.forwardRef<HTMLDivElement, ReferralDropzoneProps>(
  (
    {
      candidates,
      className,
      disabled,
      dropzoneProps,
      inputProps,
      isDragging,
      onBrowse,
      onRemoveCandidate,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-component="ReferralDropzone"
        data-state={isDragging ? "dragging" : "idle"}
        onClick={disabled ? undefined : onBrowse}
        {...dropzoneProps}
        {...props}
        className={cn(
          referralDropzoneVariants({ dragging: isDragging, disabled, className }),
        )}
      >
        <span aria-hidden className={cn(referralDropzoneIconVariants())}>
          <UploadIcon size="lg" />
        </span>

        <h2 className={cn(referralDropzoneTitleVariants())}>
          Drop referral PDFs here
        </h2>
        <p className={cn(referralDropzoneHintVariants())}>
          PDF only · up to 20 MB each · bulk drop supported
        </p>

        <input
          {...inputProps}
          type="file"
          multiple
          accept={`${REFERRAL_ACCEPTED_MIME_TYPE},${REFERRAL_ACCEPTED_EXTENSION}`}
          disabled={disabled}
          className={cn(referralDropzoneInputVariants())}
        />

        <Button
          size="sm"
          disabled={disabled}
          onClick={(event) => {
            // The whole zone already opens the picker on click — stop this
            // one from bubbling and firing it a second time.
            event.stopPropagation();
            onBrowse();
          }}
        >
          Browse files
        </Button>

        {candidates.length > 0 ? (
          <div className={cn(referralDropzoneQueueVariants())}>
            {candidates.map((candidate) => (
              <UploadFileChip
                key={candidate.id}
                candidate={candidate}
                onRemove={disabled ? undefined : onRemoveCandidate}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);
ReferralDropzone.displayName = "ReferralDropzone";

export { ReferralDropzone };
