/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Stage {
  REVIEW = 'REVIEW',
  DEDUCTION = 'DEDUCTION',
  ALTERNATIVES = 'ALTERNATIVES',
}

export enum LLMType {
  GEMINI = 'GEMINI',
  OLLAMA = 'OLLAMA',
  CUSTOM = 'CUSTOM',
}

export interface LLMConfig {
  type: LLMType;
  endpoint?: string;
  apiKey?: string;
  modelName: string;
}

export interface ParsedMeta {
  productType: string; // 건강기능식품, 기능성 화장품, 일반 표시광고, etc.
  targets: string; // 임산부, 영유아, 일반 성인, etc.
  regulatoryDomain: string; // 약사법, 식품표시광고법, 화장품법, etc.
  channels: string; // 인스타그램 피드, 지상파 TV, 인쇄 매체, etc.
}

export interface Violation {
  id: string;
  clause: string; // 예: 식품표시광고법 제8조제1항
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  deductionPoints: number;
  originalFragment: string;
  replacement: string;
  isCitationVerified?: boolean;
  actionPlan?: string[];
}

export interface PastCase {
  id: string;
  title: string;
  originalText: string;
  resolution: string;
  verdict: 'Approved' | 'Rejected';
  similarity: number;
}

export interface SystemAnalysisResult {
  parsedMeta: ParsedMeta;
  score: number; // Starts at 100
  violations: Violation[];
  matchedLaws: {
    tier: number;
    title: string;
    description: string;
    relevance: number; // Percentage
  }[];
  pastCases: PastCase[];
  analysisTimeMs: number;
  memoryUsedMb?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  imageAlternativeProposal?: {
    detectedVisualCopys: string[];
    visualViolations: string[];
    visualRemediationSteps: string[];
    alternativeVisualDraft: string;
  };
}

export interface RegulationClause {
  tier: number; // Tier 0 to 4
  tierName: string;
  domain: string;
  clause: string;
  text: string;
  keywords: string[];
}

export interface BenchmarkCase {
  id: string;
  name: string;
  inputText: string;
  expectedViolations: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  result?: {
    score: number;
    violationsCount: number;
    meta: ParsedMeta;
    timeMs: number;
    adapterUsed: string;
  };
}
