import type { BoundingBox } from "@/types/referrals/referral";

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const NORMALIZED_SCALE = 1000;

/**
 * Scales a normalized 0–1000 bounding box (top-left origin) to the actual
 * rendered PDF page size in CSS pixels. The rendered dimensions are read from
 * react-pdf's `onRenderSuccess` callback — this is the single place the two
 * coordinate systems meet, so it stays a pure, unit-testable function.
 */
export function scaleNormalizedBoundingBoxToPixelRect(
  box: BoundingBox,
  renderedPageWidth: number,
  renderedPageHeight: number,
): PixelRect {
  if (renderedPageWidth <= 0 || renderedPageHeight <= 0) {
    throw new Error(
      "Cannot scale a bounding box against a non-positive rendered page size",
    );
  }

  const x = (box.xmin / NORMALIZED_SCALE) * renderedPageWidth;
  const y = (box.ymin / NORMALIZED_SCALE) * renderedPageHeight;
  const width = ((box.xmax - box.xmin) / NORMALIZED_SCALE) * renderedPageWidth;
  const height =
    ((box.ymax - box.ymin) / NORMALIZED_SCALE) * renderedPageHeight;

  return { x, y, width, height };
}
