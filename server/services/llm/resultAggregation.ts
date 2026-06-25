import { addToHistoryCollection, type HistoryMeta } from '../historyStore';
import { isRecord } from './responseParsing';
import { buildMatchedLaws, normalizeViolations, sumDeductions } from './resultCitations';
import {
  BASE_SCORE,
  DEFAULT_CHANNELS,
  DEFAULT_PRODUCT_TYPE,
  DEFAULT_REGULATORY_DOMAIN,
  DEFAULT_TARGETS,
} from './resultDefaults';
import { getAgentsActivated, type RouteDecision } from './routing';
import type { OcrFallbackContext } from './types';

interface RetrievedGuideline {
  readonly article: {
    readonly tier: number;
    readonly clause: string;
    readonly text: string;
  };
  readonly score: number;
}

interface FewShotCase {
  readonly id: string;
  readonly inputText: string;
  readonly verdict: 'Approved' | 'Rejected';
  readonly score: number;
  readonly meta: {
    readonly productType: string;
  };
}

interface TokenUsageMetadata {
  readonly promptTokenCount: number;
  readonly candidatesTokenCount: number;
  readonly totalTokenCount: number;
}

interface FinalizeAnalysisResultParams {
  readonly parsedAgentsData: readonly Record<string, unknown>[];
  readonly retrieved: readonly RetrievedGuideline[];
  readonly fewShots: readonly FewShotCase[];
  readonly routeDecision: RouteDecision;
  readonly failedAgentMessages: readonly string[];
  readonly ocrFallback: OcrFallbackContext;
  readonly usageMetadata: TokenUsageMetadata | null;
  readonly textStrForAnalysis: string;
  readonly imageB64ForAnalysis: unknown;
  readonly originalImagePayloads: readonly string[];
  readonly customModel: unknown;
  readonly adapterType: unknown;
  readonly startTime: number;
}

interface ImageAlternativeProposal {
  detectedVisualCopys: string[];
  visualViolations: string[];
  visualRemediationSteps: string[];
  alternativeVisualDraft: string;
}

interface FinalAnalysisResult {
  ocrFallbackUsed: boolean;
  ocrExtractedText: string;
  ocrNotice: string;
  parsedMeta: HistoryMeta;
  score: number;
  violations: unknown[];
  matchedLaws: unknown[];
  agentsActivated: string[];
  imageAlternativeProposal: ImageAlternativeProposal;
  analysisTimeMs?: number;
  modelUsed?: string;
  usage?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
  localLlmError?: string;
  pastCases?: Array<{
    readonly id: string;
    readonly title: string;
    readonly originalText: string;
    readonly resolution: string;
    readonly verdict: 'Approved' | 'Rejected';
    readonly similarity: number;
  }>;
}

const defaultMeta = (): HistoryMeta => ({
  productType: DEFAULT_PRODUCT_TYPE,
  targets: DEFAULT_TARGETS,
  regulatoryDomain: DEFAULT_REGULATORY_DOMAIN,
  channels: DEFAULT_CHANNELS,
});

const readString = (value: unknown): string => (
  typeof value === 'string' ? value : ''
);

const readMeta = (value: unknown): HistoryMeta | null => {
  if (!isRecord(value)) return null;
  return {
    productType: readString(value.productType) || DEFAULT_PRODUCT_TYPE,
    targets: readString(value.targets) || DEFAULT_TARGETS,
    regulatoryDomain: readString(value.regulatoryDomain) || DEFAULT_REGULATORY_DOMAIN,
    channels: readString(value.channels) || DEFAULT_CHANNELS,
  };
};

const chooseParsedMeta = (parsedAgentsData: readonly Record<string, unknown>[]): HistoryMeta => (
  readMeta(parsedAgentsData[0]?.parsedMeta) ||
  readMeta(parsedAgentsData[1]?.parsedMeta) ||
  defaultMeta()
);

const addStringsToSet = (values: unknown, target: Set<string>): void => {
  if (!Array.isArray(values)) return;
  values.forEach((value) => {
    if (typeof value === 'string') {
      target.add(value);
    }
  });
};

