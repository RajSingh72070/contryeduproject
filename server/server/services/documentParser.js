import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Standardize text formatting by removing unnecessary spaces, tabs, and excess line breaks
 * @param {string} text
 * @returns {string} cleaned text
 */
export const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/[ \t]+/g, ' ')                  // compress horizontal spaces
    .replace(/\r\n/g, '\n')                  // standard LF line breaks
    .replace(/\n\s*\n/g, '\n\n')             // compress multiple empty lines to a double newline
    .trim();
};

/**
 * Parse document based on its extension type and extract text content
 * @param {string} filePath path to file on disk
 * @param {string} type extension type (PDF, DOCX, TXT)
 * @returns {Promise<string>} extracted clean text
 */
export const parseDocument = async (filePath, type) => {
  const upperType = type.toUpperCase();

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    let extractedRawText = '';

    if (upperType === 'TXT') {
      extractedRawText = await fs.promises.readFile(filePath, 'utf-8');
    } else if (upperType === 'PDF') {
      const dataBuffer = await fs.promises.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedRawText = pdfData.text;
    } else if (upperType === 'DOCX') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedRawText = result.value;
      // You can also capture warnings if needed: const warnings = result.warnings;
    } else {
      throw new Error(`Unsupported document parsing type: ${type}`);
    }

    return cleanText(extractedRawText);
  } catch (error) {
    console.error(`[DocumentParser Error] Failed to parse ${type} file:`, error);
    throw new Error(`Parsing failed for ${type} file: ${error.message}`);
  }
};
