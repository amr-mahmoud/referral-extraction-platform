"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { FieldBuilderModal } from "@/features/extraction-schemas/FieldBuilderModal";
import { SchemaSelector } from "@/features/extraction-schemas/SchemaSelector";
import { useFileDropzone } from "@/hooks/use-file-dropzone";
import { useSchemaSelection } from "@/hooks/use-schema-selection";
import { cn } from "@/lib/utils";
import { useCreateExtractionSchema } from "@/server-hooks/extraction-schemas/use-create-extraction-schema";
import { useCreateReferrals } from "@/server-hooks/referrals/use-create-referrals";
import type { SavedSchema } from "@/types/extraction-schemas/schema";

import { ReferralDropzone } from "../ReferralDropzone";
import { uploadWorkspaceVariants } from "./UploadWorkspace.styles";

export interface UploadWorkspaceProps extends React.HTMLAttributes<HTMLDivElement> {
  savedSchemas: readonly SavedSchema[];
}

/**
 * The upload row: files on the left, how to extract them on the right, one
 * submit. Holds the two hooks' state together because neither half can submit
 * alone — the action needs both the queued files and the schema choice. Also
 * owns the field-builder modal's open state, since confirming it is really
 * just another way to set the schema hook's selection.
 *
 * `savedSchemas` is a server-fetched prop (`getSavedSchemas` reading
 * `GET /extraction-schemas`) — the database is the only source of truth for
 * what's selectable. Publishing a new one (field builder or JSON upload)
 * calls `router.refresh()` so that list is re-fetched rather than
 * client-side-guessed at.
 */
const UploadWorkspace = React.forwardRef<HTMLDivElement, UploadWorkspaceProps>(
  ({ className, savedSchemas, ...props }, ref) => {
    const router = useRouter();
    const dropzone = useFileDropzone();
    const schema = useSchemaSelection(savedSchemas);
    const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);

    const publishSchema = useCreateExtractionSchema({
      onSuccess: (created) => {
        schema.confirmSavedSchema(created.id);
        setIsBuilderOpen(false);
        router.refresh();
      },
    });

    const upload = useCreateReferrals({
      onFileUploaded: (candidateId) => dropzone.removeCandidate(candidateId),
    });

    const fileCount = dropzone.accepted.length;

    const handleSubmit = () => {
      upload.execute({
        candidates: dropzone.accepted,
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
          fileStatus={upload.fileStatus}
        />

        <SchemaSelector
          savedSchemas={savedSchemas}
          source={schema.source}
          savedSchemaId={schema.savedSchemaId}
          onSourceChange={schema.setSource}
          onSavedSchemaChange={schema.setSavedSchemaId}
          onBuildFields={() => setIsBuilderOpen(true)}
          onSubmit={handleSubmit}
          fileCount={fileCount}
          phase={upload.phase}
          progressPercent={upload.progressPercent}
          hasErrors={upload.hasErrors}
          submitDisabled={fileCount === 0 || !schema.isComplete}
          error={upload.error}
        />

        {isBuilderOpen ? (
          <FieldBuilderModal
            isSaving={publishSchema.isLoading}
            saveError={publishSchema.error}
            onClose={() => setIsBuilderOpen(false)}
            onConfirm={(draft) => {
              publishSchema.execute({
                title: draft.title,
                fields: draft.fields.map((field) => ({
                  name: field.name,
                  description: field.description,
                })),
              });
            }}
            onSchemaUploaded={(uploaded) => {
              // Same outcome as a manually-built schema publishing
              // successfully: select it, close the modal, and refresh so it
              // also appears under "Saved schema" without a manual reload.
              schema.confirmSavedSchema(uploaded.id);
              setIsBuilderOpen(false);
              router.refresh();
            }}
          />
        ) : null}
      </div>
    );
  },
);
UploadWorkspace.displayName = "UploadWorkspace";

export { UploadWorkspace };
