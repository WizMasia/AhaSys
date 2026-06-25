/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BENCHMARK_CASES } from './benchmarkCases';
import { clearHistoryCollection, getHistoryCollection } from './historyStore';
import { retrieveFewShots, retrieveGuidelines } from './rag';
import { buildCombinedInputText, extractWebsiteText, readImagePayloadArray, type PerformAnalysisParams, type TokenUsageMetadata } from './llm/analysisRequest';
import { executeLLMAnalysis } from './llm/adapters';
import {
  getErrorMessage,
  isProviderRateLimitError,
  isRecoverableRoutingError,
  MissingApiKeyError,
  ProviderRateLimitError,
} from './llm/errors';
import { buildAnalysisInstructions, buildFewShotContext } from './llm/instructions';
import { repairAndParseJson } from './llm/jsonRepair';
import { BASE_SCORE } from './llm/resultDefaults';
import { finalizeAnalysisResult } from './llm/resultAggregation';
import { buildAgentPayloads, createDefaultRouteDecision, createFullRouteDecision, parseRouteDecision } from './llm/routing';
import { collectImagePayloads, buildOcrFallbackContext, extractTextFromImages, isImageCapabilityError, modelSupportsVision, probeModelVisionCapability, shouldProbeVisionCapability } from './llm/visionOcr';
import type { ImageTextExtractor, LLMAdapterPayload, VisionProbeFunction } from './llm/types';

export { BENCHMARK_CASES, clearHistoryCollection, getHistoryCollection, retrieveGuidelines };
export { executeLLMAnalysis } from './llm/adapters';
export { MissingApiKeyError, ProviderRateLimitError, isProviderRateLimitError } from './llm/errors';
export { repairAndParseJson } from './llm/jsonRepair';
export { handleFetchModels } from './llm/modelProxy';
export { BASE_SCORE, DEFAULT_CHANNELS, DEFAULT_PRODUCT_TYPE, DEFAULT_REGULATORY_DOMAIN, DEFAULT_TARGETS, generateDefaultActionPlan } from './llm/resultDefaults';
export { extractTextFromImages, probeModelVisionCapability } from './llm/visionOcr';
export type { ImageTextExtractor, LLMAdapter, LLMAdapterPayload, SystemAnalysisResult, VisionProbeFunction, VisionProbeParams, VisionProbeResult } from './llm/types';

