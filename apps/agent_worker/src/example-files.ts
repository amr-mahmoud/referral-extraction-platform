import fs from 'fs';
import path from 'path';

export interface ExampleFileInfo {
  fileName: string;
  filePath: string;
  sizeBytes: number;
}

const EXAMPLES_DIR = path.resolve(__dirname, '../examples');

/**
 * Lists all available example medical referral PDF files in the examples directory.
 */
export function listExampleFiles(): ExampleFileInfo[] {
  if (!fs.existsSync(EXAMPLES_DIR)) {
    return [];
  }

  return fs
    .readdirSync(EXAMPLES_DIR)
    .filter((file) => file.toLowerCase().endsWith('.pdf'))
    .map((file) => {
      const filePath = path.join(EXAMPLES_DIR, file);
      const stat = fs.statSync(filePath);
      return {
        fileName: file,
        filePath,
        sizeBytes: stat.size,
      };
    });
}

/**
 * Loads the specified example PDF as a Base64 string for Gemini multimodal input.
 */
export function loadExamplePdf(fileName: string): {
  fileName: string;
  base64: string;
  buffer: Buffer;
  sizeBytes: number;
} {
  const filePath = path.isAbsolute(fileName)
    ? fileName
    : path.join(EXAMPLES_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    const available = listExampleFiles()
      .map((f) => ` - ${f.fileName}`)
      .join('\n');
    throw new Error(
      `Example file not found: "${fileName}".\nAvailable files in examples/:\n${available}`,
    );
  }

  const buffer = fs.readFileSync(filePath);
  return {
    fileName: path.basename(filePath),
    base64: buffer.toString('base64'),
    buffer,
    sizeBytes: buffer.length,
  };
}
