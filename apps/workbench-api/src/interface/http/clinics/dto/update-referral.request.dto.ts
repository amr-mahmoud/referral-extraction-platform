export interface BoundingBoxDto {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface ExtractedFieldDto {
  value: string;
  pageNumber: number;
  boundingBox: BoundingBoxDto | null;
}

export interface UpdateReferralRequest {
  extractedPayload: ExtractedFieldDto[];
}
