import { LlmAgent, Gemini } from '@google/adk';
import { Schema, Type } from '@google/genai';

/**
 * Initializes and configures the Plena Extraction Agent.
 */
export function createExtractionAgent() {
  const model = new Gemini({
    model: process.env.GEMINI_MODEL,
    apiKey: process.env.GEMINI_API_KEY,
  });

  // Define a strict structure that allows flexible content
  const outputSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      isValidDocument: {
        type: Type.BOOLEAN,
        description:
          'True if the document is genuinely a medical referral or clinical document.',
      },
      rejectionReason: {
        type: Type.STRING,
        description:
          'If isValidDocument is false, explain exactly why it was rejected. Null if valid.',
        nullable: true,
      },
      extractedFields: {
        type: Type.ARRAY,
        description: 'The extracted medical fields and their spatial data.',
        items: {
          type: Type.OBJECT,
          properties: {
            fieldName: {
              type: Type.STRING,
              description:
                "The name of the field (e.g., 'Patient Name', 'Referring Provider', 'ICD-10 Code').",
            },
            fieldValue: {
              type: Type.STRING,
              description: 'The extracted value directly from the document.',
            },
            boundingBox: {
              type: Type.ARRAY,
              description:
                'Spatial coordinates [ymin, xmin, ymax, xmax] normalized between 0 and 1000.',
              items: { type: Type.NUMBER },
              minItems: '4',
              maxItems: '4',
            },
            pageNumber: {
              type: Type.INTEGER,
              description:
                'The 0-indexed page number where the data was found.',
            },
          },
          required: ['fieldName', 'fieldValue', 'boundingBox', 'pageNumber'],
        },
      },
    },
    required: ['isValidDocument', 'extractedFields'],
  };

  const agent = new LlmAgent({
    name: 'plena-referral-extractor',
    description:
      'Expert medical document parser that extracts structured clinical data, validates documents, and returns bounding boxes.',
    model: model,
    generateContentConfig: {
      temperature: 0.0, // Strict deterministic output
    },
    instruction: `
      You are an expert medical documents analyst. 
      Your task is to analyze the provided document and extract structured medical referral data.

      CRITICAL INSTRUCTIONS:
      1. DOCUMENT VALIDATION: 
         First, evaluate the document. Is it genuinely a medical referral, clinical note, or relevant medical document? 
         - If NO: Set 'isValidDocument' to false, provide a clear 'rejectionReason' (e.g., "Document is a restaurant menu"), and return an empty 'extractedFields' array.
         - If YES: Set 'isValidDocument' to true, leave 'rejectionReason' null, and proceed to extraction.
      
      2. EXTRACTION LOGIC:
         - If the user provides a specific list of required fields in the prompt, extract EXACTLY those fields.
         - If NO specific fields are provided, act as a medical documents expert and automatically determine the most valuable fields for a referral (e.g., Patient Name, DOB, Referring Provider, Target Provider, Diagnosis, ICD-10, Reason for Referral, Urgency).
         
      3. SPATIAL GROUNDING:
         - For every extracted field, you MUST provide the spatial bounding box coordinates indicating where the text was found on the page.
         - Format the bounding box as [ymin, xmin, ymax, xmax] normalized between 0 and 1000.
         - Include the page_number (0-indexed) where the data was found.
    `,
    outputSchema: outputSchema,
  });

  return agent;
}
