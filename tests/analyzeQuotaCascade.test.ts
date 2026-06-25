import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import express from 'express';
import apiRouter from '../server/routes/api';
import { performAnalysis } from '../server/services/llmService';
import {
  buildCleanAnalysisResponse,
  buildRouteResponse,
  close,
  isVisionProbeRequest,
  listen,
  readJsonObject,
  readRequestBody,
} from './helpers/analyzeTestHelpers';

test('analyze returns provider 429 without cascading into full review fan-out', async () => {
  let providerRequestCount = 0;
  const providerServer = http.createServer((req, res) => {
    if (req.url === '/v1/chat/completions') {
      providerRequestCount += 1;
      res.writeHead(429, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'quota exceeded' } }));
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'not found' } }));
  });

  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use('/api', apiRouter);
  const appServer = http.createServer(app);

  const providerPort = await listen(providerServer);
  const appPort = await listen(appServer);

  try {
    const response = await fetch(`http://127.0.0.1:${appPort}/api/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: '비포 애프터 효과를 즉시 보장하는 광고',
        adapterType: 'CUSTOM',
        customEndpoint: `http://127.0.0.1:${providerPort}/v1`,
        customApiKey: 'test-key',
        customModel: 'fake-model',
        analysisMode: 'optimized',
      }),
    });

    const body = await readJsonObject(response);

    assert.equal(response.status, 429);
    assert.equal(body.code, 'QUOTA_EXCEEDED');
    assert.equal(providerRequestCount, 1);
  } finally {
    await close(appServer);
    await close(providerServer);
  }
});

test('non-vision compatible models probe image support before OCR fallback', async () => {
  const providerBodies: string[] = [];
  const providerServer = http.createServer(async (req, res) => {
    if (req.url !== '/v1/chat/completions') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'not found' } }));
      return;
    }

    const requestBody = await readRequestBody(req);
    providerBodies.push(requestBody);
    if (isVisionProbeRequest(requestBody)) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        choices: [{ message: { content: 'VISION_UNSUPPORTED' } }],
      }));
      return;
    }

    const nonProbeCallCount = providerBodies.filter((body) => !isVisionProbeRequest(body)).length;
    const content = nonProbeCallCount === 1 ? buildRouteResponse() : buildCleanAnalysisResponse();

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }));
  });

  const providerPort = await listen(providerServer);

  try {
    const result = await performAnalysis({
      text: '이미지 광고 검토',
      imageB64: null,
      imagesB64: ['data:image/png;base64,ZmFrZQ=='],
      adapterType: 'CUSTOM',
      customModel: 'llama3',
      customEndpoint: `http://127.0.0.1:${providerPort}/v1`,
      customApiKey: 'test-key',
      websiteUrl: '',
      additionalContext: '',
      analysisMode: 'optimized',
      globalApiKey: undefined,
      ocrExtractor: async () => '한정 특가 50% 할인',
    });

    assert.equal(result.ocrFallbackUsed, true);
    assert.equal(result.ocrExtractedText, '한정 특가 50% 할인');
    assert.equal(providerBodies.length, 3);
    assert.match(providerBodies[0] || '', /image_url/);
    assert.match(providerBodies[1] || '', /한정 특가 50% 할인/);
    assert.doesNotMatch(providerBodies.slice(1).join('\n'), /image_url/);
  } finally {
    await close(providerServer);
  }
});

test('catalog vision models skip probe and send image payloads directly', async () => {
  const providerBodies: string[] = [];
  const providerServer = http.createServer(async (req, res) => {
    if (req.url !== '/v1/chat/completions') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'not found' } }));
      return;
    }

    providerBodies.push(await readRequestBody(req));
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify(
            providerBodies.length === 1 ? buildRouteResponse() : buildCleanAnalysisResponse(),
          ),
        },
      }],
    }));
  });

  const providerPort = await listen(providerServer);

  try {
    const result = await performAnalysis({
      text: '이미지 광고 검토',
      imageB64: null,
      imagesB64: ['data:image/png;base64,ZmFrZQ=='],
      adapterType: 'CUSTOM',
      customModel: 'llava:13b',
      customEndpoint: `http://127.0.0.1:${providerPort}/v1`,
      customApiKey: 'test-key',
      websiteUrl: '',
      additionalContext: '',
      analysisMode: 'optimized',
      globalApiKey: undefined,
      ocrExtractor: async () => '사용되지 않아야 하는 OCR',
    });

    assert.equal(result.ocrFallbackUsed, false);
    assert.equal(providerBodies.length, 2);
    assert.doesNotMatch(providerBodies.join('\n'), /capability detector/);
    assert.match(providerBodies.join('\n'), /image_url/);
  } finally {
    await close(providerServer);
  }
});

test('image processing errors after a positive probe fall back to OCR retry', async () => {
  const providerBodies: string[] = [];
  const providerServer = http.createServer(async (req, res) => {
    if (req.url !== '/v1/chat/completions') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'not found' } }));
      return;
    }

    const requestBody = await readRequestBody(req);
    providerBodies.push(requestBody);
    if (isVisionProbeRequest(requestBody)) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        choices: [{ message: { content: 'VISION_SUPPORTED' } }],
      }));
      return;
    }
    if (requestBody.includes('image_url')) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'this model does not support images' } }));
      return;
    }

    const nonImageCallCount = providerBodies.filter((body) => !isVisionProbeRequest(body) && !body.includes('image_url')).length;

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify(
            nonImageCallCount === 1 ? buildRouteResponse() : buildCleanAnalysisResponse(),
          ),
        },
      }],
    }));
  });

  const providerPort = await listen(providerServer);

  try {
    const result = await performAnalysis({
      text: '이미지 광고 검토',
      imageB64: null,
      imagesB64: ['data:image/png;base64,ZmFrZQ=='],
      adapterType: 'CUSTOM',
      customModel: 'unknown-image-model',
      customEndpoint: `http://127.0.0.1:${providerPort}/v1`,
      customApiKey: 'test-key',
      websiteUrl: '',
      additionalContext: '',
      analysisMode: 'optimized',
      globalApiKey: undefined,
      ocrExtractor: async () => '런타임 실패 후 OCR',
    });

    assert.equal(result.ocrFallbackUsed, true);
    assert.equal(result.ocrExtractedText, '런타임 실패 후 OCR');
    assert.match(result.ocrNotice || '', /실제 분석 요청에서 이미지 입력 미지원 오류/);
    assert.equal(providerBodies.length, 4);
    assert.match(providerBodies[0] || '', /image_url/);
    assert.match(providerBodies[1] || '', /image_url/);
    assert.doesNotMatch(providerBodies.slice(2).join('\n'), /image_url/);
    assert.match(providerBodies.slice(2).join('\n'), /런타임 실패 후 OCR/);
  } finally {
    await close(providerServer);
  }
});
