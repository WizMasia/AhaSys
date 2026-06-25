import { isEasyOcrAvailable } from '../server/services/easyOcrService';
import { extractTextFromImages } from '../server/services/llmService';
import { readFileSync } from 'node:fs';

(async () => {
  // Simulate Render: OCR_ENABLED=false
  process.env.OCR_ENABLED = 'false';
  console.log('OCR available?', isEasyOcrAvailable());

  const b64 = readFileSync('/tmp/test_image_b64.txt', 'utf8').trim();
  const text = await extractTextFromImages([b64]);
  console.log('extractTextFromImages result (should be empty):', JSON.stringify(text));
  process.exit(0);
})();
