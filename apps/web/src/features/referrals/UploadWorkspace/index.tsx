"use client";

import * as React from "react";

import { SchemaSelector } from "@/features/extraction-schemas/SchemaSelector";
import { useFileDropzone } from "@/hooks/use-file-dropzone";
import { useSchemaSelection } from "@/hooks/use-schema-selection";
import { cn } from "@/lib/utils";
import { useCreateReferrals } from "@/server-hooks/referrals/use-create-referrals";
import type { SavedSchema } from "@/types/extraction-schemas/schema";

import { ReferralDropzone } from "../ReferralDropzone";
import { uploadWorkspaceVariants } from "./UploadWorkspace.styles";

export interface UploadWorkspaceProps
  extends React.HTMLAttributes<HTMLDivElement> {
  savedSchemas: readonly SavedSchema[];
  /** Opens the in-app field builder (screen 2a) — not wired yet. */
  onBuildFields?: () => void;
}

/**
 * The upload row: files on the left, how to extract them on the right, one
 * submit. Holds the two hooks' state together because neither half can submit
 * alone — the action needs both the queued files and the schema choice.
 */
const UploadWorkspace = React.forwardRef<HTMLDivElement, UploadWorkspaceProps>(
  ({ className, onBuildFields, savedSchemas, ...props }, ref) => {
    const dropzone = useFileDropzone();
    const schema = useSchemaSelection(savedSchemas);

    const upload = useCreateReferrals({
      onSuccess: () => dropzone.clear(),
    });

    const fileCount = dropzone.accepted.length;

    const handleSubmit = () => {
      upload.execute({
        fileNames: dropzone.accepted.map((candidate) => candidate.name),
        schema: schema.selection,
      });
    };

    return (
      <div
        ref={ref}
        data-component="UploadWorkspace"
        {...props}
        className={cn(uploadWorkspaceVariants({ className }))}
      >
        <ReferralDropzone
          isDragging={dropzone.isDragging}
          candidates={dropzone.candidates}
          dropzoneProps={dropzone.dropzoneProps}
          inputProps={dropzone.inputProps}
          onBrowse={dropzone.openFilePicker}
          onRemoveCandidate={dropzone.removeCandidate}
          disabled={upload.isLoading}
        />

        <SchemaSelector
          savedSchemas={savedSchemas}
          source={schema.source}
          savedSchemaId={schema.savedSchemaId}
          schemaFileName={schema.schemaFileName}
          onSourceChange={schema.setSource}
          onSavedSchemaChange={schema.setSavedSchemaId}
          onSchemaFileChange={schema.setSchemaFileName}
          onBuildFields={onBuildFields}
          onSubmit={handleSubmit}
          fileCount={fileCount}
          isSubmitting={upload.isLoading}
          submitDisabled={fileCount === 0 || !schema.isComplete}
          error={upload.error}
        />
      </div>
    );
  },
);
UploadWorkspace.displayName = "UploadWorkspace";

export { UploadWorkspace };
