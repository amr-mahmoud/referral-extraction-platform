import {
  ApiError,
  GoogleGenAI,
  type GenerateContentParameters,
  type GenerateContentResponse,
  type Schema,
} from '@google/genai';
import type { RawLlmOutput } from '../../types/extraction.types';

// Retry budget for a single extraction call. Capped low and fast on purpose:
// this worker now runs many concurrent lanes (see sqs-consumer.service.ts),
// so a burst of parallel Gemini calls can realistically trip a rate limit
// together. Three attempts with jittered exponential backoff absorbs a
// transient 429/5xx without materially risking the SQS visibility timeout
// (180s) — worst case here is under 25s of added latency, not tens of
// seconds per lane compounding into minutes.
const MAX_GEMINI_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 8000;

/** Rate-limited (429) or a transient server-side failure (5xx) — worth retrying. A 4xx other than 429 means our request itself is wrong and retrying won't help. */
function isRetryableGeminiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError && (error.status === 429 || error.status >= 500)
  );
}

/**
 * Exponential backoff with full jitter: the delay is a random value between
 * 0 and the exponential cap, not the cap itself. Without jitter, every lane
 * that got rate-limited by the same burst would retry at the exact same
 * instant and immediately trip the rate limit again together.
 */
function computeBackoffDelayMs(attempt: number): number {
  const exponentialDelayMs = BASE_RETRY_DELAY_MS * 2 ** attempt;
  return Math.random() * Math.min(exponentialDelayMs, MAX_RETRY_DELAY_MS);
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Framing + reading order. Weak models jump straight to pattern-matching the
 * first page; forcing an explicit read-then-decide-then-extract order measurably
 * reduces both over-rejection and first-page-only extraction.
 */
const PROMPT_ROLE_AND_TASK = `
You are an expert medical-records analyst extracting structured data from a
clinical referral document.

Work in this order, and do not skip a step:
  1. Read the ENTIRE document — every page, including headers, footers, form
     labels, stamps, signature blocks, and handwriting — before extracting.
  2. Decide whether it is genuinely a medical referral (DOCUMENT VALIDATION).
  3. Only if it is valid, extract the fields (FIELD EXTRACTION).
`.trim();

/**
 * Explicit accept/reject lists rather than "decide if this is a referral".
 * The failure mode being defended against is over-rejection: a weak model
 * reads a sparse or badly-scanned referral, finds few recognisable fields,
 * and concludes the document is not a referral at all.
 */
const PROMPT_DOCUMENT_VALIDATION_RULES = `
1. DOCUMENT VALIDATION
   ACCEPT (isValidDocument = true) when the document is a referral letter,
   consultation request, authorization or intake form, physician order, or any
   clinical document written about a specific patient — even if it is a poor
   scan, partly handwritten, or missing most fields.

   REJECT (isValidDocument = false) ONLY when the document is clearly not
   about a patient at all: invoices, receipts, marketing material, software or
   technical documents, contracts, resumes, or blank pages.

   A referral that is merely sparse is NOT a rejection. Accept it and omit the
   fields you cannot find.

   When rejecting: give a one-sentence rejectionReason naming what the
   document actually is, and return an empty extractedFields array.
   When accepting: set rejectionReason to null.
`.trim();

/**
 * The no-custom-schema path. The allowed field keys already reach the model
 * through the response schema's own `fieldName` description, so this block
 * deliberately does not re-list them — it supplies what the schema cannot:
 * where each value tends to sit on a real referral, the vocabulary documents
 * actually use, and the three disambiguation traps that account for most weak
 * model errors (two providers, several dates, several phone numbers).
 */
const DEFAULT_CLINICAL_EXTRACTION_PLAYBOOK = `
2. FIELD EXTRACTION — standard clinical referral
   Extract the standard referral fields named by the response schema's allowed
   field keys. A real document will rarely use those exact words, so match on
   MEANING, not wording. Use these cues:

   - patient_name — the person being referred, i.e. the subject of care.
     Usually labelled "Patient", "Name", "Re:", or sits in a demographics
     block at the top. NEVER a physician's name.
   - date_of_birth — labelled "DOB", "D.O.B.", "Birth Date", "Born". Always an
     actual birth date; never the referral, visit, or appointment date.
   - referring_provider — who is SENDING the patient: "Referred by",
     "Requesting Provider", "From:", the letterhead practice, or the signature
     block at the end of the letter.
   - referred_to — who is RECEIVING the patient: "Referred to", "To:",
     "Consultant", "Attn:", or a bare specialty such as Dermatology or
     Cardiology.
   - reason_for_referral — WHY the referral is being made: "Reason for
     Referral", "Chief Complaint", "Indication", or the narrative
     "I am referring this patient for…" sentence.
   - primary_diagnosis — the clinical condition ITSELF: "Diagnosis",
     "Impression", "Assessment", "Dx". Related to the reason but not the same
     thing; take each from its own source text.
   - icd_10_code — an alphanumeric code shaped as a letter, two digits, then
     an optional dot and further characters (e.g. "L57.0", "E11.9", "M54.5").
   - referral_date — the date the referral was written or signed, usually near
     the letterhead or beside the signature.
   - patient_phone — a phone number inside the PATIENT's demographics block,
     not the clinic's, practice's, or provider's number.

   Disambiguation — these three account for most extraction mistakes:
   - TWO PROVIDER NAMES almost always appear. Separate them by DIRECTION: the
     sender is referring_provider, the recipient is referred_to. If only one
     provider is identifiable, decide which role it plays and omit the other
     rather than filling both with the same name.
   - SEVERAL DATES almost always appear. Separate them by their LABEL, never
     by position on the page.
   - SEVERAL PHONE NUMBERS almost always appear. Separate them by WHOSE block
     the number sits in.
`.trim();

/**
 * The clinic-supplied-schema path: the clinic's own field list is authoritative,
 * so the guidance here is only about how to read it.
 */
function buildCustomSchemaExtractionSection(fieldInstructions: string): string {
  return `
2. FIELD EXTRACTION — clinic-specific schema
   Extract EXACTLY these field keys, and no others. Each line reads
   'key (label): what to extract'. The document will rarely use these exact
   words — match on meaning, not wording.

${fieldInstructions}
`.trim();
}

/**
 * Verbatim-copy rules. A weak model's instinct is to tidy what it reads —
 * reformatting dates, expanding abbreviations, "correcting" spellings — which
 * silently destroys the reviewer's ability to check a value against the page.
 */
const PROMPT_VALUE_TRANSCRIPTION_RULES = `
3. VALUE TRANSCRIPTION
   - Copy each value VERBATIM as it appears. Do not reformat dates, expand
     abbreviations, fix spelling, reorder names, or convert units.
   - Emit AT MOST ONE entry per field key. If a value appears more than once,
     use the clearest and most complete occurrence.
   - If a field is genuinely absent, OMIT it from extractedFields entirely.
     Never guess, never infer it from surrounding context, and never emit a
     placeholder such as "N/A", "unknown", "none", or an empty string.
   - Eight correct fields with one omitted is far better than nine where one
     is invented. Precision matters more than coverage.
`.trim();

/**
 * Coordinate contract. The origin and the tightness rule are both spelled out
 * because the review UI draws these boxes directly over the rendered page: a
 * box covering the whole line or table row is visibly wrong to the reviewer.
 */
const PROMPT_SPATIAL_GROUNDING_RULES = `
4. SPATIAL GROUNDING
   - pageNumber is 1-INDEXED: the first page of the PDF is page 1, not page 0.
   - boundingBox is {xmin, ymin, xmax, ymax}, each between 0 and 1000,
     measured on the page that value appears on, with the ORIGIN AT THE
     TOP-LEFT: xmin/xmax run left to right, ymin/ymax run top to bottom.
   - The box must tightly enclose ONLY the extracted value text — not its
     label, and not the whole line or table row it sits in.
   - Set boundingBox to null when you cannot locate the value precisely. A
     null box is perfectly acceptable; a wrong box is not.
`.trim();

export class GeminiClient {
  private readonly ai: GoogleGenAI;

  public constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * `fieldInstructions` is null when the clinic supplied no custom extraction
   * schema — the "default LLM auto-extract" path — in which case the prompt
   * carries the standard clinical referral playbook instead of a caller-built
   * field list.
   */
  public async extractReferralData(
    pdfBuffer: Buffer,
    responseSchema: Schema,
    fieldInstructions: string | null,
  ): Promise<RawLlmOutput> {
    const result = await this.generateContentWithRetry({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBuffer.toString('base64'),
              },
            },
            {
              text: this.buildPrompt(fieldInstructions),
            },
          ],
        },
      ],
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const rawText = result.text;
    if (!rawText || rawText.trim() === '') {
      throw new Error('Gemini returned an empty response');
    }
    return JSON.parse(rawText) as RawLlmOutput;
  }

  /**
   * Wraps `generateContent` with retry-on-429/5xx. Every other error
   * (malformed request, auth failure, quota exhausted permanently) is
   * rethrown immediately on the first attempt — retrying those wastes time
   * without any chance of succeeding.
   */
  private async generateContentWithRetry(
    params: GenerateContentParameters,
  ): Promise<GenerateContentResponse> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.ai.models.generateContent(params);
      } catch (error) {
        if (
          !isRetryableGeminiError(error) ||
          attempt >= MAX_GEMINI_ATTEMPTS - 1
        ) {
          throw error;
        }
        const delayMs = computeBackoffDelayMs(attempt);
        console.warn(
          `[Gemini] Retryable error (status ${error.status}) on attempt ${attempt + 1}/${MAX_GEMINI_ATTEMPTS}; retrying in ${Math.round(delayMs)}ms`,
        );
        await sleep(delayMs);
      }
    }
  }

  private buildPrompt(fieldInstructions: string | null): string {
    return [
      PROMPT_ROLE_AND_TASK,
      PROMPT_DOCUMENT_VALIDATION_RULES,
      fieldInstructions === null
        ? DEFAULT_CLINICAL_EXTRACTION_PLAYBOOK
        : buildCustomSchemaExtractionSection(fieldInstructions),
      PROMPT_VALUE_TRANSCRIPTION_RULES,
      PROMPT_SPATIAL_GROUNDING_RULES,
    ].join('\n\n');
  }
}
