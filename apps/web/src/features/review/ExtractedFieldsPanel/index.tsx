"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  REFERRAL_STATUSES,
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
  extractedFieldsPanelPageBadgeMutedVariants,
  extractedFieldsPanelPageBadgeVariants,
  extractedFieldsPanelRowKeyVariants,
  extractedFieldsPanelRowValueVariants,
  extractedFieldsPanelRowVariants,
  extractedFieldsPanelTabActiveVariants,
  extractedFieldsPanelTabVariants,
  extractedFieldsPanelVariants,
} from "./ExtractedFieldsPanel.styles";

const EXTRACTION_IN_PROGRESS_STATUSES: readonly ReferralStatus[] = [
  REFERRAL_STATUSES.AWAITING_UPLOAD,
  REFERRAL_STATUSES.PENDING,
  REFERRAL_STATUSES.PROCESSING,
];

export interface ExtractedFieldsPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  referral: ReferralDetailView;
  selectedFieldIndex: number | null;
  onSelectField: (index: number) => void;
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
    { className, onSelectField, referral, selectedFieldIndex, ...props },
    ref,
  ) => {
    const isTerminalFailure =
      referral.status === REFERRAL_STATUSES.FAILED ||
      referral.status === REFERRAL_STATUSES.REJECTED;

    const isExtractionInProgress =
      EXTRACTION_IN_PROGRESS_STATUSES.includes(referral.status);

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
                  {referral.extractedPayload.map((field, index) => {
                    const isSelected = index === selectedFieldIndex;
                    return (
                      <button
                        key={`${field.key ?? "field"}-${index}`}
                        type="button"
                        data-component="ExtractedFieldRow"
                        data-selected={isSelected}
                        data-has-source={field.boundingBox !== null}
                        aria-pressed={isSelected}
                        onClick={() => onSelectField(index)}
                        className={cn(
                          extractedFieldsPanelRowVariants({ selected: isSelected }),
                        )}
                      >
                        <span className={cn(extractedFieldsPanelRowKeyVariants())}>
                          {field.label || field.key || "—"}
                        </span>
                        <span className={cn(extractedFieldsPanelRowValueVariants())}>
                          {field.value}
                        </span>
                        <span
                          className={cn(
                            field.boundingBox
                              ? extractedFieldsPanelPageBadgeVariants()
                              : extractedFieldsPanelPageBadgeMutedVariants(),
                          )}
                        >
                          p{field.pageNumber}
                        </span>
                      </button>
                    );
                  })}
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
