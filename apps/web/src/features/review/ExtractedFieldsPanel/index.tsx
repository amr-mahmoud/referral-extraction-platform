"use client";

import * as React from "react";

import { AddExtractedFieldRow } from "@/features/review/AddExtractedFieldRow";
import { EditableExtractedField } from "@/features/review/EditableExtractedField";
import { cn } from "@/lib/utils";
import {
  applyFieldCorrection,
  applyFieldRevert,
  applyReviewerFieldAddition,
  type ExtractedFieldCorrectionInput,
  type NewReviewerFieldInput,
} from "@/managers/extracted-field-correction.manager";
import {
  REFERRAL_STATUSES,
  type ExtractedFieldView,
  type ReferralDetailView,
  type ReferralStatus,
} from "@/types/referrals/referral";

import {
  extractedFieldsPanelBodyVariants,
  extractedFieldsPanelColumnHeaderKeyVariants,
  extractedFieldsPanelColumnHeaderPageVariants,
  extractedFieldsPanelColumnHeaderValueVariants,
  extractedFieldsPanelColumnHeaderVariants,
  extractedFieldsPanelEmptyHintVariants,
  extractedFieldsPanelEmptyTitleVariants,
  extractedFieldsPanelEmptyVariants,
  extractedFieldsPanelErrorVariants,
  extractedFieldsPanelHintVariants,
  extractedFieldsPanelListVariants,
  extractedFieldsPanelTabActiveVariants,
  extractedFieldsPanelTabVariants,
  extractedFieldsPanelVariants,
} from "./ExtractedFieldsPanel.styles";

const EXTRACTION_IN_PROGRESS_STATUSES: readonly ReferralStatus[] = [
  REFERRAL_STATUSES.PENDING,
  REFERRAL_STATUSES.PROCESSING,
];

type OptimisticFieldChange =
  | { type: "correct"; fieldKey: string; correction: ExtractedFieldCorrectionInput }
  | { type: "add"; newField: NewReviewerFieldInput }
  | { type: "revert"; fieldKey: string };

function applyOptimisticFieldChange(
  fields: ExtractedFieldView[],
  change: OptimisticFieldChange,
): ExtractedFieldView[] {
  switch (change.type) {
    case "correct":
      return applyFieldCorrection(fields, change.fieldKey, change.correction);
    case "add":
      return applyReviewerFieldAddition(fields, change.newField);
    case "revert":
      return applyFieldRevert(fields, change.fieldKey);
  }
}

export interface ExtractedFieldsPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  referral: ReferralDetailView;
  selectedFieldIndex: number | null;
  onSelectField: (index: number) => void;
  /** Adopts the full referral the API returned after a successful correction. */
  onReferralUpdated: (referral: ReferralDetailView) => void;
}

/**
 * Right-hand panel of the review screen (wireframe 1e). Renders the schema's
 * flat field order — the real `ExtractedFieldDto[]` carries no category, so
 * grouping would be inventing structure the data doesn't have. Clicking a row
 * selects it so the PDF viewer can jump to and highlight its source location.
 */
const ExtractedFieldsPanel = React.forwardRef<
  HTMLDivElement,
  ExtractedFieldsPanelProps
>(
  (
    { className, onReferralUpdated, onSelectField, referral, selectedFieldIndex, ...props },
    ref,
  ) => {
    const isTerminalFailure =
      referral.status === REFERRAL_STATUSES.FAILED ||
      referral.status === REFERRAL_STATUSES.REJECTED;

    const isExtractionInProgress =
      EXTRACTION_IN_PROGRESS_STATUSES.includes(referral.status);

    // Corrections exist only on a finished extraction that produced fields;
    // anywhere else the panel stays read-only and shows no edit controls.
    const isCorrectionAvailable =
      referral.status === REFERRAL_STATUSES.COMPLETED &&
      referral.extractedPayload.length > 0;

    // Applied inside the correction hooks' transitions, so the edit shows at
    // once and is dropped automatically if the action fails.
    const [optimisticFields, dispatchOptimisticChange] = React.useOptimistic(
      referral.extractedPayload,
      applyOptimisticFieldChange,
    );

    return (
      <aside
        ref={ref}
        data-component="ExtractedFieldsPanel"
        data-status={referral.status}
        {...props}
        className={cn(extractedFieldsPanelVariants({ className }))}
      >
        <div className={cn(extractedFieldsPanelTabVariants())}>
          <span className={cn(extractedFieldsPanelTabActiveVariants())}>
            Extracted fields
          </span>
        </div>

        <div className={cn(extractedFieldsPanelBodyVariants())}>
          {isTerminalFailure ? (
            <div className={cn(extractedFieldsPanelEmptyVariants())}>
              <p className={cn(extractedFieldsPanelEmptyTitleVariants())}>
                Extraction failed
              </p>
              <p className={cn(extractedFieldsPanelErrorVariants())}>
                {referral.errorMessage ?? "No reason recorded."}
              </p>
            </div>
          ) : isExtractionInProgress ? (
            <div className={cn(extractedFieldsPanelEmptyVariants())}>
              <p className={cn(extractedFieldsPanelEmptyTitleVariants())}>
                Extraction in progress
              </p>
              <p className={cn(extractedFieldsPanelEmptyHintVariants())}>
                Extracted fields will appear here the moment the worker reports
                back.
              </p>
            </div>
          ) : (
            <>
              <p className={cn(extractedFieldsPanelHintVariants())}>
                Click any value to highlight its source on the document.
              </p>

              {referral.extractedPayload.length === 0 ? (
                <div className={cn(extractedFieldsPanelEmptyVariants())}>
                  <p className={cn(extractedFieldsPanelEmptyTitleVariants())}>
                    Nothing extracted
                  </p>
                  <p className={cn(extractedFieldsPanelEmptyHintVariants())}>
                    This referral completed without producing any fields.
                  </p>
                </div>
              ) : (
                <div className={cn(extractedFieldsPanelListVariants())}>
                  <div
                    aria-hidden
                    className={cn(extractedFieldsPanelColumnHeaderVariants())}
                  >
                    <span className={cn(extractedFieldsPanelColumnHeaderKeyVariants())}>
                      Field
                    </span>
                    <span className={cn(extractedFieldsPanelColumnHeaderValueVariants())}>
                      Value
                    </span>
                    <span className={cn(extractedFieldsPanelColumnHeaderPageVariants())}>
                      Page
                    </span>
                  </div>
                  {optimisticFields.map((field, index) => (
                    <EditableExtractedField
                      key={index}
                      referralId={referral.id}
                      field={field}
                      fieldIndex={index}
                      allFields={optimisticFields}
                      isSelected={index === selectedFieldIndex}
                      isEditable={isCorrectionAvailable}
                      onSelect={() => onSelectField(index)}
                      onOptimisticCorrect={(fieldKey, correction) =>
                        dispatchOptimisticChange({ type: "correct", fieldKey, correction })
                      }
                      onOptimisticRevert={(fieldKey) =>
                        dispatchOptimisticChange({ type: "revert", fieldKey })
                      }
                      onReferralUpdated={onReferralUpdated}
                    />
                  ))}
                  {isCorrectionAvailable ? (
                    <AddExtractedFieldRow
                      referralId={referral.id}
                      allFields={optimisticFields}
                      onOptimisticAdd={(newField) =>
                        dispatchOptimisticChange({ type: "add", newField })
                      }
                      onReferralUpdated={onReferralUpdated}
                    />
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    );
  },
);
ExtractedFieldsPanel.displayName = "ExtractedFieldsPanel";

export { ExtractedFieldsPanel };
