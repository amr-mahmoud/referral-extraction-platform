import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { listExampleFiles, loadExamplePdf } from './example-files';

// Load environment variables from local or root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * =========================================================================
 * ⚙️ CONFIGURATION: Specify the default example file to test here
 * =========================================================================
 * Available options in apps/agent_worker/examples/:
 *  - "Eve Brown.pdf"
 *  - "Linda Carter (2).pdf"
 *  - "Magdalena Sullivan (2).pdf"
 *  - "Patricia Henderson (3).pdf"
 */
const DEFAULT_TEST_FILE = 'Eve Brown.pdf';

interface ExtractedFieldResult {
  fieldName: string;
  fieldValue: string;
  pageNumber: number;
  boundingBox: [number, number, number, number] | null;
}

interface ExtractionResponse {
  isValidDocument: boolean;
  rejectionReason: string | null;
  extractedFields: ExtractedFieldResult[];
}

export async function runExtractionOnExampleFile(targetFileName?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.error('❌ Error: GEMINI_API_KEY is not set in environment or .env file.');
    process.exit(1);
  }

  // 1. Determine target file
  const chosenFile =
    targetFileName ||
    process.env.EXAMPLE_FILE ||
    process.argv[2] ||
    DEFAULT_TEST_FILE;

  console.log('\n=================================================================');
  console.log('🤖 PLENA REFERRAL EXTRACTION AGENT - SINGLE TEST RUN');
  console.log('=================================================================');

  const availableFiles = listExampleFiles();
  console.log('\n📂 Available Example Files:');
  availableFiles.forEach((file, index) => {
    const isSelected = file.fileName === chosenFile;
    const marker = isSelected ? '👉 [SELECTED]' : '  ';
    const sizeKb = (file.sizeBytes / 1024).toFixed(1);
    console.log(`  ${marker} ${index + 1}. ${file.fileName} (${sizeKb} KB)`);
  });

  if (process.argv.includes('--list-only')) {
    return null;
  }

  console.log(`\n⏳ Loading target document: "${chosenFile}"...`);
  const fileData = loadExamplePdf(chosenFile);
  console.log(`✅ Loaded PDF (${(fileData.sizeBytes / 1024 / 1024).toFixed(2)} MB)`);

  // 2. Initialize Gemini Client
  const ai = new GoogleGenAI({ apiKey });

  console.log('🚀 Calling Gemini 2.5 Flash with multimodal PDF extraction prompt...');
  const startTime = Date.now();

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      isValidDocument: {
        type: Type.BOOLEAN,
        description: 'True if the document is a medical referral or clinical note. False if irrelevant.',
      },
      rejectionReason: {
        type: Type.STRING,
        description: 'Explanation if the document is rejected. Null if valid.',
        nullable: true,
      },
      extractedFields: {
        type: Type.ARRAY,
        description: 'Extracted medical referral fields and spatial grounding coordinates.',
        items: {
          type: Type.OBJECT,
          properties: {
            fieldName: {
              type: Type.STRING,
              description: 'Standard clinical field name (e.g. Patient Name, DOB, Referring Provider, ICD-10, Diagnosis, Reason for Referral).',
            },
            fieldValue: {
              type: Type.STRING,
              description: 'The exact extracted value from the document text.',
            },
            pageNumber: {
              type: Type.INTEGER,
              description: '0-indexed page number where the field was found.',
            },
            boundingBox: {
              type: Type.ARRAY,
              description: 'Normalized bounding box [ymin, xmin, ymax, xmax] between 0 and 1000.',
              items: { type: Type.NUMBER },
              nullable: true,
            },
          },
          required: ['fieldName', 'fieldValue', 'pageNumber'],
        },
      },
    },
    required: ['isValidDocument', 'extractedFields'],
  };

  const prompt = `
You are an expert medical documents analyst.
Analyze the attached medical referral PDF document and extract structured clinical data.

CRITICAL RULES:
1. DOCUMENT VALIDATION:
   - Determine if the document is genuinely a medical referral or clinical document.
   - If NOT: set 'isValidDocument' to false, describe 'rejectionReason', and leave 'extractedFields' empty.
   - If YES: set 'isValidDocument' to true, 'rejectionReason' to null, and extract key clinical fields.

2. KEY FIELDS TO EXTRACT:
   - Patient Name
   - Date of Birth (DOB)
   - Referring Physician / Provider
   - Referred To / Specialty / Practice
   - Reason for Referral / Clinical Summary
   - Primary Diagnosis / ICD-10 Code
   - Patient Phone / Contact
   - Referral Date

3. SPATIAL GROUNDING:
   - Provide accurate normalized bounding box coordinates [ymin, xmin, ymax, xmax] between 0 and 1000 for each field where located.
   - Provide the 0-indexed pageNumber where the value appears.
`;

  try {
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: fileData.base64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        temperature: 0.0,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ Extraction completed in ${elapsedSec}s!\n`);

    const rawText = result.text || '{}';
    const parsed: ExtractionResponse = JSON.parse(rawText);

    // 3. Display formatted extraction results
    console.log('=================================================================');
    console.log('📋 EXTRACTION RESULTS');
    console.log('=================================================================');
    console.log(`📄 Document:          ${chosenFile}`);
    console.log(`✅ Is Valid Referral: ${parsed.isValidDocument ? 'YES' : 'NO'}`);
    if (parsed.rejectionReason) {
      console.log(`⚠️ Rejection Reason:  ${parsed.rejectionReason}`);
    }

    console.log(`\n📊 Extracted Fields (${parsed.extractedFields.length} fields found):`);
    console.log('-----------------------------------------------------------------');

    parsed.extractedFields.forEach((field, i) => {
      const bboxStr = field.boundingBox
        ? `[${field.boundingBox.join(', ')}]`
        : 'None (unanchored)';
      console.log(`${(i + 1).toString().padStart(2, ' ')}. ${field.fieldName.padEnd(25, ' ')} : "${field.fieldValue}"`);
      console.log(`    📍 Page: ${field.pageNumber} | Box: ${bboxStr}`);
    });

    console.log('-----------------------------------------------------------------');
    console.log('\n📦 Full JSON Output:');
    console.log(JSON.stringify(parsed, null, 2));
    console.log('=================================================================\n');

    return parsed;
  } catch (error) {
    console.error('❌ Extraction failed with error:', error);
    throw error;
  }
}

// Direct CLI execution
if (require.main === module) {
  runExtractionOnExampleFile().catch(() => process.exit(1));
}
