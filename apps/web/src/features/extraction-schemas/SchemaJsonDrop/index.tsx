"use client";

import * as React from "react";

import { SCHEMA_UPLOAD_ACCEPTED_EXTENSION } from "@/constants/extraction-schemas";
import { cn } from "@/lib/utils";

import {
  schemaJsonDropInputVariants,
  schemaJsonDropNameVariants,
  schemaJsonDropVariants,
} from "./SchemaJsonDrop.styles";

export interface SchemaJsonDropProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "onSelect"> {
  /** Name of the schema file already chosen, if any. */
  fileName?: string;
  onSelect: (fileName: string | undefined) => void;
  disabled?: boolean;
}

/**
 * One-off schema JSON slot inside the "Upload schema JSON" radio card. Accepts a
 * drop or a click; the file is only named here, parsing happens server-side.
 */
const SchemaJsonDrop = React.forwardRef<HTMLDivElement, SchemaJsonDropProps>(
  ({ className, disabled, fileName, onSelect, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
      if (disabled) return;
      onSelect(files?.[0]?.name);
    };

    return (
      <div
        ref={ref}
        data-component="SchemaJsonDrop"
        data-state={fileName ? "filled" : "empty"}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
        {...props}
        className={cn(className)}
      >
        <input
          ref={inputRef}
          type="file"
          accept={SCHEMA_UPLOAD_ACCEPTED_EXTENSION}
          disabled={disabled}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
          className={cn(schemaJsonDropInputVariants())}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(schemaJsonDropVariants({ filled: Boolean(fileName) }))}
        >
          <span className={cn(schemaJsonDropNameVariants())}>
            {fileName ?? "Drop .json or browse"}
          </span>
        </button>
      </div>
    );
  },
);
SchemaJsonDrop.displayName = "SchemaJsonDrop";

export { SchemaJsonDrop };
