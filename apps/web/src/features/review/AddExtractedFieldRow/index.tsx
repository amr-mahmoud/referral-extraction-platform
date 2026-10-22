"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  findExtractedFieldKeyError,
  type NewReviewerFieldInput,
} from "@/managers/extracted-field-correction.manager";
import { useAddExtractedField } from "@/server-hooks/review/use-add-extracted-field";
import { PlusIcon } from "@/shared/Icon";
import type {
  ExtractedFieldView,
  ReferralDetailView,
} from "@/types/referrals/referral";

import {
  addExtractedFieldRowActionsVariants,
  addExtractedFieldRowErrorVariants,
  addExtractedFieldRowFormVariants,
  addExtractedFieldRowInputVariants,
  addExtractedFieldRowInputsVariants,
  addExtractedFieldRowTextButtonVariants,
  addExtractedFieldRowTriggerVariants,
  addExtractedFieldRowVariants,
} from "./AddExtractedFieldRow.styles";

const EMPTY_DRAFT: NewReviewerFieldInput = { key: "", label: "", value: "" };

export interface AddExtractedFieldRowProps
  extends React.HTMLAttributes<HTMLDivElement> {
  referralId: string;
  allFields: readonly ExtractedFieldView[];
  onOptimisticAdd: (newField: NewReviewerFieldInput) => void;
  onReferralUpdated: (referral: ReferralDetailView) => void;
}

/** Inline row at the bottom of the panel for adding a reviewer-authored field. */
const AddExtractedFieldRow = React.forwardRef<
  HTMLDivElement,
  AddExtractedFieldRowProps
>(
  (
    { className, referralId, allFields, onOptimisticAdd, onReferralUpdated, ...props },
    ref,
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [draft, setDraft] = React.useState(EMPTY_DRAFT);
    const [validationError, setValidationError] = React.useState<string | null>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    const reopenAfterFailure = React.useCallback(() => setIsOpen(true), []);

    const addition = useAddExtractedField({
      referralId,
      onOptimisticApply: onOptimisticAdd,
      onSuccess: (referral) => {
        setDraft(EMPTY_DRAFT);
        onReferralUpdated(referral);
      },
      onError: reopenAfterFailure,
    });

    const errorMessage = validationError ?? addition.error;
    const viewState = isOpen
      ? "editing"
      : addition.isLoading
        ? "saving"
        : errorMessage
          ? "error"
          : "view";

    function close() {
      setIsOpen(false);
      setValidationError(null);
      addition.reset();
      triggerRef.current?.focus();
    }

    function submit() {
      const newField: NewReviewerFieldInput = {
        key: draft.key.trim(),
        label: draft.label.trim(),
        value: draft.value,
      };
      if (newField.label === "") {
        setValidationError("Key and label are required.");
        return;
      }
      const keyError = findExtractedFieldKeyError(newField.key, allFields, null);
      if (keyError) {
        setValidationError(keyError);
        return;
      }

      setValidationError(null);
      setIsOpen(false);
      addition.execute(newField);
    }

    function updateDraft(name: keyof NewReviewerFieldInput) {
      return (event: React.ChangeEvent<HTMLInputElement>) =>
        setDraft((current) => ({ ...current, [name]: event.target.value }));
    }

    return (
      <div
        ref={ref}
        data-component="AddExtractedFieldRow"
        data-state={viewState}
        {...props}
        className={cn(addExtractedFieldRowVariants({ state: viewState, className }))}
      >
        {isOpen ? (
          <form
            className={cn(addExtractedFieldRowFormVariants())}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                close();
              }
            }}
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className={cn(addExtractedFieldRowInputsVariants())}>
              <input
                aria-label="New field key"
                placeholder="key_name"
                autoFocus
                value={draft.key}
                onChange={updateDraft("key")}
                className={cn(addExtractedFieldRowInputVariants({ width: "key" }))}
              />
              <input
                aria-label="New field label"
                placeholder="Label"
                value={draft.label}
                onChange={updateDraft("label")}
                className={cn(addExtractedFieldRowInputVariants({ width: "label" }))}
              />
              <input
                aria-label="New field value"
                placeholder="Value"
                value={draft.value}
                onChange={updateDraft("value")}
                className={cn(addExtractedFieldRowInputVariants({ width: "value" }))}
              />
            </div>
            <div className={cn(addExtractedFieldRowActionsVariants())}>
              <button type="submit" className={cn(addExtractedFieldRowTextButtonVariants())}>
                Add
              </button>
              <button
                type="button"
                onClick={close}
                className={cn(addExtractedFieldRowTextButtonVariants())}
              >
                Cancel
              </button>
              <span>Enter to add · Esc to cancel</span>
            </div>
          </form>
        ) : (
          <button
            ref={triggerRef}
            type="button"
            disabled={addition.isLoading}
            onClick={() => {
              addition.reset();
              setIsOpen(true);
            }}
            className={cn(addExtractedFieldRowTriggerVariants())}
          >
            <PlusIcon size="sm" />
            Add field
          </button>
        )}
        {errorMessage ? (
          <p role="alert" className={cn(addExtractedFieldRowErrorVariants())}>
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  },
);
AddExtractedFieldRow.displayName = "AddExtractedFieldRow";

export { AddExtractedFieldRow };
