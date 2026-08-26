"use client";

import { useState } from "react";

import type { ExtractedFieldView } from "@/types/referrals/referral";

export interface UseCustomAutoNavigatorExtractedFieldClickResult {
  /** Current PDF page number — owned here so navigation and selection stay in sync. */
  pageNumber: number;
  /** Setter for `pageNumber`, for manual page navigation (prev/next, load clamp). */
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
  /**
   * True when the selected field lives on the current page but has no spatial
   * source (`boundingBox === null`) — the viewer shows a hint instead of a
   * highlight.
   */
  isSelectedFieldOnCurrentPageWithoutSource: boolean;
}

/**
 * Owns the review viewer's page state and the "select field → jump to its page"
 * interaction.
 *
 * Navigation uses React's "adjusting state when a prop changes" pattern rather
 * than an effect: when `selectedFieldIndex` changes, jump during render. The
 * previous-index comparison fires exactly once per new selection — `key` isn't
 * guaranteed unique (the worker derives it from the LLM's `fieldName`), so the
 * index, not the key, is the gate. A same-field re-click keeps the index equal
 * and is left alone; `setPageNumber` bails out when the page hasn't changed,
 * so a same-page selection just recomputes the highlight immediately.
 */
export function useCustomAutoNavigatorExtractedFieldClick(
  selectedField: ExtractedFieldView | null,
  selectedFieldIndex: number | null,
): UseCustomAutoNavigatorExtractedFieldClickResult {
  const [pageNumber, setPageNumber] = useState(1);

  const [previousSelectedFieldIndex, setPreviousSelectedFieldIndex] = useState<
    number | null
  >(selectedFieldIndex);
  if (previousSelectedFieldIndex !== selectedFieldIndex) {
    setPreviousSelectedFieldIndex(selectedFieldIndex);
    if (selectedField && selectedFieldIndex !== null) {
      setPageNumber(selectedField.pageNumber);
    }
  }

  const isSelectedFieldOnCurrentPageWithoutSource =
    selectedField != null &&
    selectedField.pageNumber === pageNumber &&
    selectedField.boundingBox === null;

  return {
    pageNumber,
    setPageNumber,
    isSelectedFieldOnCurrentPageWithoutSource,
  };
}
