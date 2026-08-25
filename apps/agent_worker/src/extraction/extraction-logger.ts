import type {
  NormalizedExtractionResult,
  RawLlmOutput,
} from '../types/extraction.types';
import type { ReferralJobContext } from '../types/referral-job.types';

const LOG_PREFIX = '[Extraction]';

export function logExtractionResult(
  context: ReferralJobContext,
  rawOutput: RawLlmOutput,
  normalized: NormalizedExtractionResult,
): void {
  logRawModelOutput(context, rawOutput);
  logNormalizedOutput(context, normalized);
}

function logRawModelOutput(
  context: ReferralJobContext,
  rawOutput: RawLlmOutput,
): void {
  console.log(`${LOG_PREFIX} Raw model output for referral ${context.referralId}:`);
  console.log(`  isValidDocument: ${rawOutput.isValidDocument}`);
  if (rawOutput.rejectionReason) {
    console.log(`  rejectionReason: ${rawOutput.rejectionReason}`);
  }
  console.log(
    `  extractedFields (${rawOutput.extractedFields.length} fields returned):`,
  );
  rawOutput.extractedFields.forEach((field, index) => {
    const bbox = field.boundingBox
      ? `[${field.boundingBox.join(', ')}]`
      : 'null';
    console.log(
      `    ${(index + 1).toString().padStart(2, ' ')}. ${field.fieldName}: "${field.fieldValue}" | page=${field.pageNumber} | bbox=[ymin,xmin,ymax,xmax] ${bbox}`,
    );
  });
}

function logNormalizedOutput(
  context: ReferralJobContext,
  normalized: NormalizedExtractionResult,
): void {
  console.log(
    `${LOG_PREFIX} Normalized output for referral ${context.referralId}:`,
  );
  console.log(`  isValidDocument: ${normalized.isValidDocument}`);
  if (normalized.rejectionReason) {
    console.log(`  rejectionReason: ${normalized.rejectionReason}`);
  }
  console.log(`  patientName: ${normalized.patientName ?? 'null'}`);
  console.log(
    `  extractedFields (${normalized.extractedFields.length} fields persisted):`,
  );
  normalized.extractedFields.forEach((field, index) => {
    const bbox = field.boundingBox
      ? `{ xmin: ${field.boundingBox.xmin}, ymin: ${field.boundingBox.ymin}, xmax: ${field.boundingBox.xmax}, ymax: ${field.boundingBox.ymax} }`
      : 'null';
    console.log(
      `    ${(index + 1).toString().padStart(2, ' ')}. "${field.value}" | page=${field.pageNumber} | bbox=${bbox}`,
    );
  });
}
