"use client";

import * as React from "react";

import type { UploadPhase } from "@/server-hooks/referrals/use-create-referrals";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@/shared/Icon";

import {
  uploadProgressButtonFillVariants,
  uploadProgressButtonLabelVariants,
  uploadProgressButtonVariants,
} from "./UploadProgressButton.styles";

export interface UploadProgressButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  phase: UploadPhase;
  /** 0-100. Ignored while `phase === "idle"`. */
  percent: number;
  /** Tints the completed fill red instead of green when a file failed. */
  hasErrors?: boolean;
  /** Shown while `phase === "idle"`, e.g. "Upload & extract 3 files". */
  idleLabel: string;
}

/**
 * The submit button doubles as a progress bar once a batch is in flight: a
 * fill layer grows from 0-100% behind the label as files finish uploading,
 * then holds briefly on a green "Documents uploaded" state before the
 * caller resets it back to idle (see `useCreateReferrals`'s
 * `COMPLETE_HOLD_MS`).
 */
const UploadProgressButton = React.forwardRef<
  HTMLButtonElement,
  UploadProgressButtonProps
>(({ className, disabled, hasErrors, idleLabel, percent, phase, ...props }, ref) => {
  const isIdle = phase === "idle";
  const isComplete = phase === "complete";

  // Dim the button only when it's idle and disabled (nothing to submit) — never
  // while a batch is in flight, where `disabled` guards against double-submits
  // but the progress bar must stay fully visible.
  const isDimmed = isIdle && Boolean(disabled);

  const fillTone = isComplete ? (hasErrors ? "danger" : "success") : "progress";
  const fillPercent = isIdle ? 0 : Math.max(0, Math.min(100, percent));

  const label = isIdle
    ? idleLabel
    : isComplete
      ? "Documents uploaded"
      : `Uploading… ${fillPercent}%`;

  return (
    <button
      ref={ref}
      type="button"
      data-component="UploadProgressButton"
      data-phase={phase}
      disabled={disabled}
      {...props}
      className={cn(
        uploadProgressButtonVariants({ className }),
        isDimmed ? "opacity-40" : undefined,
      )}
    >
      <span
        aria-hidden
        style={{ width: `${fillPercent}%` }}
        className={cn(uploadProgressButtonFillVariants({ tone: fillTone }))}
      />
      <span className={cn(uploadProgressButtonLabelVariants())}>
        {isComplete ? <CheckIcon size="sm" /> : null}
        {label}
      </span>
    </button>
  );
});
UploadProgressButton.displayName = "UploadProgressButton";

export { UploadProgressButton };
