"use client";

import { forwardRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { scaleNormalizedBoundingBoxToPixelRect } from "@/managers/bounding-box.manager";
import { cn } from "@/lib/utils";
import { useCustomAutoNavigatorExtractedFieldClick } from "@/hooks/use-custom-auto-navigator-extracted-field-click";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/shared/Icon";
import {
  type ExtractedFieldView,
  type ReferralDetailView,
} from "@/types/referrals/referral";

import {
  pdfViewerHighlightVariants,
  pdfViewerIconButtonVariants,
  pdfViewerNoSourceVariants,
  pdfViewerPageWrapVariants,
  pdfViewerPlaceholderHintVariants,
  pdfViewerPlaceholderTitleVariants,
  pdfViewerPlaceholderVariants,
  pdfViewerStageVariants,
  pdfViewerToolbarGroupVariants,
  pdfViewerToolbarVariants,
  pdfViewerVariants,
  pdfViewerZoomLabelVariants,
} from "./PdfViewer.styles";

// Turbopack can't resolve the `new URL('pdfjs-dist/...', import.meta.url)`
// worker entry that react-pdf recommends, so the worker is committed as a
// static asset (apps/web/public/pdf.worker.min.mjs) and referenced by plain
// string. This module is loaded via `next/dynamic({ ssr: false })`, so the
// assignment only ever runs in the browser.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const ZOOM_STEP = 1.25;

export interface PdfViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  referral: ReferralDetailView;
  selectedField: ExtractedFieldView | null;
  selectedFieldIndex: number | null;
  removeHighlightSelection: () => void;
}

interface RenderedPageSize {
  width: number;
  height: number;
}

/**
 * Left-hand pane of the review screen (wireframe 1e): the source PDF with
 * page navigation and zoom, plus a custom absolutely-positioned highlight
 * overlay driven by the selected field's normalized bounding box (see
 * `bounding-box.manager.ts`). The overlay is deliberately NOT pdf.js's built-in
 * text layer — it is pure pixel math against the rendered canvas size read from
 * `onRenderSuccess`.
 */
const PdfViewer = forwardRef<HTMLDivElement, PdfViewerProps>(
  (
    {
      className,
      referral,
      removeHighlightSelection,
      selectedField,
      selectedFieldIndex,
      ...props
    },
    ref,
  ) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [scale, setScale] = useState(1);
    const [renderedPageSize, setRenderedPageSize] =
      useState<RenderedPageSize | null>(null);

    // Selection → page auto-jump, page state, and the "no source on this page"
    // hint live in a dedicated hook so the interaction stays reusable.
    const {
      pageNumber,
      setPageNumber,
      isSelectedFieldOnCurrentPageWithoutSource,
    } = useCustomAutoNavigatorExtractedFieldClick(
      selectedField,
      selectedFieldIndex,
    );

    const highlightRect =
      selectedField?.boundingBox && renderedPageSize
        ? scaleNormalizedBoundingBoxToPixelRect(
            selectedField.boundingBox,
            renderedPageSize.width,
            renderedPageSize.height,
          )
        : null;

    const zoomIn = () =>
      setScale((current) => Math.min(MAX_SCALE, current * ZOOM_STEP));
    const zoomOut = () =>
      setScale((current) => Math.max(MIN_SCALE, current / ZOOM_STEP));

    const goToPreviousPage = () => {
      removeHighlightSelection();
      setPageNumber((current) => Math.max(1, current - 1));
    };

    const goToNextPage = () => {
      removeHighlightSelection();
      setPageNumber((current) =>
        numPages === null ? current : Math.min(numPages, current + 1),
      );
    };

    return (
      <div
        ref={ref}
        data-component="PdfViewer"
        data-status={referral.status}
        {...props}
        className={cn(pdfViewerVariants({ className }))}
      >
        <div className={cn(pdfViewerToolbarVariants())}>
          <div className={cn(pdfViewerToolbarGroupVariants())}>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={zoomOut}
              disabled={scale <= MIN_SCALE}
              className={cn(pdfViewerIconButtonVariants())}
            >
              <ZoomOutIcon size="sm" />
            </button>
            <span className={cn(pdfViewerZoomLabelVariants())}>
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE}
              className={cn(pdfViewerIconButtonVariants())}
            >
              <ZoomInIcon size="sm" />
            </button>
          </div>

          <div className={cn(pdfViewerToolbarGroupVariants())}>
            <button
              type="button"
              aria-label="Previous page"
              onClick={goToPreviousPage}
              disabled={pageNumber <= 1}
              className={cn(pdfViewerIconButtonVariants())}
            >
              <ChevronLeftIcon size="sm" />
            </button>
            <span className="tabular-nums">
              Page {pageNumber}
              {numPages !== null ? ` of ${numPages}` : ""}
            </span>
            <button
              type="button"
              aria-label="Next page"
              onClick={goToNextPage}
              disabled={numPages === null || pageNumber >= numPages}
              className={cn(pdfViewerIconButtonVariants())}
            >
              <ChevronRightIcon size="sm" />
            </button>
          </div>
        </div>

        <div className={cn(pdfViewerStageVariants())}>
          {isSelectedFieldOnCurrentPageWithoutSource ? (
            <div className={cn(pdfViewerNoSourceVariants())}>
              No source location was extracted for this field.
            </div>
          ) : null}
          <Document
            file={referral.documentUrl}
            onLoadSuccess={(pdf) => {
              setNumPages(pdf.numPages);
              setPageNumber((current) => Math.min(current, pdf.numPages));
            }}
            onLoadError={() => setNumPages(null)}
            loading={
              <div className={cn(pdfViewerPlaceholderVariants())}>
                <p className={cn(pdfViewerPlaceholderTitleVariants())}>
                  Loading PDF…
                </p>
              </div>
            }
            error={
              <div className={cn(pdfViewerPlaceholderVariants())}>
                <p className={cn(pdfViewerPlaceholderTitleVariants())}>
                  Couldn’t load the document
                </p>
                <p className={cn(pdfViewerPlaceholderHintVariants())}>
                  The presigned link may have expired — head back and reopen it.
                </p>
              </div>
            }
          >
            <div className={cn(pdfViewerPageWrapVariants())}>
              <Page
                pageNumber={pageNumber}
                scale={scale}
                onRenderSuccess={(page) =>
                  setRenderedPageSize({
                    width: page.width,
                    height: page.height,
                  })
                }
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              {highlightRect ? (
                <span
                  aria-hidden
                  data-component="PdfHighlight"
                  className={cn(pdfViewerHighlightVariants())}
                  style={{
                    left: highlightRect.x - 4,
                    top: highlightRect.y - 4,
                    width: highlightRect.width + 10,
                    height: highlightRect.height + 8,
                  }}
                />
              ) : null}
            </div>
          </Document>
        </div>
      </div>
    );
  },
);
PdfViewer.displayName = "PdfViewer";

export { PdfViewer };
