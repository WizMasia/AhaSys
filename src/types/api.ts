import type { ParsedMeta, SystemAnalysisResult } from '../types';

export type ComplianceVerdict = 'Approved' | 'Rejected';

export interface AnalyzeCompliancePayload {
  readonly text: string;
  readonly url: string;
  readonly context: string;
  readonly imagePresent: boolean;
  readonly images: readonly string[];
  readonly adapter: string;
  readonly modelName: string;
  readonly endpoint?: string;
  readonly apiKey?: string;
  readonly analysisMode?: string;
}

export interface AnalyzeComplianceError {
  readonly error?: boolean;
  readonly message?: string;
  readonly localLlmError?: string;
}

export type AnalyzeComplianceResponse = SystemAnalysisResult & AnalyzeComplianceError;

export interface HistoryItem {
  readonly id: string;
  readonly inputText: string;
  readonly imagePresent: boolean;
  readonly score: number;
  readonly verdict: ComplianceVerdict;
  readonly meta: ParsedMeta;
  readonly timestamp: string;
  readonly result?: SystemAnalysisResult;
}

export interface BenchmarkRunCase {
  readonly id: string;
  readonly name: string;
  readonly inputText: string;
  readonly score: number;
  readonly violationsCount: number;
  readonly violations: readonly {
    readonly id: string;
    readonly clause: string;
    readonly severity: 'High' | 'Medium' | 'Low';
    readonly description: string;
    readonly deductionPoints: number;
    readonly originalFragment: string;
    readonly replacement: string;
  }[];
  readonly status: string;
  readonly timeMs: number;
  readonly isPass: boolean;
}

export interface BenchmarkRunResponse {
  readonly success: boolean;
  readonly passed: number;
  readonly failed: number;
  readonly total: number;
  readonly reportLink: string;
  readonly testRuns: readonly BenchmarkRunCase[];
}

export interface FetchProxyModelsResponse {
  readonly success: boolean;
  readonly models: readonly string[];
  readonly message?: string;
  readonly error?: boolean;
}

export interface ClearHistoryResponse {
  readonly success: boolean;
  readonly message: string;
}
