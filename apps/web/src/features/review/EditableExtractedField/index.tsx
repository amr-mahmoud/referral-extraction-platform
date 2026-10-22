"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  findExtractedFieldKeyError,
  type ExtractedFieldCorrectionInput,
} from "@/managers/extracted-field-correction.manager";
import { useCorrectExtractedField } from "@/server-hooks/review/use-correct-extracted-field";
import { useRevertExtractedField } from "@/server-hooks/review/use-revert-extracted-field";
import { PencilIcon } from "@/shared/Icon";
import {
  EXTRACTED_FIELD_SOURCES,
  type ExtractedFieldView,
  type ReferralDetailView,
} from "@/types/referrals/referral";

import {
  editableExtractedFieldActionsVariants,
  editableExtractedFieldAiOriginalVariants,
  editableExtractedFieldEditButtonVariants,
  editableExtractedFieldEditedBadgeVariants,
  editableExtractedFieldErrorVariants,
  editableExtractedFieldFormVariants,
  editableExtractedFieldInputVariants,
  editableExtractedFieldInputsVariants,
  editableExtractedFieldKeyVariants,
  editableExtractedFieldMainRowVariants,
  editableExtractedFieldPageBadgeVariants,
  editableExtractedFieldSecondaryLineVariants,
  editableExtractedFieldSelectButtonVariants,
  editableExtractedFieldTextButtonVariants,
  editableExtractedFieldValueVariants,
  editableExtractedFieldVariants,
} from "./EditableExtractedField.styles";

export interface EditableExtractedFieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  referralId: string;
  field: ExtractedFieldView;
  fieldIndex: number;
  allFields: readonly ExtractedFieldView[];
  isSelected: boolean;
  /** False hides every edit affordance (referral not COMPLETED / nothing extracted). */
  isEditable: boolean;
  onSelect: () => void;
  onOptimisticCorrect: (fieldKey: string, correction: ExtractedFieldCorrectionInput) => void;
  onOptimisticRevert: (fieldKey: string) => void;
  onReferralUpdated: (referral: ReferralDetailView) => void;
}

/**
 * One row of the review panel. Clicking the row still selects the field for
 * the PDF highlight; when editable, a pencil opens inline key / label / value
 * inputs (Enter saves, Esc cancels) — no modal.
 */
const EditableExtractedField = React.forwardRef<
  HTMLDivElement,
  EditableExtractedFieldProps
