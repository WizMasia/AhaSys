/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BenchmarkCase } from '../types';
import type {
  AnalyzeCompliancePayload,
  AnalyzeComplianceResponse,
  BenchmarkRunResponse,
  ClearHistoryResponse,
  FetchProxyModelsResponse,
  HistoryItem,
} from '../types/api';

const extractErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const data: unknown = await response.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return data.message;
    }
  } catch {
    return fallback;
  }
  return fallback;
};

export const apiClient = {
  /**
   * Retrieves the cumulative self-learning compliance history log from RAG.
   * GET /api/history
   */
  async getHistory(): Promise<HistoryItem[]> {
    const response = await fetch('/api/history');
    if (!response.ok) {
      throw new Error('Failed to retrieve history nodes.');
    }
    return response.json();
  },

  /**
   * Clears/resets the compliance history log.
   * DELETE /api/history
   */
  async clearHistory(): Promise<ClearHistoryResponse> {
    const response = await fetch('/api/history', {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to clear history ledger.');
    }
    return response.json();
  },

  /**
   * Retrieves the preloaded benchmarking cases.
   * GET /api/benchmark
   */
  async getBenchmarkCases(): Promise<BenchmarkCase[]> {
    const response = await fetch('/api/benchmark');
    if (!response.ok) {
      throw new Error('Failed to load benchmark index.');
    }
    return response.json();
  },

  /**
   * Runs the batch benchmarking suite dynamically.
   * POST /api/benchmark/run
   */
  async runBenchmark(): Promise<BenchmarkRunResponse> {
    const response = await fetch('/api/benchmark/run', {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to execute benchmarking batch.');
    }
    return response.json();
  },

  /**
   * Submits advertisement copy and images for strict autonomous regulatory review.
   * POST /api/analyze
   */
  async analyzeCompliance(payload: AnalyzeCompliancePayload): Promise<AnalyzeComplianceResponse> {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: payload.text,
        imagesB64: payload.images,
        adapterType: payload.adapter,
        customModel: payload.modelName,
        customEndpoint: payload.endpoint,
        customApiKey: payload.apiKey,
        websiteUrl: payload.url,
        additionalContext: payload.context,
        analysisMode: payload.analysisMode,
      }),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, '서버 컴플라이언스 엔진 연결 중 심각한 예외가 촉발해 통신이 중단되었습니다.'));
    }

    return response.json();
  },

  /**
   * Proxies a fetch request to query available LLM models from a custom endpoint.
   * POST /api/proxy/models
   */
  async fetchProxyModels(endpoint: string, apiKey?: string): Promise<FetchProxyModelsResponse> {
    const response = await fetch('/api/proxy/models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, '모델 목록을 조회하지 못했습니다. 엔드포인트 응답 상태와 서버가 켜져 있는지 확인하십시오.'));
    }

    return response.json();
  },
};
