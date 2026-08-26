"use client";

import * as React from "react";

import { useFieldBuilder, type BuildSchemaDraft } from "@/hooks/use-field-builder";
import type { UploadedSchema } from "@/hooks/use-schema-selection";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/Button";
import { CloseIcon } from "@/shared/Icon";
import { Modal } from "@/shared/Modal";

import { SchemaJsonDrop } from "../SchemaJsonDrop";
import {
  fieldBuilderActionsVariants,
  fieldBuilderAddRowVariants,
  fieldBuilderBodyVariants,
  fieldBuilderCloseVariants,
  fieldBuilderDescriptionInputVariants,
  fieldBuilderDividerLabelVariants,
  fieldBuilderDividerRuleVariants,
  fieldBuilderDividerVariants,
  fieldBuilderErrorVariants,
  fieldBuilderFooterVariants,
  fieldBuilderHeaderVariants,
  fieldBuilderModalVariants,
  fieldBuilderNameInputVariants,
  fieldBuilderRowHeadVariants,
  fieldBuilderRowLabelVariants,
  fieldBuilderRowRemoveVariants,
  fieldBuilderRowVariants,
  fieldBuilderSectionLabelVariants,
  fieldBuilderSectionVariants,
  fieldBuilderTitleInputVariants,
  fieldBuilderTitleVariants,
  fieldBuilderUploadHintVariants,
} from "./FieldBuilderModal.styles";

const TITLE_ID = "field-builder-title";

export interface FieldBuilderModalProps {
  onClose: () => void;
  /** Always publishes — every schema built here is saved to the clinic's account. */
  onConfirm: (draft: BuildSchemaDraft) => void;
  /**
   * True while the schema is being published. The modal stays open and
   * blocks its own actions through this — closing early would hide a
   * publish failure the user still needs to see and react to.
   */
  isSaving?: boolean;
  /** Publish error from the last confirm attempt, if any. */
  saveError?: string | null;
  /**
   * Fires once a dropped/selected JSON file is validated and persisted —
   * same outcome as `onConfirm`, just from the other section of this modal.
   * The caller is expected to select it and close the modal.
   */
  onSchemaUploaded: (schema: UploadedSchema) => void;
}

/**
 * Wireframe 2b — "Build fields in the app". Mounted only while open (see
 * `UploadWorkspace`), so `useFieldBuilder` always starts fresh. There is no
 * "save as reusable schema" toggle: every confirmed field set is published to
 * `POST /extraction-schemas` and becomes selectable as a saved schema — the
 * clinic can only ever run an upload against a schema that's in the database.
 */
const FieldBuilderModal = ({
  onClose,
  onConfirm,
  isSaving,
  saveError,
  onSchemaUploaded,
}: FieldBuilderModalProps) => {
  const builder = useFieldBuilder();
  const [uploadedSchema, setUploadedSchema] = React.useState<
    UploadedSchema | undefined
  >();

  const handleConfirm = () => {
    const draft = builder.validate();
    if (!draft) return;
    onConfirm(draft);
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
          disabled={isSaving}
          className={cn(fieldBuilderCloseVariants())}
        >
          <CloseIcon size="sm" />
        </button>
      </div>

      <div className={cn(fieldBuilderBodyVariants())}>
        <div className={cn(fieldBuilderSectionVariants())}>
          <input
            value={builder.title}
            onChange={(event) => builder.setTitle(event.target.value)}
            placeholder="Version name — e.g. Q3 Insurance Forms"
            aria-label="Schema version name"
            className={cn(fieldBuilderTitleInputVariants())}
          />

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

        <div role="separator" className={cn(fieldBuilderDividerVariants())}>
          <span aria-hidden className={cn(fieldBuilderDividerRuleVariants())} />
          <span className={cn(fieldBuilderDividerLabelVariants())}>Or</span>
          <span aria-hidden className={cn(fieldBuilderDividerRuleVariants())} />
        </div>

        <div className={cn(fieldBuilderSectionVariants())}>
          <span className={cn(fieldBuilderSectionLabelVariants())}>
            Upload schema JSON
          </span>
          <SchemaJsonDrop
            uploadedSchema={uploadedSchema}
            disabled={isSaving}
            onUploaded={(schema) => {
              setUploadedSchema(schema);
              if (schema) onSchemaUploaded(schema);
            }}
          />
          <p className={cn(fieldBuilderUploadHintVariants())}>
            A flat {"{ field_name: \"description\" }"} JSON file — validated and
            saved to your schemas the moment it&apos;s selected.
          </p>
        </div>
      </div>

      <div className={cn(fieldBuilderFooterVariants())}>
        {builder.error ? (
          <p role="alert" className={cn(fieldBuilderErrorVariants())}>
            {builder.error}
          </p>
        ) : null}

        {saveError ? (
          <p role="alert" className={cn(fieldBuilderErrorVariants())}>
            {saveError}
          </p>
        ) : null}

        <div className={cn(fieldBuilderActionsVariants())}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="dark" size="sm" onClick={handleConfirm} disabled={isSaving}>
            {isSaving ? "Creating…" : "Create new schema"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
FieldBuilderModal.displayName = "FieldBuilderModal";

export { FieldBuilderModal };
