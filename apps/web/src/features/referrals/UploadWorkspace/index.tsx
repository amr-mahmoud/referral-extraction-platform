"use client";

import * as React from "react";

import { FieldBuilderModal } from "@/features/extraction-schemas/FieldBuilderModal";
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
}

/**
 * The upload row: files on the left, how to extract them on the right, one
 * submit. Holds the two hooks' state together because neither half can submit
 * alone — the action needs both the queued files and the schema choice. Also
 * owns the field-builder modal's open state, since confirming it is really
 * just another way to set the schema hook's selection.
 */
const UploadWorkspace = React.forwardRef<HTMLDivElement, UploadWorkspaceProps>(
  ({ className, savedSchemas, ...props }, ref) => {
    const dropzone = useFileDropzone();
    const schema = useSchemaSelection(savedSchemas);
    const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);

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
          customFieldCount={schema.customFields.length}
          onSourceChange={schema.setSource}
          onSavedSchemaChange={schema.setSavedSchemaId}
          onSchemaFileChange={schema.setSchemaFileName}
          onBuildFields={() => setIsBuilderOpen(true)}
          onSubmit={handleSubmit}
          fileCount={fileCount}
          isSubmitting={upload.isLoading}
          submitDisabled={fileCount === 0 || !schema.isComplete}
          error={upload.error}
        />

        {isBuilderOpen ? (
          <FieldBuilderModal
            initialFields={schema.customFields}
            onClose={() => setIsBuilderOpen(false)}
            onConfirm={(fields) => {
              // The modal's "save as reusable schema" toggle has nowhere to
              // persist to yet — the WorkBench API has no "create extraction
              // schema" endpoint. The fields still take effect for this
              // upload; wire the toggle to a real save once that exists.
              schema.confirmCustomFields(fields);
              setIsBuilderOpen(false);
            }}
          />
        ) : null}
      </div>
    );
  },
);
UploadWorkspace.displayName = "UploadWorkspace";

export { UploadWorkspace };
