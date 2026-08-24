"use client";

import type * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  isAcceptedCandidate,
  screenUploadCandidates,
  type AcceptedUploadCandidate,
  type UploadCandidate,
} from "@/managers/upload-candidate.manager";

/** Handlers the drop target spreads to receive dragged files. */
export interface DropzoneHandlers {
  onDragOver: React.DragEventHandler<HTMLElement>;
  onDragEnter: React.DragEventHandler<HTMLElement>;
  onDragLeave: React.DragEventHandler<HTMLElement>;
  onDrop: React.DragEventHandler<HTMLElement>;
}

/** Props the visually hidden `<input type="file">` spreads. */
export interface DropzoneInputProps {
  ref: React.RefObject<HTMLInputElement | null>;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

export interface UseFileDropzoneResult {
  /** True while a drag is hovering the zone, for the active border treatment. */
  isDragging: boolean;
  candidates: UploadCandidate[];
  accepted: AcceptedUploadCandidate[];
  /** Props to spread on the drop target. */
  dropzoneProps: DropzoneHandlers;
  /** Props to spread on the visually hidden `<input type="file">`. */
  inputProps: DropzoneInputProps;
  openFilePicker: () => void;
  removeCandidate: (id: string) => void;
  clear: () => void;
}

/**
 * Owns the browser side of dropping files: drag affordance, the hidden input,
 * and the running candidate list. Screening lives in the upload-candidate
 * manager — this hook decides *when* files arrive, never *whether* they qualify.
 *
 * Drag events nest, so enter/leave are counted rather than toggled: leaving a
 * child element would otherwise clear the active state while still inside.
 */
export function useFileDropzone(): UseFileDropzoneResult {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [candidates, setCandidates] = useState<UploadCandidate[]>([]);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const incoming = Array.from(files);
    setCandidates((current) => [
      ...current,
      ...screenUploadCandidates(incoming, current),
    ]);
  }, []);

  const onDragOver = useCallback<React.DragEventHandler<HTMLElement>>((event) => {
    event.preventDefault();
  }, []);

  const onDragEnter = useCallback<React.DragEventHandler<HTMLElement>>((event) => {
    event.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback<React.DragEventHandler<HTMLElement>>((event) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  }, []);

  const onDrop = useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      event.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);
      addFiles(event.dataTransfer.files);
    },
    [addFiles],
  );

  const onChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      addFiles(event.target.files);
      // Reset so re-picking the same file still fires `change`.
      event.target.value = "";
    },
    [addFiles],
  );

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const removeCandidate = useCallback((id: string) => {
    setCandidates((current) => current.filter((candidate) => candidate.id !== id));
  }, []);

  const clear = useCallback(() => setCandidates([]), []);

  const accepted = useMemo(
    () => candidates.filter(isAcceptedCandidate),
    [candidates],
  );

  return {
    isDragging,
    candidates,
    accepted,
    dropzoneProps: { onDragOver, onDragEnter, onDragLeave, onDrop },
    inputProps: { ref: inputRef, onChange },
    openFilePicker,
    removeCandidate,
    clear,
  };
}
