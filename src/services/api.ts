/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SystemAnalysisResult, BenchmarkCase } from '../types';

export interface AnalyzeCompliancePayload {
  text: string;
  url: string;
  context: string;
  imagePresent: boolean;
  images: string[];
  adapter: string;
  modelName: string;
  endpoint?: string;
  apiKey?: string;
}

export interface HistItem {
  id: string;
  inputText: string;
  imagePresent: boolean;
  score: number;
  verdict: 'Approved' | 'Rejected';
  meta: any;
  timestamp: string;
  result?: any;
}

export interface BenchmarkRunResponse {
  success: boolean;
  passed: number;
  failed: number;
  total: number;
  reportLink: string;
  testRuns: any[];
}

export interface FetchProxyModelsResponse {
  success: boolean;
  models: string[];
  message?: string;
  error?: boolean;
}

export const apiClient = {
  /**
   * Retrieves the cumulative self-learning compliance history log from RAG.
   * GET /api/history
   */
  async getHistory(): Promise<HistItem[]> {
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
  async clearHistory(): Promise<{ success: boolean; message: string }> {
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
  async analyzeCompliance(payload: AnalyzeCompliancePayload): Promise<SystemAnalysisResult & { error?: boolean; message?: string; localLlmError?: string }> {
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
      }),
    });

    if (!response.ok) {
      let errorMessage = '서버 컴플라이언스 엔진 연결 중 심각한 예외가 촉발해 통신이 중단되었습니다.';
      try {
        const errJson = await response.json();
        if (errJson && errJson.message) {
          errorMessage = errJson.message;
        }
      } catch (_) {}
      throw new Error(errorMessage);
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
      let errorMessage = '모델 목록을 조회하지 못했습니다. 엔드포인트 응답 상태와 서버가 켜져 있는지 확인하십시오.';
      try {
        const errJson = await response.json();
        if (errJson && errJson.message) {
          errorMessage = errJson.message;
        }
      } catch (_) {}
      throw new Error(errorMessage);
    }

    return response.json();
  },
};
