"use client";

import * as React from "react";

import { useFieldBuilder } from "@/hooks/use-field-builder";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/Button";
import { Checkbox } from "@/shared/Checkbox";
import { CloseIcon } from "@/shared/Icon";
import { Modal } from "@/shared/Modal";
import type { CustomSchemaField } from "@/types/extraction-schemas/schema";

import {
  fieldBuilderActionsVariants,
  fieldBuilderAddRowVariants,
  fieldBuilderBodyVariants,
  fieldBuilderCloseVariants,
  fieldBuilderDescriptionInputVariants,
  fieldBuilderErrorVariants,
  fieldBuilderFooterVariants,
  fieldBuilderHeaderVariants,
  fieldBuilderModalVariants,
  fieldBuilderNameInputVariants,
  fieldBuilderRowHeadVariants,
  fieldBuilderRowLabelVariants,
  fieldBuilderRowRemoveVariants,
  fieldBuilderRowVariants,
  fieldBuilderTitleVariants,
} from "./FieldBuilderModal.styles";

const TITLE_ID = "field-builder-title";

export interface FieldBuilderModalProps {
  onClose: () => void;
  onConfirm: (fields: CustomSchemaField[], saveAsSchema: boolean) => void;
  /** Fields already confirmed, so reopening to edit starts from them. */
  initialFields?: readonly CustomSchemaField[];
  initialSaveAsSchema?: boolean;
}

/**
 * Wireframe 2b — "Build fields in the app". Mounted only while open (see
 * `UploadWorkspace`), so `useFieldBuilder` always starts from a fresh draft
 * seeded from whatever was last confirmed.
 */
const FieldBuilderModal = ({
  onClose,
  onConfirm,
  initialFields,
  initialSaveAsSchema,
}: FieldBuilderModalProps) => {
  const builder = useFieldBuilder({ initialFields, initialSaveAsSchema });

  const handleConfirm = () => {
    const sanitized = builder.validate();
    if (!sanitized) return;
    onConfirm(sanitized, builder.saveAsSchema);
  };

  return (
    <Modal labelledBy={TITLE_ID} onClose={onClose} className={cn(fieldBuilderModalVariants())}>
      <div className={cn(fieldBuilderHeaderVariants())}>
        <h2 id={TITLE_ID} className={cn(fieldBuilderTitleVariants())}>
          Build fields in the app
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className={cn(fieldBuilderCloseVariants())}
        >
          <CloseIcon size="sm" />
        </button>
      </div>

      <div className={cn(fieldBuilderBodyVariants())}>
        {builder.fields.map((field, index) => (
          <div key={field.id} className={cn(fieldBuilderRowVariants())}>
            <div className={cn(fieldBuilderRowHeadVariants())}>
              <span className={cn(fieldBuilderRowLabelVariants())}>
                Field {index + 1}
              </span>
              {builder.fields.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Remove field ${index + 1}`}
                  onClick={() => builder.removeField(field.id)}
                  className={cn(fieldBuilderRowRemoveVariants())}
                >
                  <CloseIcon size="sm" />
                </button>
              ) : null}
            </div>

            <input
              value={field.name}
              onChange={(event) => builder.updateField(field.id, { name: event.target.value })}
              placeholder="Name — e.g. policy_number"
              aria-label={`Field ${index + 1} name`}
              className={cn(fieldBuilderNameInputVariants())}
            />

            <textarea
              value={field.description}
              onChange={(event) =>
                builder.updateField(field.id, { description: event.target.value })
              }
              placeholder="Description — where to find it, expected format…"
              aria-label={`Field ${index + 1} description`}
              rows={2}
              className={cn(fieldBuilderDescriptionInputVariants())}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={builder.addField}
          className={cn(fieldBuilderAddRowVariants())}
        >
          + Add another field
        </button>
      </div>

      <div className={cn(fieldBuilderFooterVariants())}>
        <Checkbox
          checked={builder.saveAsSchema}
          onChange={(event) => builder.setSaveAsSchema(event.target.checked)}
          label="Save as a reusable schema for this clinic"
        />

        {builder.error ? (
          <p role="alert" className={cn(fieldBuilderErrorVariants())}>
            {builder.error}
          </p>
        ) : null}

        <div className={cn(fieldBuilderActionsVariants())}>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="dark" size="sm" onClick={handleConfirm}>
            Use these fields
          </Button>
        </div>
      </div>
    </Modal>
  );
};
FieldBuilderModal.displayName = "FieldBuilderModal";

export { FieldBuilderModal };
