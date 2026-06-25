import assert from 'node:assert/strict';
import http from 'node:http';
import {
  performAnalysis,
  isProviderRateLimitError,
  ProviderRateLimitError,
  type VisionProbeFunction,
  type ImageTextExtractor,
} from '../server/services/llmService';
import { buildMarkdownReport } from '../src/utils/report';

const violatingInput = '이 화장품은 하루만에 여드름과 주름을 없앱니다. 원금 100% 보장, 월 수익률 10% 무위험 코인 투자.';
const compliantInput = '오늘의 일기를 씁니다. 날씨가 화창합니다.';

const listen = (server: http.Server): Promise<number> => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    if (address === null || typeof address === 'string') { reject(new Error('no port')); return; }
    resolve(address.port);
  });
});

const readBody = (req: http.IncomingMessage): Promise<string> => new Promise((resolve, reject) => {
  const chunks: Buffer[] = [];
  req.on('data', (c: Buffer) => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

const supportVision: VisionProbeFunction = async () => ({ kind: 'supported', reason: 'mocked catalog match' });
const rejectVision: VisionProbeFunction = async () => ({ kind: 'unsupported', reason: 'mocked non-vision adapter' });

const fakeOcrExtract: ImageTextExtractor = async (images) => {
  if (images.length === 0) return '';
  return `[mocked OCR for ${images.length} image(s)]\n[광고 문구 추출] 여드름 제거 화장품, 1일 효과 보장`;
};

const buildMockProvider = (): { server: http.Server; close: () => Promise<void> } => {
  let requestCount = 0;
  const server = http.createServer(async (req, res) => {
    requestCount += 1;
    if (req.url === '/v1/chat/completions') {
      const body = await readBody(req);
      const parsed = JSON.parse(body) as { messages?: Array<{ content: string }> };
      const systemMsg = parsed.messages?.find((m) => typeof m.content === 'string' && m.content.includes('RAG'))?.content ?? '';
      const includesOcr = systemMsg.includes('OCR');
      const payload = {
        id: `mock-${requestCount}`,
        object: 'chat.completion',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              score: includesOcr ? 70 : 80,
              overallStatus: '주의',
              parsedMeta: {
                productType: '화장품',
                regulatoryDomain: '화장품법',
                channels: '온라인몰',
                targets: '성인 여성',
              },
              violations: [{
                id: `v_mock_${requestCount}`,
                clause: '화장품법 제8조 (과대광고 금지)',
                severity: 'High',
                description: '효과 보장 문구 저촉',
                deductionPoints: 15,
                originalFragment: '여드름과 주름을 없앱니다',
                replacement: '피부 상태 개선에 도움을 줄 수 있습니다',
              }],
              agentsActivated: ['LEGAL', 'SOCIAL'],
              modelUsed: 'gpt-4o-mock',
            }),
          },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
        model: 'gpt-4o-mock',
      };
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'not found' } }));
  });
  return { server, close: () => new Promise((resolve) => server.close(() => resolve())) };
};

const callAnalyze = (endpoint: string, override: { forceOcrFallback?: boolean; visionProbe?: VisionProbeFunction; ocrExtractor?: ImageTextExtractor }) =>
  performAnalysis({
    text: violatingInput,
    imageB64: null,
    imagesB64: ['data:image/png;base64,iVBORw0KGgo='],
    adapterType: 'CUSTOM',
    customModel: 'gpt-4o',
    customEndpoint: endpoint,
    customApiKey: 'sk-mock',
    websiteUrl: null,
    additionalContext: '',
    analysisMode: 'full',
    globalApiKey: undefined,
    ...override,
  });