export async function performAnalysis(params: PerformAnalysisParams) {
  const {
    text,
    imageB64,
    imagesB64,
    adapterType,
    customModel,
    customEndpoint,
    customApiKey,
    websiteUrl,
    additionalContext,
    analysisMode,
    globalApiKey
  } = params;

  const startTime = Date.now();
  const textStr = typeof text === 'string' ? text : "";
  let usageMetadata: TokenUsageMetadata | null = null;
  const imageB64Input = typeof imageB64 === 'string' ? imageB64 : null;
  const imagesB64Input = readImagePayloadArray(imagesB64);
  const originalImagePayloads = collectImagePayloads(imageB64Input, imagesB64Input);
  const adapterTypeStr = typeof adapterType === 'string' ? adapterType : '';
  const customModelStr = typeof customModel === 'string' ? customModel : '';
  const customEndpointStr = typeof customEndpoint === 'string' ? customEndpoint : null;
  const customApiKeyStr = typeof customApiKey === 'string' ? customApiKey : null;
  const probeRequired = !params.forceOcrFallback && shouldProbeVisionCapability({
    adapterType: adapterTypeStr,
    modelName: customModelStr,
    hasImages: originalImagePayloads.length > 0,
  });
  const visionProbeResult = probeRequired
    ? await (params.visionProbe || probeModelVisionCapability)({
      imagePayload: originalImagePayloads[0] || '',
      customModel: customModelStr,
      customEndpoint: customEndpointStr,
      customApiKey: customApiKeyStr,
    })
    : { kind: 'supported', reason: modelSupportsVision(customModelStr) ? '검증된 비전 모델 카탈로그와 일치하여 probe를 생략했습니다.' : '이미지 probe가 필요하지 않은 구성입니다.' };
  const modelNameForNotice = customModelStr.trim() ? customModelStr.trim() : '선택한 OpenAI-compatible/로컬 모델';
  const shouldFallbackToOcr = params.forceOcrFallback || visionProbeResult.kind === 'unsupported';
  const ocrFallbackReason = params.ocrFallbackReason || (
    visionProbeResult.kind === 'unsupported'
      ? `${modelNameForNotice}의 사전 이미지 처리 probe에서 멀티모달 지원을 확인하지 못했습니다.`
      : `${modelNameForNotice}의 이미지 직접 처리 요청이 실패했습니다.`
  );
  const ocrFallback = shouldFallbackToOcr
    ? await buildOcrFallbackContext({
      imagePayloads: originalImagePayloads,
      modelName: customModelStr,
      extractor: params.ocrExtractor || extractTextFromImages,
      reason: ocrFallbackReason,
    })
    : { used: false, extractedText: '', notice: '' };
  const textStrForAnalysis = ocrFallback.used
    ? `${textStr}${textStr ? '\n\n' : ''}[OCR 추출 이미지 문구]\n${ocrFallback.extractedText || '(OCR에서 판독 가능한 문구 없음)'}`
    : textStr;
  const imageB64ForAnalysis = ocrFallback.used ? null : imageB64Input;
  const imagesB64ForAnalysis = ocrFallback.used ? null : imagesB64Input;
  const forceImageInput = !ocrFallback.used && adapterTypeStr !== 'GEMINI' && visionProbeResult.kind === 'supported';
  const canRetryWithOcrFallback = !ocrFallback.used && originalImagePayloads.length > 0 && adapterTypeStr !== 'GEMINI';
  const retryWithOcrFallback = (reason: string) => performAnalysis({
    ...params,
    forceOcrFallback: true,
    ocrFallbackReason: reason,
  });

  const activeApiKey = customApiKeyStr && customApiKeyStr.trim() ? customApiKeyStr.trim() : globalApiKey;

  if ((adapterTypeStr === 'GEMINI' || !adapterTypeStr) && !activeApiKey) {
    throw new MissingApiKeyError("RAG 연산을 처리할 Gemini API Key가 할당되지 않았습니다. 아하시스턴트 정밀 진단을 구동하시려면 상단의 [LLM 설정] 탭으로 이동하시어 API Key를 등록해주십시오.");
  }

  const websiteText = await extractWebsiteText(websiteUrl);
  const combinedInputText = buildCombinedInputText(textStrForAnalysis, websiteText, additionalContext);

  const searchTargetText = combinedInputText.trim() || "(이미지 단독 심사)";

  const retrieved = retrieveGuidelines(searchTargetText);
  const fewShots = retrieveFewShots(searchTargetText);

  const fewShotContext = buildFewShotContext(fewShots);
  const instructions = buildAnalysisInstructions(fewShotContext);

  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let hasUsage = false;

  const orchestratorPayload: LLMAdapterPayload = {
    textStr: textStrForAnalysis,
    imageB64: imageB64ForAnalysis,
    imagesB64: imagesB64ForAnalysis,
    systemInstruction: instructions.orchestrator,
    customModel: customModelStr,
    customEndpoint: customEndpointStr,
    customApiKey: customApiKeyStr,
    globalApiKey,
    forceImageInput
  };

  let routeDecision = createDefaultRouteDecision();

  const hasCustomKey = !!(customApiKeyStr && customApiKeyStr.trim());
  const finalMode = hasCustomKey ? analysisMode : 'optimized';
  const isGeminiAdapter = adapterTypeStr === 'GEMINI' || !adapterTypeStr;
  const hasImageInput = originalImagePayloads.length > 0;
  const shouldUseConsolidatedGeminiReview = isGeminiAdapter && hasImageInput;

  if (finalMode === 'full' || shouldUseConsolidatedGeminiReview) {
    routeDecision = createFullRouteDecision();
  } else {
    try {
      const routeResult = await executeLLMAnalysis(orchestratorPayload, adapterTypeStr);
      if (routeResult.usageMetadata) {
        hasUsage = true;
        promptTokens += routeResult.usageMetadata.promptTokenCount || 0;
        completionTokens += routeResult.usageMetadata.candidatesTokenCount || 0;
        totalTokens += routeResult.usageMetadata.totalTokenCount || 0;
      }
      
      const parsedRoute = repairAndParseJson(routeResult.responseText);
      
      routeDecision = parseRouteDecision(parsedRoute);
    } catch (err) {
      if (canRetryWithOcrFallback && isImageCapabilityError(err)) {
        return retryWithOcrFallback(`${modelNameForNotice}의 이미지 직접 처리 probe 이후 실제 분석 요청에서 이미지 입력 미지원 오류가 발생했습니다.`);
      }
      if (!isRecoverableRoutingError(err)) {
        throw err;
      }
      console.warn("Orchestrator routing failed, falling back to full review:", err);
      routeDecision = createFullRouteDecision();
    }
  }

  const payloads = buildAgentPayloads({
    routeDecision,
    instructions,
    shouldUseConsolidatedGeminiReview,
    combinedInputText,
    textStrForAnalysis,
    imageB64ForAnalysis,
    imagesB64ForAnalysis,
    customModel: customModelStr,
    customEndpoint: customEndpointStr,
    customApiKey: customApiKeyStr,
    globalApiKey,
    forceImageInput
  });

  const agentResults = await Promise.allSettled(payloads.map(p => executeLLMAnalysis(p, adapterTypeStr)));
  const parsedAgentsData: Record<string, unknown>[] = [];
  const failedAgentMessages: string[] = [];
  let firstAgentFailure: unknown = null;

  agentResults.forEach((result, idx) => {
    if (result.status === 'rejected') {
      firstAgentFailure ??= result.reason;
      failedAgentMessages.push(`Agent ${idx + 1}: ${getErrorMessage(result.reason)}`);
      return;
    }

    const agentResult = result.value;
    if (agentResult.usageMetadata) {
      hasUsage = true;
      promptTokens += agentResult.usageMetadata.promptTokenCount || 0;
      completionTokens += agentResult.usageMetadata.candidatesTokenCount || 0;
      totalTokens += agentResult.usageMetadata.totalTokenCount || 0;
    }
    
    const parsed = repairAndParseJson(agentResult.responseText, { score: BASE_SCORE, violations: [], matchedLaws: [], imageAlternativeProposal: null });
    parsedAgentsData.push(parsed);
  });

  if (parsedAgentsData.length === 0 && firstAgentFailure) {
    if (canRetryWithOcrFallback && isImageCapabilityError(firstAgentFailure)) {
      return retryWithOcrFallback(`${modelNameForNotice}의 이미지 직접 분석 단계에서 이미지 입력 미지원 오류가 발생했습니다.`);
    }
    if (firstAgentFailure instanceof Error) {
      throw firstAgentFailure;
    }
    throw new Error(getErrorMessage(firstAgentFailure));
  }

  usageMetadata = hasUsage ? {
    promptTokenCount: promptTokens,
    candidatesTokenCount: completionTokens,
    totalTokenCount: totalTokens
  } : null;
  return finalizeAnalysisResult({
    parsedAgentsData,
    retrieved,
    fewShots,
    routeDecision,
    failedAgentMessages,
    ocrFallback,
    usageMetadata,
    textStrForAnalysis,
    imageB64ForAnalysis,
    originalImagePayloads,
    customModel: customModelStr,
    adapterType: adapterTypeStr,
    startTime
  });
}
