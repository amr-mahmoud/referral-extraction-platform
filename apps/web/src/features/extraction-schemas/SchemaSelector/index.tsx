"use client";

import * as React from "react";

import {
  SCHEMA_SOURCE_DESCRIPTIONS,
  SCHEMA_SOURCE_LABELS,
  SCHEMA_SOURCE_ORDER,
} from "@/constants/extraction-schemas";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/Button";
import { PlusIcon } from "@/shared/Icon";
import { RadioCard } from "@/shared/RadioCard";
import { Select } from "@/shared/Select";
import {
  SCHEMA_SOURCES,
  type SavedSchema,
  type SchemaSource,
} from "@/types/extraction-schemas/schema";

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
  schemaFileName?: string;
  onSourceChange: (source: SchemaSource) => void;
  onSavedSchemaChange: (id: string) => void;
  onSchemaFileChange: (fileName: string | undefined) => void;
  /** Opens the in-app field builder (screen 2a) — not wired yet. */
  onBuildFields?: () => void;
  onSubmit: () => void;
  /** Drives the submit label: "Upload & extract 3 files". */
  fileCount: number;
  isSubmitting?: boolean;
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
      isSubmitting,
      onBuildFields,
      onSavedSchemaChange,
      onSchemaFileChange,
      onSourceChange,
      onSubmit,
      savedSchemaId,
      savedSchemas,
      schemaFileName,
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
          label: `${schema.name} · ${schema.fieldCount} fields`,
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
          disabled={source !== SCHEMA_SOURCES.SAVED}
          onChange={(event) => onSavedSchemaChange(event.target.value)}
        />
      ),
      [SCHEMA_SOURCES.UPLOAD]: (
        <SchemaJsonDrop
          fileName={schemaFileName}
          disabled={source !== SCHEMA_SOURCES.UPLOAD}
          onSelect={onSchemaFileChange}
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

          <Button
            variant="dark"
            className="h-11 w-full"
            disabled={submitDisabled || isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? "Uploading…" : submitLabel}
          </Button>
        </div>
      </section>
    );
  },
);
SchemaSelector.displayName = "SchemaSelector";

export { SchemaSelector };