(async () => {
  const fails: string[] = [];
  const check = (label: string, fn: () => void): void => {
    try { fn(); console.log(`  PASS  ${label}`); } catch (e) { const m = e instanceof Error ? e.message : String(e); console.log(`  FAIL  ${label} - ${m}`); fails.push(`${label}: ${m}`); }
  };

  const provider = buildMockProvider();
  const port = await listen(provider.server);
  const endpoint = `http://127.0.0.1:${port}/v1`;

  try {
    console.log('# live e2e: vision probe says supported -> image processed directly');
    const direct = await callAnalyze(endpoint, { visionProbe: supportVision });
    check('uses the model the caller asked for', () => assert.equal(direct.modelUsed, 'gpt-4o'));
    check('does not trigger OCR fallback when vision is supported', () => assert.equal(direct.ocrFallbackUsed, false));
    check('returns a numeric score', () => assert.equal(typeof direct.score, 'number'));
    check('returns a violations array', () => assert.ok(Array.isArray(direct.violations)));
    check('lists the activated sub-agents when configured', () => assert.ok(Array.isArray(direct.agentsActivated)));

    console.log('# live e2e: vision probe says unsupported -> OCR fallback engages');
    const ocr = await callAnalyze(endpoint, { visionProbe: rejectVision, ocrExtractor: fakeOcrExtract, forceOcrFallback: true });
    check('flips ocrFallbackUsed to true', () => assert.equal(ocr.ocrFallbackUsed, true));
    check('captures the OCR notice', () => assert.ok(typeof ocr.ocrNotice === 'string' && ocr.ocrNotice.length > 0));
    check('captures the OCR extracted text', () => assert.ok(typeof ocr.ocrExtractedText === 'string' && ocr.ocrExtractedText.includes('여드름')));

    console.log('# live e2e: report.ts includes OCR section when ocrFallbackUsed is true');
    const report = buildMarkdownReport(ocr, 'gpt-4o');
    check('report contains the OCR fallback section header', () => assert.match(report, /OCR 텍스트 기반 이미지 검토 전환 안내/));
    check('report contains the OCR notice text', () => assert.ok(report.includes(ocr.ocrNotice ?? '')));
    check('report contains the OCR extracted text', () => assert.ok(report.includes(ocr.ocrExtractedText ?? '')));
    check('report contains the score', () => assert.match(report, /종합 안전 벌점/));
    check('report contains the violation count', () => assert.match(report, /세부 위법 제재 조항 검출/));

    console.log('# live e2e: compliant input produces a numeric score');
    const compliant = await performAnalysis({
      text: compliantInput,
      imageB64: null,
      imagesB64: [],
      adapterType: 'CUSTOM',
      customModel: 'gpt-4o',
      customEndpoint: endpoint,
      customApiKey: 'sk-mock',
      websiteUrl: null,
      additionalContext: '',
      analysisMode: 'full',
      globalApiKey: undefined,
    });
    check('compliant input has a numeric score', () => assert.equal(typeof compliant.score, 'number'));

    console.log('# live e2e: rate-limit cascade surfaces as ProviderRateLimitError');
    const rlProvider = http.createServer((req, res) => {
      if (req.url === '/v1/chat/completions') {
        res.writeHead(429, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'quota exceeded' } }));
        return;
      }
      res.writeHead(404); res.end();
    });
    const rlPort = await listen(rlProvider);
    try {
      await assert.rejects(
        callAnalyze(`http://127.0.0.1:${rlPort}/v1`, { visionProbe: supportVision }),
        (e: unknown) => isProviderRateLimitError(e) === true,
      );
      check('429 cascade is recognized as ProviderRateLimitError', () => assert.ok(true));
    } catch (e) {
      check('429 cascade is recognized as ProviderRateLimitError', () => { throw e; });
    } finally {
      await new Promise<void>((resolve) => rlProvider.close(() => resolve()));
    }

    check('ProviderRateLimitError carries code=QUOTA_EXCEEDED', () => assert.equal(new ProviderRateLimitError('boom').code, 'QUOTA_EXCEEDED'));
  } finally {
    await provider.close();
  }

  if (fails.length > 0) {
    console.log(`\n# RESULT: FAIL (${fails.length})`);
    for (const f of fails) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log('\n# RESULT: ALL GREEN');
})().catch((e) => { console.error('e2e crashed:', e); process.exit(1); });
