/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { BENCHMARK_CASES } from '../services/benchmarkCases';
import { pickRandomBenchmarkCases, runBenchmarkSuite } from '../services/benchmarkRunner';
import {
  clearHistoryCollection,
  getHistoryCollection,
  handleFetchModels,
  isProviderRateLimitError,
  performAnalysis
} from '../services/llmService';

const router = express.Router();

const getErrorMessage = (err: unknown, fallbackMessage: string): string => (
  err instanceof Error ? err.message : fallbackMessage
);

const getErrorCode = (err: unknown): string | undefined => {
  if (err === null || typeof err !== 'object' || !('code' in err)) {
    return undefined;
  }

  const code: unknown = Reflect.get(err, 'code');
  return typeof code === 'string' ? code : undefined;
};

// Clear / resetting history loop
router.delete('/history', (req, res) => {
  clearHistoryCollection();
  res.json({ success: true, message: "History cleared successfully!" });
});

// History endpoint
router.get('/history', (req, res) => {
  res.json(getHistoryCollection());
});

// Proxy endpoint to query available models from a custom OpenAI-compatible endpoint
router.post('/proxy/models', async (req, res) => {
  const { endpoint, apiKey } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: true, message: "엔드포인트 주소가 제공되지 않았습니다." });
  }

  try {
    const result = await handleFetchModels(endpoint, apiKey);
    return res.json(result);
  } catch (err: unknown) {
    console.error("Fetch models proxy error:", err);
    const isLocalhost = endpoint.includes("localhost") || endpoint.includes("127.0.0.1");
    const suggestion = isLocalhost 
      ? "\n\n💡 [보안 안내] 현재 이 도구는 클라우드 샌드박스 보안망 내에서 독립 실행 중이므로, 클라우드 백엔드 환경에서는 사용자의 로컬 컴퓨터 주소(localhost / 127.0.0.1)에 직접 접속할 수 없어 '연결 거부(ECONNREFUSED)'가 발생합니다. 브라우저로 직접 로컬 Ollama에 접근하기를 실패한 상황이므로, 본 소스코드를 ZIP으로 아카이브 다운로드(Export to ZIP) 하신 후 사용자의 컴퓨터에서 로컬 구동(npm run dev)하시면 완결되게 동작합니다."
      : "";
    res.status(500).json({ error: true, message: `지정한 엔드포인트 서버에 연결할 수 없습니다 (${getErrorMessage(err, "알 수 없는 오류")}).${suggestion}` });
  }
});

// Run individual analyze query (text + image)
router.post('/analyze', async (req, res) => {
  const { text, imageB64, imagesB64, adapter, adapterType, customModel, customEndpoint, customApiKey, websiteUrl, additionalContext, analysisMode } = req.body;
  
  try {
    const result = await performAnalysis({
      text,
      imageB64,
      imagesB64,
      adapterType: adapterType || adapter,
      customModel,
      customEndpoint,
      customApiKey,
      websiteUrl,
      additionalContext,
      analysisMode,
      globalApiKey: process.env.FALLBACK_API_KEY || process.env.GEMINI_API_KEY
    });
    res.json(result);
  } catch (err: unknown) {
    console.error("API Error during analysis: ", err);
    const baseErrorMsg = getErrorMessage(err, "심사 분석 수행 도중 장애가 발생했습니다.");
    const apiErrorCode = getErrorCode(err);
    
    if (apiErrorCode === 'MISSING_API_KEY') {
      return res.status(400).json({
        error: true,
        code: 'MISSING_API_KEY',
        message: baseErrorMsg
      });
    }

    const isGeminiAdapter = (adapterType || adapter) === 'GEMINI';
    const responseError = baseErrorMsg.includes('API_KEY_INVALID') || baseErrorMsg.includes('API key not valid') || baseErrorMsg.includes('API_KEY_UNAUTHORIZED')
      ? {
        code: 'INVALID_API_KEY',
        status: 401,
        message: isGeminiAdapter
          ? "제공된 Gemini API Key가 유효하지 않습니다. 상단의 [LLM 설정] 탭에 등록하신 API Key 값의 오탈자를 확인하시거나 유효한 키를 재기입하십시오."
          : "제공된 API Key가 유효하지 않습니다. 선택하신 어댑터(OpenRouter/OpenAI 등)의 API Key 설정을 확인해주십시오."
      }
      : isProviderRateLimitError(err)
        ? {
          code: 'QUOTA_EXCEEDED',
          status: 429,
          message: isGeminiAdapter
            ? "Gemini API의 인프라 실시간 연산 허용량(Quota Limit)이 일시적으로 완전 초과되었습니다. 잠시 후 초과 완화 국면에서 다시 조회를 게시해 주시거나 [LLM 설정] 탭에 개인전용 완충 키를 교체 기입하여 주십시오."
            : "선택하신 API 엔드포인트(OpenRouter/OpenAI/로컬 등)의 실시간 호출 제한 한도(Rate Limit / 429)가 초과되었거나 일시적으로 차단되었습니다. 잠시 후 다시 시도해주십시오."
        }
        : {
          code: 'GENERIC_ERROR',
          status: 500,
          message: baseErrorMsg
        };
    
    res.status(responseError.status).json({ error: true, code: responseError.code, message: responseError.message });
  }
});

// Get benchmark cases
router.get('/benchmark', (req, res) => {
  res.json(pickRandomBenchmarkCases(50));
});

// Download full benchmark cases as a JSON file attachment
router.get('/benchmark/download', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="benchmark_cases.json"');
  res.send(BENCHMARK_CASES);
});

// Run benchmarking cases dynamically & package them to folders (Section 10 of ARCH_DESIGN.md)
router.post('/benchmark/run', (req, res) => {
  const casesDir = path.join(process.cwd(), 'docs', 'benchmark', 'cases');
  const summaryFilePath = path.join(process.cwd(), 'docs', 'benchmark', 'test_runs.json');
  const readmeFilePath = path.join(process.cwd(), 'docs', 'benchmark', 'README.md');

  try {
    res.json(runBenchmarkSuite({ casesDir, summaryFilePath, readmeFilePath }));

  } catch (err: unknown) {
    console.error("Benchmarking Error: ", err);
    res.status(500).json({ error: true, message: getErrorMessage(err, "벤치마크 일괄 수행 실패") });
  }
});

export default router;
