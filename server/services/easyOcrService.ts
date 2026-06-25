import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PYTHON = path.resolve(__dirname, '..', '..', '.venv-ocr', 'bin', 'python3.11');
const SCRIPT_PATH = path.resolve(__dirname, '..', '..', 'scripts', 'ocr_easyocr.py');
const OCR_TIMEOUT_MS = 60_000;

const resolvePythonBin = (): string => process.env.OCR_PYTHON_BIN || DEFAULT_PYTHON;

export const isEasyOcrAvailable = (): boolean => process.env.OCR_ENABLED !== 'false';

const runOcrScript = (imagePayloads: readonly string[]): Promise<string> => new Promise((resolve, reject) => {
  const child = spawn(resolvePythonBin(), [SCRIPT_PATH], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      EASYOCR_LANGS: process.env.EASYOCR_LANGS || 'ko,en',
      EASYOCR_GPU: process.env.EASYOCR_GPU || 'false',
    },
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8'); });
  child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8'); });

  const timeout = setTimeout(() => {
    child.kill('SIGKILL');
    reject(new Error(`EasyOCR script timed out after ${OCR_TIMEOUT_MS}ms`));
  }, OCR_TIMEOUT_MS);

  child.on('error', (err) => {
    clearTimeout(timeout);
    reject(err);
  });

  child.on('close', (code) => {
    clearTimeout(timeout);
    if (code !== 0) {
      reject(new Error(`EasyOCR script exited with code ${code}: ${stderr.trim() || 'no stderr'}`));
      return;
    }
    try {
      const parsed = JSON.parse(stdout) as { text?: string; error?: string };
      if (parsed.error) {
        reject(new Error(parsed.error));
        return;
      }
      resolve(parsed.text ?? '');
    } catch (err) {
      reject(new Error(`EasyOCR script returned non-JSON output: ${stdout.slice(0, 200)}`));
    }
  });

  const payload = JSON.stringify({ images: imagePayloads });
  child.stdin.write(payload);
  child.stdin.end();
});

export const extractTextWithEasyOcr = async (imagePayloads: readonly string[]): Promise<string> => {
  if (imagePayloads.length === 0) return '';
  return runOcrScript(imagePayloads);
};
