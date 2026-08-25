"use client";

import * as React from "react";

import {
  SCHEMA_SOURCE_DESCRIPTIONS,
  SCHEMA_SOURCE_LABELS,
  SCHEMA_SOURCE_ORDER,
} from "@/constants/extraction-schemas";
import type { UploadedSchema } from "@/hooks/use-schema-selection";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/Button";
import { PlusIcon } from "@/shared/Icon";
import { RadioCard } from "@/shared/RadioCard";
import { Select } from "@/shared/Select";
import type { UploadPhase } from "@/server-hooks/referrals/use-create-referrals";
import {
  SCHEMA_SOURCES,
  type SavedSchema,
  type SchemaSource,
} from "@/types/extraction-schemas/schema";

import { UploadProgressButton } from "@/features/referrals/UploadProgressButton";

import { SchemaJsonDrop } from "../SchemaJsonDrop";
import {
  schemaSelectorActionsVariants,
  schemaSelectorErrorVariants,
  schemaSelectorFooterVariants,
  schemaSelectorHintVariants,
  schemaSelectorOptionsVariants,
  schemaSelectorTitleVariants,
  schemaSelectorVariants,
} from "./SchemaSelector.styles";

export interface SchemaSelectorProps
  extends React.HTMLAttributes<HTMLElement> {
  savedSchemas: readonly SavedSchema[];
  source: SchemaSource;
  savedSchemaId?: string;
  uploadedSchema?: UploadedSchema;
  onSourceChange: (source: SchemaSource) => void;
  onSavedSchemaChange: (id: string) => void;
  onSchemaUploaded: (schema: UploadedSchema | undefined) => void;
  /** Opens the in-app field builder modal (wireframe 2b). */
  onBuildFields?: () => void;
  onSubmit: () => void;
  /** Drives the submit label: "Upload & extract 3 files". */
  fileCount: number;
  /** Drives the submit button's idle / progress-bar / complete presentation. */
  phase?: UploadPhase;
  /** 0-100, while `phase` is "creating" or "uploading". */
  progressPercent?: number;
  /** Tints the completed progress bar red instead of green. */
  hasErrors?: boolean;
  submitDisabled?: boolean;
  error?: string | null;
}

/** Right-hand panel of the upload row: pick how this batch gets extracted. */
const SchemaSelector = React.forwardRef<HTMLElement, SchemaSelectorProps>(
  (
    {
      className,
      error,
      fileCount,
      hasErrors,
      onBuildFields,
      onSavedSchemaChange,
      onSchemaUploaded,
      onSourceChange,
      onSubmit,
      phase = "idle",
      progressPercent = 0,
      savedSchemaId,
      savedSchemas,
      uploadedSchema,
      source,
      submitDisabled,
      ...props
    },
    ref,
  ) => {
    const schemaOptions = React.useMemo(
      () =>
        savedSchemas.map((schema) => ({
          value: schema.id,
          label: `${schema.name} · ${schema.fieldCount} field${schema.fieldCount === 1 ? "" : "s"}`,
        })),
      [savedSchemas],
    );

    const submitLabel = `Upload & extract ${fileCount} ${fileCount === 1 ? "file" : "files"}`;

    /** The extra control each source reveals under its label. */
    const slots: Partial<Record<SchemaSource, React.ReactNode>> = {
      [SCHEMA_SOURCES.SAVED]: (
        <Select
          options={schemaOptions}
          value={savedSchemaId ?? ""}
          aria-label="Saved extraction schema"
          placeholder="No saved schemas yet"
          disabled={source !== SCHEMA_SOURCES.SAVED}
          onChange={onSavedSchemaChange}
        />
      ),
      [SCHEMA_SOURCES.UPLOAD]: (
        <SchemaJsonDrop
          uploadedSchema={uploadedSchema}
          disabled={source !== SCHEMA_SOURCES.UPLOAD}
          onUploaded={onSchemaUploaded}
        />
      ),
    };

    return (
      <section
        ref={ref}
        aria-label="Extraction schema"
        data-component="SchemaSelector"
        data-state={source}
        {...props}
        className={cn(schemaSelectorVariants({ className }))}
      >
        <h2 className={cn(schemaSelectorTitleVariants())}>Extraction schema</h2>

        <div role="radiogroup" aria-label="Extraction schema source" className={cn(schemaSelectorOptionsVariants())}>
          {SCHEMA_SOURCE_ORDER.map((value) => (
            <RadioCard
              key={value}
              name="schema-source"
              value={value}
              checked={source === value}
              onChange={() => onSourceChange(value)}
              label={SCHEMA_SOURCE_LABELS[value]}
              description={SCHEMA_SOURCE_DESCRIPTIONS[value]}
            >
              {slots[value]}
            </RadioCard>
          ))}
        </div>

        <div className={cn(schemaSelectorFooterVariants())}>
          <Button variant="link" size="inline" onClick={onBuildFields}>
            <PlusIcon size="sm" />
            Build fields in the app
          </Button>
          <span className={cn(schemaSelectorHintVariants())}>name + description</span>
        </div>

        <div className={cn(schemaSelectorActionsVariants())}>
          {error ? (
            <p role="alert" className={cn(schemaSelectorErrorVariants())}>
              {error}
            </p>
          ) : null}

          <UploadProgressButton
            phase={phase}
            percent={progressPercent}
            hasErrors={hasErrors}
            idleLabel={submitLabel}
            disabled={submitDisabled || phase !== "idle"}
            onClick={onSubmit}
          />
        </div>
      </section>
    );
  },
);
SchemaSelector.displayName = "SchemaSelector";

export { SchemaSelector };
