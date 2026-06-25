import { extractTextWithEasyOcr } from '../server/services/easyOcrService';
import { readFileSync } from 'node:fs';

(async () => {
  const b64 = readFileSync('/tmp/test_image_b64.txt', 'utf8').trim();
  const start = Date.now();
  try {
    const text = await extractTextWithEasyOcr([b64]);
    console.log('--- EasyOCR result (', Date.now() - start, 'ms ) ---');
    console.log(text);
    process.exit(0);
  } catch (e) {
    console.error('FAILED:', e);
    process.exit(1);
  }
})();