const buildImageAlternativeProposal = (parsedAgentsData: readonly Record<string, unknown>[]): ImageAlternativeProposal => {
  const detectedVisualCopysSet = new Set<string>();
  const visualViolationsSet = new Set<string>();
  const visualRemediationStepsSet = new Set<string>();
  const alternativeDrafts: string[] = [];

  parsedAgentsData.forEach((parsed) => {
    if (!isRecord(parsed.imageAlternativeProposal)) return;
    const proposal = parsed.imageAlternativeProposal;
    addStringsToSet(proposal.detectedVisualCopys, detectedVisualCopysSet);
    addStringsToSet(proposal.visualViolations, visualViolationsSet);
    addStringsToSet(proposal.visualRemediationSteps, visualRemediationStepsSet);
    if (typeof proposal.alternativeVisualDraft === 'string' && proposal.alternativeVisualDraft.trim()) {
      alternativeDrafts.push(proposal.alternativeVisualDraft.trim());
    }
  });

  return {
    detectedVisualCopys: Array.from(detectedVisualCopysSet),
    visualViolations: Array.from(visualViolationsSet),
    visualRemediationSteps: Array.from(visualRemediationStepsSet),
    alternativeVisualDraft: alternativeDrafts.join("\n\n")
  };
};

export const finalizeAnalysisResult = (params: FinalizeAnalysisResultParams): FinalAnalysisResult => {
  const agentsActivated = getAgentsActivated(params.routeDecision);
  const normalizedViolations = normalizeViolations(params.parsedAgentsData);
  const totalDeductions = sumDeductions(normalizedViolations);
  const result: FinalAnalysisResult = {
    ocrFallbackUsed: false,
    ocrExtractedText: '',
    ocrNotice: '',
    parsedMeta: chooseParsedMeta(params.parsedAgentsData),
    score: Math.max(0, BASE_SCORE - totalDeductions),
    violations: normalizedViolations,
    matchedLaws: buildMatchedLaws(params.parsedAgentsData, params.retrieved),
    agentsActivated,
    imageAlternativeProposal: buildImageAlternativeProposal(params.parsedAgentsData)
  };

  result.analysisTimeMs = Date.now() - params.startTime;
  result.modelUsed = typeof params.customModel === 'string' && params.customModel.trim()
    ? params.customModel.trim()
    : (params.adapterType === 'GEMINI' || !params.adapterType ? 'gemini-2.5-flash' : 'llama3');

  if (params.usageMetadata) {
    result.usage = {
      promptTokens: params.usageMetadata.promptTokenCount,
      completionTokens: params.usageMetadata.candidatesTokenCount,
      totalTokens: params.usageMetadata.totalTokenCount
    };
  } else {
    const promptTokens = Math.round(params.textStrForAnalysis.length * 1.5 + (params.imageB64ForAnalysis ? 1000 : 0) + 400);
    const completionTokens = Math.round(JSON.stringify(result).length / 3);
    result.usage = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    };
  }

  if (params.failedAgentMessages.length > 0) {
    result.localLlmError = `일부 전문 에이전트 분석이 실패하여 성공한 결과만 종합했습니다. ${params.failedAgentMessages.join(' / ')}`;
  }

  if (params.ocrFallback.used) {
    result.ocrFallbackUsed = true;
    result.ocrExtractedText = params.ocrFallback.extractedText;
    result.ocrNotice = params.ocrFallback.notice;
    result.localLlmError = result.localLlmError
      ? `${params.ocrFallback.notice} ${result.localLlmError}`
      : params.ocrFallback.notice;
  }

  result.pastCases = params.fewShots.map((fs) => ({
    id: fs.id,
    title: `${fs.meta.productType} 과거 자진 심의 사례`,
    originalText: fs.inputText,
    resolution: `감점 점수: ${fs.score}점, 판결: ${fs.verdict}`,
    verdict: fs.verdict,
    similarity: 90
  }));

  addToHistoryCollection({
    id: `hist_${Date.now()}`,
    inputText: params.textStrForAnalysis || "(이미지 단독 심사)",
    imagePresent: params.originalImagePayloads.length > 0,
    score: result.score,
    verdict: result.score >= 80 ? 'Approved' : 'Rejected',
    meta: result.parsedMeta,
    timestamp: new Date().toISOString(),
    result
  });

  return result;
};
