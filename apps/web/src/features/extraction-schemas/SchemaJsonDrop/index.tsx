"use client";

import * as React from "react";

import { SCHEMA_UPLOAD_ACCEPTED_EXTENSION } from "@/constants/extraction-schemas";
import type { UploadedSchema } from "@/hooks/use-schema-selection";
import { useUploadSchemaJson } from "@/hooks/use-upload-schema-json";
import { cn } from "@/lib/utils";

import {
  schemaJsonDropErrorVariants,
  schemaJsonDropInputVariants,
  schemaJsonDropMetaVariants,
  schemaJsonDropNameVariants,
  schemaJsonDropVariants,
  schemaJsonDropWrapVariants,
} from "./SchemaJsonDrop.styles";

export interface SchemaJsonDropProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "onSelect"> {
  /** The persisted schema behind the currently chosen file, if any. */
  uploadedSchema?: UploadedSchema;
  onUploaded: (schema: UploadedSchema | undefined) => void;
  disabled?: boolean;
}

/**
 * The "Upload schema JSON" radio's slot. A dropped/selected `.json` file is
 * read, structurally validated (`useUploadSchemaJson` → the
 * `extraction-schema-input` manager — the same shape check the API applies,
 * so a malformed file fails before any network call), then published via
 * `POST /extraction-schemas`. `onUploaded` only fires once that publish
 * succeeds, so `uploadedSchema.id` is always a real, persisted schema.
 */
const SchemaJsonDrop = React.forwardRef<HTMLDivElement, SchemaJsonDropProps>(
  ({ className, disabled, uploadedSchema, onUploaded, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    // Named ahead of the async pipeline so the success callback — which only
    // hears back from the server, never the original File — knows what to
    // label the result.
    const pendingFileName = React.useRef<string>("");

    const { isLoading, error, upload, reset } = useUploadSchemaJson({
      onSuccess: (schema) =>
        onUploaded({ id: schema.id, fileName: pendingFileName.current }),
    });

    const handleFiles = (files: FileList | null) => {
      if (disabled) return;
      const file = files?.[0];
      if (!file) return;

      pendingFileName.current = file.name;
      onUploaded(undefined);
      upload(file);
    };

    const statusText = isLoading
      ? "Validating & saving…"
      : (uploadedSchema?.fileName ?? "Drop .json or browse");

    return (
      <div
        ref={ref}
        data-component="SchemaJsonDrop"
        data-state={uploadedSchema ? "filled" : "empty"}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
        {...props}
        className={cn(schemaJsonDropWrapVariants(), className)}
      >
        <input
          ref={inputRef}
          type="file"
          accept={SCHEMA_UPLOAD_ACCEPTED_EXTENSION}
          disabled={disabled || isLoading}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
          className={cn(schemaJsonDropInputVariants())}
        />

        <button
          type="button"
          disabled={disabled || isLoading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            schemaJsonDropVariants({ filled: Boolean(uploadedSchema) }),
          )}
        >
          <span className={cn(schemaJsonDropNameVariants())}>{statusText}</span>
        </button>

        {uploadedSchema && !isLoading && !error ? (
          <span className={cn(schemaJsonDropMetaVariants())}>Saved to your schemas</span>
        ) : null}

        {error ? (
          <p role="alert" className={cn(schemaJsonDropErrorVariants())}>
            {error}{" "}
            <button
              type="button"
              onClick={reset}
              className="font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </p>
        ) : null}
      </div>
    );
  },
);
SchemaJsonDrop.displayName = "SchemaJsonDrop";

export { SchemaJsonDrop };