>(
  (
    {
      className,
      referralId,
      field,
      fieldIndex,
      allFields,
      isSelected,
      isEditable,
      onSelect,
      onOptimisticCorrect,
      onOptimisticRevert,
      onReferralUpdated,
      ...props
    },
    ref,
  ) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [draft, setDraft] = React.useState({
      key: field.key,
      label: field.label,
      value: field.value,
    });
    const [validationError, setValidationError] = React.useState<string | null>(null);
    const editButtonRef = React.useRef<HTMLButtonElement>(null);

    const reopenEditorAfterFailure = React.useCallback(() => setIsEditing(true), []);

    const correction = useCorrectExtractedField({
      referralId,
      onOptimisticApply: onOptimisticCorrect,
      onSuccess: onReferralUpdated,
      onError: reopenEditorAfterFailure,
    });
    const revert = useRevertExtractedField({
      referralId,
      onOptimisticApply: onOptimisticRevert,
      onSuccess: onReferralUpdated,
    });

    const isSaving = correction.isLoading || revert.isLoading;
    const errorMessage = validationError ?? correction.error ?? revert.error;
    const viewState = isEditing
      ? "editing"
      : isSaving
        ? "saving"
        : errorMessage
          ? "error"
          : "view";

    const isEdited = field.aiOriginal !== null;
    const isReviewerAdded = field.source === EXTRACTED_FIELD_SOURCES.REVIEWER;

    function openEditor() {
      setDraft({ key: field.key, label: field.label, value: field.value });
      setValidationError(null);
      correction.reset();
      revert.reset();
      setIsEditing(true);
    }

    function cancelEditing() {
      setIsEditing(false);
      setValidationError(null);
      correction.reset();
      editButtonRef.current?.focus();
    }

    function submitCorrection() {
      const trimmedKey = draft.key.trim();
      const trimmedLabel = draft.label.trim();
      if (trimmedLabel === "") {
        setValidationError("Label can't be empty.");
        return;
      }
      const keyError =
        trimmedKey === field.key
          ? null
          : findExtractedFieldKeyError(trimmedKey, allFields, fieldIndex);
      if (keyError) {
        setValidationError(keyError);
        return;
      }

      const hasChanged =
        trimmedKey !== field.key ||
        trimmedLabel !== field.label ||
        draft.value !== field.value;
      setValidationError(null);
      if (!hasChanged) {
        setIsEditing(false);
        return;
      }

      setIsEditing(false);
      correction.execute({
        fieldKey: field.key,
        correction: {
          ...(trimmedKey !== field.key ? { key: trimmedKey } : {}),
          label: trimmedLabel,
          value: draft.value,
        },
      });
    }

    function handleFormKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEditing();
      }
    }

    function updateDraft(name: keyof typeof draft) {
      return (event: React.ChangeEvent<HTMLInputElement>) =>
        setDraft((current) => ({ ...current, [name]: event.target.value }));
    }

    return (
      <div
        ref={ref}
        data-component="EditableExtractedField"
        data-state={viewState}
        data-selected={isSelected}
        {...props}
        className={cn(
          editableExtractedFieldVariants({
            selected: isSelected,
            state: viewState,
            className,
          }),
        )}
      >
        {isEditing ? (
          <form
            className={cn(editableExtractedFieldFormVariants())}
            onKeyDown={handleFormKeyDown}
            onSubmit={(event) => {
              event.preventDefault();
              submitCorrection();
            }}
          >
            <div className={cn(editableExtractedFieldInputsVariants())}>
              <input
                aria-label="Field key"
                placeholder="key"
                value={draft.key}
                onChange={updateDraft("key")}
                className={cn(editableExtractedFieldInputVariants({ width: "key" }))}
              />
              <input
                aria-label="Field label"
                placeholder="Label"
                value={draft.label}
                onChange={updateDraft("label")}
                className={cn(editableExtractedFieldInputVariants({ width: "label" }))}
              />
              <input
                aria-label="Field value"
                placeholder="Value"
                autoFocus
                value={draft.value}
                onChange={updateDraft("value")}
                className={cn(editableExtractedFieldInputVariants({ width: "value" }))}
              />
            </div>
            <div className={cn(editableExtractedFieldActionsVariants())}>
              <button type="submit" className={cn(editableExtractedFieldTextButtonVariants())}>
                Save
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className={cn(editableExtractedFieldTextButtonVariants())}
              >
                Cancel
              </button>
              <span>Enter to save · Esc to cancel</span>
            </div>
          </form>
        ) : (
          <div className={cn(editableExtractedFieldMainRowVariants())}>
            <button
              type="button"
              data-component="ExtractedFieldRow"
              data-selected={isSelected}
              data-has-source={field.boundingBox !== null}
              aria-pressed={isSelected}
              onClick={onSelect}
              className={cn(editableExtractedFieldSelectButtonVariants())}
            >
              <span className={cn(editableExtractedFieldKeyVariants())}>
                {field.label || field.key || "—"}
              </span>
              <span className={cn(editableExtractedFieldValueVariants())}>
                {field.value}
              </span>
              {isEdited || isReviewerAdded ? (
                <span className={cn(editableExtractedFieldEditedBadgeVariants())}>
                  {isEdited ? "Edited" : "Added"}
                </span>
              ) : null}
              <span
                className={cn(
                  editableExtractedFieldPageBadgeVariants({
                    hasSource: field.boundingBox !== null,
                  }),
                )}
              >
                {field.pageNumber === null ? "—" : `p${field.pageNumber}`}
              </span>
            </button>
            {isEditable ? (
              <button
                ref={editButtonRef}
                type="button"
                aria-label={`Edit ${field.label || field.key}`}
                onClick={openEditor}
                disabled={isSaving}
                className={cn(editableExtractedFieldEditButtonVariants())}
              >
                <PencilIcon size="sm" />
              </button>
            ) : null}
          </div>
        )}

        {!isEditing && isEdited && field.aiOriginal ? (
          <div className={cn(editableExtractedFieldSecondaryLineVariants())}>
            <span className={cn(editableExtractedFieldAiOriginalVariants())}>
              AI: {field.aiOriginal.value}
              {field.aiOriginal.label !== field.label ||
              field.aiOriginal.key !== field.key
                ? ` (${field.aiOriginal.label} · ${field.aiOriginal.key})`
                : ""}
            </span>
            {isEditable ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => revert.execute(field.key)}
                className={cn(editableExtractedFieldTextButtonVariants())}
              >
                Revert
              </button>
            ) : null}
          </div>
        ) : null}

        {!isEditing && isReviewerAdded ? (
          <p className={cn(editableExtractedFieldSecondaryLineVariants())}>
            Added by reviewer · no PDF location
          </p>
        ) : null}

        {errorMessage ? (
          <p role="alert" className={cn(editableExtractedFieldErrorVariants())}>
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  },
);
EditableExtractedField.displayName = "EditableExtractedField";

export { EditableExtractedField };
