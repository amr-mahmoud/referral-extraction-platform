export interface NormalizedBoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface RawExtractedField {
  fieldName: string;
  fieldValue: string;
  pageNumber: number;
  boundingBox: NormalizedBoundingBox | null;
}

export interface RawLlmOutput {
  isValidDocument: boolean;
  rejectionReason: string | null;
  extractedFields: RawExtractedField[];
}

export interface ExtractedFieldPayload {
  value: string;
  pageNumber: number;
  boundingBox: NormalizedBoundingBox | null;
}

export interface NormalizedExtractionResult {
  isValidDocument: boolean;
  rejectionReason: string | null;
  extractedFields: ExtractedFieldPayload[];
  patientName: string | null;
}
