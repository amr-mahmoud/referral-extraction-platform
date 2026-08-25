import { GoogleGenAI, type Schema } from '@google/genai';
import type { RawLlmOutput } from '../../types/extraction.types';

export class GeminiClient {
  private readonly ai: GoogleGenAI;

  public constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  public async extractReferralData(
    pdfBuffer: Buffer,
    responseSchema: Schema,
    fieldInstructions: string,
  ): Promise<RawLlmOutput> {
    const result = await this.ai.models.generateContent({
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

  private buildPrompt(fieldInstructions: string): string {
    return `
You are an expert medical documents analyst.
Analyze the attached medical referral PDF document and extract structured clinical data.

CRITICAL RULES:
1. DOCUMENT VALIDATION:
   - Determine if the document is genuinely a medical referral or clinical document.
   - If NOT: set 'isValidDocument' to false, describe 'rejectionReason', and leave 'extractedFields' empty.
   - If YES: set 'isValidDocument' to true, 'rejectionReason' to null, and extract the fields below.

2. FIELD EXTRACTION:
   Use EXACTLY the following field keys (each 'key (label)' describes the value to extract):
${fieldInstructions}

3. SPATIAL GROUNDING:
   - For every extracted field, provide the normalized bounding box [ymin, xmin, ymax, xmax] between 0 and 1000.
   - Provide the 1-indexed pageNumber where the value appears (page 1 = first page).
   - If you cannot determine a field's location, leave its boundingBox null rather than guessing.
`;
  }
}
