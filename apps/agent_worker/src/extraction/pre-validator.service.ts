const PDF_MAGIC_HEADER = '%PDF-';
const MAX_PDF_BYTES = 20 * 1024 * 1024;

export interface PreValidationResult {
  isValid: boolean;
  reason?: string;
}

export function preValidatePdfBuffer(pdfBuffer: Buffer): PreValidationResult {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    return { isValid: false, reason: 'PDF buffer is empty' };
  }
  if (pdfBuffer.length > MAX_PDF_BYTES) {
    return { isValid: false, reason: 'PDF exceeds the 20MB size limit' };
  }

  const header = pdfBuffer.subarray(0, 5).toString('latin1');
  if (header !== PDF_MAGIC_HEADER) {
    return {
      isValid: false,
      reason: 'File does not start with the PDF magic header',
    };
  }

  return { isValid: true };
}
