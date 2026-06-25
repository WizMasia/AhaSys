import { performAnalysis } from '../server/services/llmService';
import { readFileSync } from 'node:fs';
import type { VisionProbeFunction } from '../server/services/llmService';

const rejectVision: VisionProbeFunction = async () => ({ kind: 'unsupported', reason: 'mocked non-vision adapter for OCR test' });

(async () => {
  const b64 = readFileSync('/tmp/tragedy_b64.txt', 'utf8').trim();
  // Use analyzeQuotaCascade-style minimal mock provider so we can call performAnalysis
  // without a real Gemini key. The 429 cascade test does the same.
  const http = await import('node:http');
  const provider = http.createServer((req, res) => {
    if (req.url === '/v1/chat/completions') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        id: 'mock',
        object: 'chat.completion',
        choices: [{
          index: 0,
          message: { role: 'assistant', content: JSON.stringify({
            score: 50,
            overallStatus: '위반',
            parsedMeta: {
              productType: '텀블러',
              regulatoryDomain: '표시광고법',
              channels: '온라인몰',
              targets: '일반 소비자',
            },
            violations: [],
            agentsActivated: ['LEGAL', 'SOCIAL'],
            modelUsed: 'mock-non-vision',
          }) },
          finish_reason: 'stop',
        }],
        model: 'mock-non-vision',
      }));
      return;
    }
    res.writeHead(404); res.end();
  });
  await new Promise<void>((r) => provider.listen(0, '127.0.0.1', () => r()));
  const addr = provider.address();
  if (!addr || typeof addr === 'string') throw new Error('no port');
  const endpoint = `http://127.0.0.1:${addr.port}/v1`;

  try {
    const start = Date.now();
    const result = await performAnalysis({
      text: '',
      imageB64: null,
      imagesB64: [b64],
      adapterType: 'CUSTOM',
      customModel: 'mock-non-vision',
      customEndpoint: endpoint,
      customApiKey: 'sk-mock',
      websiteUrl: null,
      additionalContext: '',
      analysisMode: 'full',
      globalApiKey: undefined,
      visionProbe: rejectVision,
      forceOcrFallback: true,
    });
    console.log('--- analyze result (', Date.now() - start, 'ms ) ---');
    console.log('modelUsed:', result.modelUsed);
    console.log('agentsActivated:', result.agentsActivated);
    console.log('ocrFallbackUsed:', result.ocrFallbackUsed);
    console.log('ocrNotice:', result.ocrNotice?.slice(0, 200));
    console.log('ocrExtractedText (first 400 chars):', (result.ocrExtractedText ?? '').slice(0, 400));
    console.log('score:', result.score);
    console.log('violations:', result.violations.length);
    process.exit(0);
  } catch (e) {
    console.error('FAILED:', e);
    process.exit(1);
  } finally {
    provider.close();
  }
})();
