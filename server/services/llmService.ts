/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs/promises';
import { REGULATORY_LIBRARY } from '../db/regulatoryLibrary';
import { getSystemInstruction, getSocialControversyInstruction, getEsgGreenwashingInstruction, getPrivacyProtectionInstruction, getYouthProtectionInstruction, getOrchestratorRoutingInstruction, getCopyrightProtectionInstruction, getLegalFinanceInstruction, getLegalCommerceInstruction, getLegalNetInstruction } from '../prompts/compliancePrompt';
import { BENCHMARK_CASES } from './benchmarkCases';
import { addToHistoryCollection, clearHistoryCollection, getHistoryCollection } from './historyStore';
import { retrieveFewShots, retrieveGuidelines } from './rag';
import { modelSupportsVision, shouldProbeVisionCapability } from '../../shared/modelCapabilities';

export { BENCHMARK_CASES, clearHistoryCollection, getHistoryCollection, retrieveGuidelines };

// Constants
export const BASE_SCORE = 100;
export const DEFAULT_PRODUCT_TYPE = "일반광고";
export const DEFAULT_TARGETS = "일반 대중";
export const DEFAULT_REGULATORY_DOMAIN = "표시광고법";
export const DEFAULT_CHANNELS = "모든 채널";
const DEFAULT_OCR_LANGUAGES = 'kor+eng';
const DEFAULT_OCR_CACHE_PATH = '/tmp/tesseract-cache';

// Helpers
export function repairAndParseJson(text: string, fallback: any = null): any {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed.replace(/```json/g, "").replace(/```/g, ""));
  } catch (pe) {
    try {
      const cleanJsonStr = trimmed.substring(trimmed.indexOf('{'), trimmed.lastIndexOf('}') + 1);
      return JSON.parse(cleanJsonStr);
    } catch (e) {
      console.error("Failed to repair and parse JSON string:", text);
      return fallback;
    }
  }
}

export function generateDefaultActionPlan(originalFragment: string, replacement: string, lawDomain: string): string[] {
  const fragmentName = originalFragment || '논란구절';
  const replacementName = replacement || '대안문구';
  const domainName = lawDomain || '관련법';
  
  return [
    `1단계: [즉각 중단] 즉시 해당 광고 카피 내용의 게재 및 인쇄 배포를 일시중단하여 불법 유통 노출을 선제적으로 완전히 차단합니다.`,
    `2단계: [일대일 변경] 지목된 과장 표현 부위인 '${fragmentName}'을 세련되고 합법적인 안전 대안 문장인 '${replacementName}'(으)로 1:1 전면 교정 패치 처리합니다.`,
    `3단계: [인증 및 실증 확보] ${domainName} 규정에 근거하여, 해당 성분이나 효능에 대한 정량적 연구 논문 및 시험성적 검증 문서를 서면 대조 확보하여 보관소에 정리 보관합니다.`,
    `4단계: [시뮬레이션 재심의] 변경 완료된 조감 광고 시안을 '아하시스턴트(aHaSys)' 무결성 심사창에 재전송하여 2차 자율 심의 점수 80점 이상 안정 합격 여부를 최종 확인하는 모니터링 연쇄 장치를 적용합니다.`,
    `5단계: [캠페인 복구 및 준법 교육] 최종 안전 통과된 광고를 매체에 정상 신규 릴리즈 조치하며, 연관 기획팀 전원에게 동일 규정 미준수가 재발되지 않고 예방되도록 5단계 대처 표준 교육을 실행합니다.`
  ];
}

// Proxy endpoint logic to query available models
export async function handleFetchModels(endpoint: string, apiKey?: string) {
  const cleanEndpoint = endpoint.trim().endsWith('/') ? endpoint.trim().slice(0, -1) : endpoint.trim();
  const headers: any = { "Content-Type": "application/json" };
  if (apiKey && apiKey.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }

  // 1. Try standard OpenAI compatible models fetch
  const fetchUrl = `${cleanEndpoint}/models`;
  const response = await fetch(fetchUrl, {
    method: "GET",
    headers
  });

  if (response.ok) {
    const data = await response.json();
    if (data && Array.isArray(data.data)) {
      const models = data.data.map((m: any) => m.id);
      return { success: true, models };
    }
  }

  // 2. Fallback to direct Ollama non-v1 API "/api/tags" if the endpoint looks like a raw Ollama url
  try {
    const parsedUrl = new URL(cleanEndpoint);
    const hostWithPort = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const ollamaUrl = `${hostWithPort}/api/tags`;

    const ollamaResponse = await fetch(ollamaUrl);
    if (ollamaResponse.ok) {
      const ollamaData = await ollamaResponse.json();
      if (ollamaData && Array.isArray(ollamaData.models)) {
        const models = ollamaData.models.map((m: any) => m.name || m.model);
        return { success: true, models };
      }
    }
  } catch (parseErr) {
    // ignore URL parsing error and proceed
  }

  throw new Error("OpenAI 호환 API 또는 Ollama 서버로부터 모델 목록을 조회하지 못했습니다. 엔드포인트 URL을 확인해 주십시오.");
}

export interface SystemAnalysisResult {
  responseText: string;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export interface LLMAdapterPayload {
  textStr: string;
  imageB64: string | undefined | null;
  imagesB64: string[] | undefined | null;
  systemInstruction: string;
  customModel: string | undefined | null;
  customEndpoint: string | undefined | null;
  customApiKey: string | undefined | null;
  globalApiKey: string | undefined;
  forceImageInput?: boolean;
}

export type ImageTextExtractor = (imagePayloads: readonly string[]) => Promise<string>;
export type VisionProbeFunction = (params: VisionProbeParams) => Promise<VisionProbeResult>;

interface VisionProbeParams {
  readonly imagePayload: string;
  readonly customModel: string | undefined | null;
  readonly customEndpoint: string | undefined | null;
  readonly customApiKey: string | undefined | null;
}

type VisionProbeResult =
  | { readonly kind: 'supported'; readonly reason: string }
  | { readonly kind: 'unsupported'; readonly reason: string };

interface OcrFallbackContext {
  readonly used: boolean;
  readonly extractedText: string;
  readonly notice: string;
}

export interface LLMAdapter {
  analyze(payload: LLMAdapterPayload): Promise<SystemAnalysisResult>;
}

export class MissingApiKeyError extends Error {
  code: string;
  constructor(message: string) {
    super(message);
    this.code = 'MISSING_API_KEY';
  }
}

export class ProviderRateLimitError extends Error {
  readonly code = 'QUOTA_EXCEEDED';

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ProviderRateLimitError';
  }
}

const getErrorMessage = (err: unknown): string => (
  err instanceof Error ? err.message : String(err)
);

export const isProviderRateLimitError = (err: unknown): boolean => {
  if (err instanceof ProviderRateLimitError) return true;
  const message = getErrorMessage(err);
  return message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('Quota exceeded') ||
    message.includes('quota exceeded') ||
    message.includes('429');
};

const isProviderAuthError = (err: unknown): boolean => {
  const message = getErrorMessage(err);
  return message.includes('API_KEY_INVALID') ||
    message.includes('API key not valid') ||
    message.includes('API_KEY_UNAUTHORIZED') ||
    message.includes('Endpoint returned status 401') ||
    message.includes('Endpoint returned status 403');
};

const isRecoverableRoutingError = (err: unknown): boolean => (
  !isProviderRateLimitError(err) && !isProviderAuthError(err) && !(err instanceof MissingApiKeyError)
);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const extractChatCompletionContent = (data: unknown): string => {
  if (!isRecord(data) || !Array.isArray(data.choices)) {
    return '';
  }

  const firstChoice = data.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    return '';
  }

  const content = firstChoice.message.content;
  return typeof content === 'string' ? content : '';
};

const isImageCapabilityErrorMessage = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return normalized.includes('image_url') ||
    normalized.includes('image input') ||
    normalized.includes('images are not supported') ||
    normalized.includes('does not support images') ||
    normalized.includes('does not support vision') ||
    normalized.includes('multimodal') ||
    normalized.includes('multi-modal') ||
    normalized.includes('unsupported content type') ||
    normalized.includes('invalid content type') ||
    normalized.includes('only text') ||
    normalized.includes('text only') ||
    normalized.includes('vision is not supported');
};

const isImageCapabilityError = (err: unknown): boolean => (
  isImageCapabilityErrorMessage(getErrorMessage(err))
);

const collectImagePayloads = (
  imageB64: string | undefined | null,
  imagesB64: readonly string[] | undefined | null
): string[] => {
  const imagePayloads: string[] = [];
  if (Array.isArray(imagesB64) && imagesB64.length > 0) {
    imagesB64.forEach((image) => {
      if (typeof image === 'string' && image.trim()) {
        imagePayloads.push(image.trim());
      }
    });
  } else if (imageB64 && typeof imageB64 === 'string' && imageB64.trim()) {
    imagePayloads.push(imageB64.trim());
  }
  return imagePayloads;
};

export const probeModelVisionCapability = async (params: VisionProbeParams): Promise<VisionProbeResult> => {
  const endpointBase = params.customEndpoint && params.customEndpoint.trim() ? params.customEndpoint.trim() : "http://localhost:11434/v1";
  const cleanEndpoint = endpointBase.endsWith('/') ? endpointBase.slice(0, -1) : endpointBase;
  const model = params.customModel && params.customModel.trim() ? params.customModel.trim() : "llama3";
  const cleanImagePayload = params.imagePayload.startsWith("data:")
    ? params.imagePayload
    : `data:image/png;base64,${params.imagePayload}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (params.customApiKey && params.customApiKey.trim()) {
    headers["Authorization"] = `Bearer ${params.customApiKey.trim()}`;
  }

  const response = await fetch(`${cleanEndpoint}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are a capability detector. Reply with exactly VISION_SUPPORTED only if you can inspect the attached image content. Otherwise reply exactly VISION_UNSUPPORTED."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Can you inspect the attached image? Reply exactly VISION_SUPPORTED or VISION_UNSUPPORTED." },
            { type: "image_url", image_url: { url: cleanImagePayload } }
          ]
        }
      ],
      temperature: 0,
      max_tokens: 8
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    const message = `Vision probe returned status ${response.status}: ${errorText}`;
    if (response.status === 429) {
      throw new ProviderRateLimitError(message);
    }
    if (isImageCapabilityErrorMessage(message)) {
      return { kind: 'unsupported', reason: message };
    }
    throw new Error(message);
  }

  const content = extractChatCompletionContent(await response.json()).trim().toLowerCase();
  if (content.includes('vision_supported')) {
    return { kind: 'supported', reason: '사전 이미지 probe에서 멀티모달 처리가 가능하다고 응답했습니다.' };
  }
  return { kind: 'unsupported', reason: `사전 이미지 probe 응답이 멀티모달 지원을 확인하지 못했습니다: ${content || 'empty response'}` };
};

export const extractTextFromImages = async (imagePayloads: readonly string[]): Promise<string> => {
  const { default: Tesseract } = await import('tesseract.js');
  Tesseract.setLogging(false);
  const languages = process.env.OCR_LANGUAGES || DEFAULT_OCR_LANGUAGES;
  const cachePath = process.env.OCR_CACHE_PATH || DEFAULT_OCR_CACHE_PATH;
  await fs.mkdir(cachePath, { recursive: true });

  const extractedTexts = await Promise.all(imagePayloads.map(async (imagePayload, index) => {
    const result = await Tesseract.recognize(imagePayload, languages, { cachePath });
    const text = result.data.text.trim();
    return text ? `[이미지 ${index + 1} OCR]\n${text}` : '';
  }));

  return extractedTexts.filter((text) => text.trim()).join('\n\n');
};

const buildOcrFallbackContext = async (params: {
  readonly imagePayloads: readonly string[];
  readonly modelName: string | undefined | null;
  readonly extractor: ImageTextExtractor;
  readonly reason: string;
}): Promise<OcrFallbackContext> => {
  const modelName = params.modelName && params.modelName.trim() ? params.modelName.trim() : '선택한 OpenAI-compatible/로컬 모델';
  let extractedText = '';
  let ocrErrorMessage = '';
  try {
    extractedText = (await params.extractor(params.imagePayloads)).trim();
  } catch (err: unknown) {
    ocrErrorMessage = getErrorMessage(err);
  }

  const notice = extractedText
    ? `${params.reason} 첨부 이미지는 서버 OCR로 문구를 추출한 뒤 OCR 텍스트만 광고 심사에 반영했습니다.`
    : ocrErrorMessage
      ? `${params.reason} 서버 OCR을 실행했지만 실패했습니다. OCR 오류: ${ocrErrorMessage}. 따라서 시각 요소 평가는 제외되고 입력 텍스트만 심사했습니다.`
    : `${params.reason} 서버 OCR을 실행했지만, 이미지에서 판독 가능한 문구를 찾지 못했습니다. 따라서 시각 요소 평가는 제외되고 입력 텍스트만 심사했습니다.`;

  return {
    used: true,
    extractedText,
    notice
  };
};

export async function executeLLMAnalysis(payload: LLMAdapterPayload, adapterType: string): Promise<SystemAnalysisResult> {
  const { textStr, imageB64, imagesB64, systemInstruction, customModel, customEndpoint, customApiKey, globalApiKey } = payload;
  
  if (adapterType === 'GEMINI' || !adapterType) {
    const activeApiKey = (typeof customApiKey === 'string' && customApiKey.trim()) ? customApiKey.trim() : globalApiKey;
    if (!activeApiKey) {
      throw new MissingApiKeyError("정부 RAG 데이터 연결을 처리할 Gemini API Key가 할당되지 않았습니다. 아하시스턴트 AI 정밀 진단을 실행하시려면 상단의 [LLM 설정] 탭으로 이동하시어 API Key를 등록해주십시오.");
    }

    const dynamicAi = new GoogleGenAI({
      apiKey: activeApiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const adText = textStr.trim() ? `"${textStr}"` : `"(텍스트는 별도로 입력하지 않았음. 이미지 내부의 텍스트와 시각 요소를 바탕으로 심사해주십시오.)"`;
    const parts: any[] = [{ text: `아래 내용을 분석해주십시오:\n\n광고 텍스트 원안: ${adText}` }];
    
    const imagePayloads = collectImagePayloads(imageB64, imagesB64);

    if (imagePayloads.length > 0) {
      imagePayloads.forEach((imgData) => {
        const mime = imgData.match(/data:(.*?);base64,/)?.[1] || "image/png";
        const cleanBase64 = imgData.replace(/^data:image\/\w+;base64,/, "");
        parts.push({ inlineData: { mimeType: mime, data: cleanBase64 } });
      });
      parts.push({ text: `[안내] 총 ${imagePayloads.length}개의 광고 이미지가 한 번에 첨부되었습니다. 텍스트 내용뿐만 아니라 각각의 이미지 내부의 시각적 요소(기만적인 원형 그래프 수치 왜곡, 안전성 검증 마크 미인증 무단 도용, 선정적인 상징물, 역사적 참사를 악용하거나 희하화하여 조롱하는 노란 리본이나 전쟁 참상 상업화 등 비주얼 검수 수칙)를 상세 진단하고 위반 시 정밀 감점을 더해주십시오.` });
    }

    const response = await dynamicAi.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: { systemInstruction, responseMimeType: "application/json" }
    }).catch((err: unknown) => {
      if (isProviderRateLimitError(err)) {
        throw new ProviderRateLimitError(getErrorMessage(err), { cause: err });
      }
      throw err;
    });

    return { responseText: response.text || "", usageMetadata: response.usageMetadata };
  } else {
    const endpointBase = customEndpoint && customEndpoint.trim() ? customEndpoint.trim() : "http://localhost:11434/v1";
    const cleanEndpoint = endpointBase.endsWith('/') ? endpointBase.slice(0, -1) : endpointBase;
    
    const messages = [
      { role: "system", content: systemInstruction }
    ];

    const userParts: any[] = [{ type: "text", text: `아래 내용을 광고 법률 기준에 따라 정밀 분석하여 법규 제재 항목, 벌점, 그리고 준법 대체 텍스트를 JSON 스키마 규격으로 즉시 도출하시오.\n\n광고 텍스트 원안: "${textStr}"` }];
    
    const imagePayloads = collectImagePayloads(imageB64, imagesB64);
    const supportsVision = payload.forceImageInput === true || modelSupportsVision(customModel);

    if (imagePayloads.length > 0) {
      if (supportsVision) {
        imagePayloads.forEach((imgData) => {
          const cleanBase64 = imgData.startsWith("data:") ? imgData : `data:image/png;base64,${imgData}`;
          userParts.push({ type: "image_url", image_url: { url: cleanBase64 } });
        });
      } else {
        userParts[0].text += `\n[안내: 사용자가 이미지를 첨부했으나 현재 검수 모델인 ${customModel}은 시각 분석을 미지원하는 텍스트 전용 모델이므로 이미지는 심사에서 제외되었습니다. 오로지 텍스트 내용만을 엄격히 감수하십시오.]`;
      }
    }

    messages.push({ role: "user", content: userParts } as any);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (customApiKey && customApiKey.trim()) {
      headers["Authorization"] = `Bearer ${customApiKey.trim()}`;
    }

    const fetchResponse = await fetch(`${cleanEndpoint}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: customModel && customModel.trim() ? customModel.trim() : "llama3",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      const message = `Endpoint returned status ${fetchResponse.status}: ${errorText}`;
      if (fetchResponse.status === 429) {
        throw new ProviderRateLimitError(message);
      }
      throw new Error(message);
    }

    const resJson = await fetchResponse.json() as any;
    return { responseText: resJson.choices?.[0]?.message?.content || "" };
  }
}

// Run individual analyze query (text + image)
export async function performAnalysis(params: {
  text: any;
  imageB64: any;
  imagesB64: any;
  adapterType: any;
  customModel: any;
  customEndpoint: any;
  customApiKey: any;
  websiteUrl: any;
  additionalContext: any;
  analysisMode?: any;
  globalApiKey: string | undefined;
  ocrExtractor?: ImageTextExtractor;
  visionProbe?: VisionProbeFunction;
  forceOcrFallback?: boolean;
  ocrFallbackReason?: string;
}) {
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
  let usageMetadata: any = null;
  const originalImagePayloads = collectImagePayloads(imageB64, imagesB64);
  const adapterTypeStr = typeof adapterType === 'string' ? adapterType : '';
  const customModelStr = typeof customModel === 'string' ? customModel : '';
  const probeRequired = !params.forceOcrFallback && shouldProbeVisionCapability({
    adapterType: adapterTypeStr,
    modelName: customModelStr,
    hasImages: originalImagePayloads.length > 0,
  });
  const visionProbeResult = probeRequired
    ? await (params.visionProbe || probeModelVisionCapability)({
      imagePayload: originalImagePayloads[0] || '',
      customModel: customModelStr,
      customEndpoint: typeof customEndpoint === 'string' ? customEndpoint : '',
      customApiKey: typeof customApiKey === 'string' ? customApiKey : '',
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
  const imageB64ForAnalysis = ocrFallback.used ? null : imageB64;
  const imagesB64ForAnalysis = ocrFallback.used ? null : imagesB64;
  const forceImageInput = !ocrFallback.used && adapterTypeStr !== 'GEMINI' && visionProbeResult.kind === 'supported';
  const canRetryWithOcrFallback = !ocrFallback.used && originalImagePayloads.length > 0 && adapterTypeStr !== 'GEMINI';
  const retryWithOcrFallback = (reason: string) => performAnalysis({
    ...params,
    forceOcrFallback: true,
    ocrFallbackReason: reason,
  });

  const activeApiKey = (typeof customApiKey === 'string' && customApiKey.trim()) ? customApiKey.trim() : globalApiKey;

  if ((adapterType === 'GEMINI' || !adapterType) && !activeApiKey) {
    const err: any = new Error("RAG 연산을 처리할 Gemini API Key가 할당되지 않았습니다. 아하시스턴트 정밀 진단을 구동하시려면 상단의 [LLM 설정] 탭으로 이동하시어 API Key를 등록해주십시오.");
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  // 0. Crawl web page content if websiteUrl is given
  let websiteText = "";
  if (websiteUrl && typeof websiteUrl === 'string' && websiteUrl.trim()) {
    try {
      const fetchRes = await fetch(websiteUrl.trim(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, bg-KR) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      if (fetchRes.ok) {
        const rawHtml = await fetchRes.text();
        let textOnly = rawHtml
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        websiteText = textOnly.substring(0, 1500);
      } else {
        websiteText = `[Error: URL fetch failed with status ${fetchRes.status}]`;
      }
    } catch (err: any) {
      websiteText = `[Error: URL fetch Exception - ${err.message}]`;
    }
  }

  // Combine input sources dynamically for indexing and RAG alignment
  let combinedInputText = textStrForAnalysis;
  if (websiteText) {
    combinedInputText += `\n[수집된 웹페이지 내용]:\n${websiteText}`;
  }
  if (additionalContext && typeof additionalContext === 'string' && additionalContext.trim()) {
    combinedInputText += `\n[배경 맥락 및 시점/형태 요소]:\n${additionalContext}`;
  }

  const searchTargetText = combinedInputText.trim() || "(이미지 단독 심사)";

  // 1. Unified parsed input and dynamic context matching
  const retrieved = retrieveGuidelines(searchTargetText);
  const fewShots = retrieveFewShots(searchTargetText);

  // Filtered law clauses mapping
  const matchedLawsContext = retrieved.map(r => {
    return `[${r.article.clause}] (Tier ${r.article.tier}) - ${r.article.text}`;
  }).join('\n');

  // Past cases guidelines 2-shot setting
  const fewShotContext = fewShots.map((fs, idx) => {
    return `[Past Case #${idx+1}]
- Input Text: "${fs.inputText}"
- Verdict: ${fs.verdict}
- Meta: Product Type: ${fs.meta.productType}, Target: ${fs.meta.targets}, Domain: ${fs.meta.regulatoryDomain}
- Compliance Score: ${fs.score}`;
  }).join('\n\n');

  const fullLibraryContext = REGULATORY_LIBRARY.map(article => {
    return `[${article.clause}] (Tier ${article.tier}) - ${article.text}`;
  }).join('\n\n');

  const productDomains = ["화장품법", "식품표시광고법", "의료법", "어린이식생활법", "국민건강증진법"];
  const productArticles = REGULATORY_LIBRARY.filter(article => productDomains.includes(article.domain));
  const productLawsContext = productArticles.map(article => `[${article.clause}] - ${article.text}`).join('\n\n');
  const systemInstructionLegalProduct = getSystemInstruction(productLawsContext, fewShotContext);

  const financeDomains = ["금융소비자보호법", "게임산업진흥법"];
  const financeArticles = REGULATORY_LIBRARY.filter(article => financeDomains.includes(article.domain));
  const financeLawsContext = financeArticles.map(article => `[${article.clause}] - ${article.text}`).join('\n\n');
  const systemInstructionLegalFinance = `${getLegalFinanceInstruction()}\n\n[참조 법령 및 가이드라인]\n${financeLawsContext}`;

  const commerceDomains = ["표시광고법", "소비자기본법", "민법", "전자상거래법", "옥외광고물법"];
  const commerceArticles = REGULATORY_LIBRARY.filter(article => commerceDomains.includes(article.domain));
  const commerceLawsContext = commerceArticles.map(article => `[${article.clause}] - ${article.text}`).join('\n\n');
  const systemInstructionLegalCommerce = `${getLegalCommerceInstruction()}\n\n[참조 법령 및 가이드라인]\n${commerceLawsContext}`;

  const netDomains = ["정보통신망법", "아동복지법"];
  const netArticles = REGULATORY_LIBRARY.filter(article => netDomains.includes(article.domain));
  const netLawsContext = netArticles.map(article => `[${article.clause}] - ${article.text}`).join('\n\n');
  const systemInstructionLegalNet = `${getLegalNetInstruction()}\n\n[참조 법령 및 가이드라인]\n${netLawsContext}`;

  const socialArticles = REGULATORY_LIBRARY.filter(article => article.tier === 4);
  const socialLawsContext = socialArticles.map(article => `[${article.clause}] (Tier ${article.tier}) - ${article.text}`).join('\n\n');

  const systemInstructionSocial = `${getSocialControversyInstruction()}\n\n[참조 법령 및 가이드라인]\n${socialLawsContext}`;
  const systemInstructionEsg = getEsgGreenwashingInstruction();
  const systemInstructionPrivacy = getPrivacyProtectionInstruction();
  const systemInstructionYouth = getYouthProtectionInstruction();
  const systemInstructionCopyright = getCopyrightProtectionInstruction();

  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let hasUsage = false;

  const orchestratorPayload: LLMAdapterPayload = {
    textStr: textStrForAnalysis,
    imageB64: imageB64ForAnalysis,
    imagesB64: imagesB64ForAnalysis,
    systemInstruction: `${getOrchestratorRoutingInstruction()}\n\n[참조 준법 가이드라인 데이터베이스]\n${fullLibraryContext}`,
    customModel,
    customEndpoint,
    customApiKey,
    globalApiKey,
    forceImageInput
  };

  let routeDecision = {
    needLegalProduct: true,
    needLegalFinance: false,
    needLegalCommerce: false,
    needLegalNet: false,
    needSocial: false,
    needEsg: false,
    needPrivacy: false,
    needYouth: false,
    needCopyright: false,
    legalProductSegment: "",
    legalFinanceSegment: "",
    legalCommerceSegment: "",
    legalNetSegment: "",
    socialSegment: "",
    esgSegment: "",
    privacySegment: "",
    youthSegment: "",
    copyrightSegment: ""
  };

  const hasCustomKey = !!(customApiKey && customApiKey.trim());
  const finalMode = hasCustomKey ? analysisMode : 'optimized';
  const isGeminiAdapter = adapterType === 'GEMINI' || !adapterType;
  const hasImageInput = originalImagePayloads.length > 0;
  const shouldUseConsolidatedGeminiReview = isGeminiAdapter && hasImageInput;

  if (finalMode === 'full' || shouldUseConsolidatedGeminiReview) {
    routeDecision = {
      needLegalProduct: true,
      needLegalFinance: true,
      needLegalCommerce: true,
      needLegalNet: true,
      needSocial: true,
      needEsg: true,
      needPrivacy: true,
      needYouth: true,
      needCopyright: true,
      legalProductSegment: "",
      legalFinanceSegment: "",
      legalCommerceSegment: "",
      legalNetSegment: "",
      socialSegment: "",
      esgSegment: "",
      privacySegment: "",
      youthSegment: "",
      copyrightSegment: ""
    };
  } else {
    try {
      const routeResult = await executeLLMAnalysis(orchestratorPayload, adapterType);
      if (routeResult.usageMetadata) {
        hasUsage = true;
        promptTokens += routeResult.usageMetadata.promptTokenCount || 0;
        completionTokens += routeResult.usageMetadata.candidatesTokenCount || 0;
        totalTokens += routeResult.usageMetadata.totalTokenCount || 0;
      }
      
      const parsedRoute = repairAndParseJson(routeResult.responseText);
      
      if (parsedRoute) {
        routeDecision.needLegalProduct = true;
        routeDecision.needLegalFinance = parsedRoute.needLegalFinance === true;
        routeDecision.needLegalCommerce = parsedRoute.needLegalCommerce === true;
        routeDecision.needLegalNet = parsedRoute.needLegalNet === true;
        routeDecision.needSocial = parsedRoute.needSocial === true;
        routeDecision.needEsg = parsedRoute.needEsg === true;
        routeDecision.needPrivacy = parsedRoute.needPrivacy === true;
        routeDecision.needYouth = parsedRoute.needYouth === true;
        routeDecision.needCopyright = parsedRoute.needCopyright === true;
        routeDecision.legalProductSegment = typeof parsedRoute.legalProductSegment === 'string' ? parsedRoute.legalProductSegment.trim() : "";
        routeDecision.legalFinanceSegment = typeof parsedRoute.legalFinanceSegment === 'string' ? parsedRoute.legalFinanceSegment.trim() : "";
        routeDecision.legalCommerceSegment = typeof parsedRoute.legalCommerceSegment === 'string' ? parsedRoute.legalCommerceSegment.trim() : "";
        routeDecision.legalNetSegment = typeof parsedRoute.legalNetSegment === 'string' ? parsedRoute.legalNetSegment.trim() : "";
        routeDecision.socialSegment = typeof parsedRoute.socialSegment === 'string' ? parsedRoute.socialSegment.trim() : "";
        routeDecision.esgSegment = typeof parsedRoute.esgSegment === 'string' ? parsedRoute.esgSegment.trim() : "";
        routeDecision.privacySegment = typeof parsedRoute.privacySegment === 'string' ? parsedRoute.privacySegment.trim() : "";
        routeDecision.youthSegment = typeof parsedRoute.youthSegment === 'string' ? parsedRoute.youthSegment.trim() : "";
        routeDecision.copyrightSegment = typeof parsedRoute.copyrightSegment === 'string' ? parsedRoute.copyrightSegment.trim() : "";
      }
    } catch (err) {
      if (canRetryWithOcrFallback && isImageCapabilityError(err)) {
        return retryWithOcrFallback(`${modelNameForNotice}의 이미지 직접 처리 probe 이후 실제 분석 요청에서 이미지 입력 미지원 오류가 발생했습니다.`);
      }
      if (!isRecoverableRoutingError(err)) {
        throw err;
      }
      console.warn("Orchestrator routing failed, falling back to full review:", err);
      routeDecision = {
        needLegalProduct: true,
        needLegalFinance: true,
        needLegalCommerce: true,
        needLegalNet: true,
        needSocial: true,
        needEsg: true,
        needPrivacy: true,
        needYouth: true,
        needCopyright: true,
        legalProductSegment: "",
        legalFinanceSegment: "",
        legalCommerceSegment: "",
        legalNetSegment: "",
        socialSegment: "",
        esgSegment: "",
        privacySegment: "",
        youthSegment: "",
        copyrightSegment: ""
      };
    }
  }

  const payloads: LLMAdapterPayload[] = [];
  if (shouldUseConsolidatedGeminiReview) {
    payloads.push({
      textStr: combinedInputText || textStrForAnalysis,
      imageB64: imageB64ForAnalysis,
      imagesB64: imagesB64ForAnalysis,
      systemInstruction: `${getSystemInstruction(fullLibraryContext, fewShotContext)}

[Gemini 이미지 통합 검토 지시]
첨부 이미지가 있는 경우에는 다중 에이전트 팬아웃 대신 이 단일 호출에서 식의약/보건, 금융/게임, 공정거래/전자상거래, 정보망/아동복지, 사회적 논란, ESG, 개인정보, 청소년 보호, 저작권/상표권 위험을 모두 종합 심사하십시오.
반드시 기존 JSON 스키마를 유지하고, 이미지 내부 문구와 시각 요소의 위반 사항도 violations, matchedLaws, imageAlternativeProposal에 병합해 반환하십시오.`,
      customModel,
      customEndpoint,
      customApiKey,
      globalApiKey,
      forceImageInput
    });
  } else {
    if (routeDecision.needLegalProduct) {
      payloads.push({
        textStr: routeDecision.legalProductSegment || textStrForAnalysis,
        imageB64: imageB64ForAnalysis,
        imagesB64: imagesB64ForAnalysis,
        systemInstruction: systemInstructionLegalProduct,
        customModel,
        customEndpoint,
        customApiKey,
        globalApiKey,
        forceImageInput
      });
    }
    if (routeDecision.needLegalFinance) {
      payloads.push({
        textStr: routeDecision.legalFinanceSegment || textStrForAnalysis,
        imageB64: imageB64ForAnalysis,
        imagesB64: imagesB64ForAnalysis,
        systemInstruction: systemInstructionLegalFinance,
        customModel,
        customEndpoint,
        customApiKey,
        globalApiKey,
        forceImageInput
      });
    }
    if (routeDecision.needLegalCommerce) {
      payloads.push({
        textStr: routeDecision.legalCommerceSegment || textStrForAnalysis,
        imageB64: imageB64ForAnalysis,
        imagesB64: imagesB64ForAnalysis,
        systemInstruction: systemInstructionLegalCommerce,
        customModel,
        customEndpoint,
        customApiKey,
        globalApiKey,
        forceImageInput
      });
    }
    if (routeDecision.needLegalNet) {
      payloads.push({
        textStr: routeDecision.legalNetSegment || textStrForAnalysis,
        imageB64: imageB64ForAnalysis,
        imagesB64: imagesB64ForAnalysis,
        systemInstruction: systemInstructionLegalNet,
        customModel,
        customEndpoint,
        customApiKey,
        globalApiKey,
        forceImageInput
      });
    }
    if (routeDecision.needSocial) {
      payloads.push({
        textStr: routeDecision.socialSegment || textStrForAnalysis,
        imageB64: imageB64ForAnalysis,
        imagesB64: imagesB64ForAnalysis,
        systemInstruction: systemInstructionSocial,
        customModel,
        customEndpoint,
        customApiKey,
        globalApiKey,
        forceImageInput
      });
    }
    if (routeDecision.needEsg) {
      payloads.push({
        textStr: routeDecision.esgSegment || textStrForAnalysis,
        imageB64: imageB64ForAnalysis,
        imagesB64: imagesB64ForAnalysis,
        systemInstruction: systemInstructionEsg,
        customModel,
        customEndpoint,
        customApiKey,
        globalApiKey,
        forceImageInput
      });
    }
    if (routeDecision.needPrivacy) {
      payloads.push({
        textStr: routeDecision.privacySegment || textStrForAnalysis,
        imageB64: imageB64ForAnalysis,
        imagesB64: imagesB64ForAnalysis,
        systemInstruction: systemInstructionPrivacy,
        customModel,
        customEndpoint,
        customApiKey,
        globalApiKey,
        forceImageInput
      });
    }
    if (routeDecision.needYouth) {
      payloads.push({
        textStr: routeDecision.youthSegment || textStrForAnalysis,
        imageB64: imageB64ForAnalysis,
        imagesB64: imagesB64ForAnalysis,
        systemInstruction: systemInstructionYouth,
        customModel,
        customEndpoint,
        customApiKey,
        globalApiKey,
        forceImageInput
      });
    }
    if (routeDecision.needCopyright) {
      payloads.push({
        textStr: routeDecision.copyrightSegment || textStrForAnalysis,
        imageB64: imageB64ForAnalysis,
        imagesB64: imagesB64ForAnalysis,
        systemInstruction: systemInstructionCopyright,
        customModel,
        customEndpoint,
        customApiKey,
        globalApiKey,
        forceImageInput
      });
    }
  }

  const agentResults = await Promise.allSettled(payloads.map(p => executeLLMAnalysis(p, adapterType)));
  const parsedAgentsData: any[] = [];
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

  const agentsActivated: string[] = [];
  if (routeDecision.needLegalProduct) agentsActivated.push("LEGAL_PRODUCT (식의약/보건 규정)");
  if (routeDecision.needLegalFinance) agentsActivated.push("LEGAL_FINANCE (금융/게임 규정)");
  if (routeDecision.needLegalCommerce) agentsActivated.push("LEGAL_COMMERCE (공정거래/계약 규정)");
  if (routeDecision.needLegalNet) agentsActivated.push("LEGAL_NET (정보망/아동복지 규정)");
  if (routeDecision.needSocial) agentsActivated.push("SOCIAL (사회적 논란/재난 심의)");
  if (routeDecision.needEsg) agentsActivated.push("ESG (그린워싱 광고 심사)");
  if (routeDecision.needPrivacy) agentsActivated.push("PRIVACY (개인정보 보호 심사)");
  if (routeDecision.needYouth) agentsActivated.push("YOUTH (청소년 위해/사행성 심사)");
  if (routeDecision.needCopyright) agentsActivated.push("COPYRIGHT (지식재산권 보호 심사)");

  const finalResultData: any = {
    parsedMeta: (parsedAgentsData[0] && parsedAgentsData[0].parsedMeta) || (parsedAgentsData[1] && parsedAgentsData[1].parsedMeta) || {
      productType: DEFAULT_PRODUCT_TYPE,
      targets: DEFAULT_TARGETS,
      regulatoryDomain: DEFAULT_REGULATORY_DOMAIN,
      channels: DEFAULT_CHANNELS
    },
    score: BASE_SCORE,
    violations: [],
    matchedLaws: [],
    agentsActivated,
    imageAlternativeProposal: {
      detectedVisualCopys: [],
      visualViolations: [],
      visualRemediationSteps: [],
      alternativeVisualDraft: ""
    }
  };

  parsedAgentsData.forEach(p => {
    if (p.violations && Array.isArray(p.violations)) {
      finalResultData.violations.push(...p.violations);
    }
  });

  finalResultData.violations.forEach((v: any, index: number) => {
    v.id = v.id || `violation_${index + 1}`;
  });

  let totalDeductions = 0;
  finalResultData.violations.forEach((v: any) => {
    const points = typeof v.deductionPoints === 'number' ? v.deductionPoints : 0;
    totalDeductions += points;
  });
  finalResultData.score = Math.max(0, 100 - totalDeductions);

  const seenLaws = new Set<string>();
  parsedAgentsData.forEach(p => {
    if (p.matchedLaws && Array.isArray(p.matchedLaws)) {
      p.matchedLaws.forEach((l: any) => {
        const key = `${l.title || ''}-${l.tier || 0}`;
        if (!seenLaws.has(key)) {
          seenLaws.add(key);
          finalResultData.matchedLaws.push(l);
        }
      });
    }
  });

  const detectedVisualCopysSet = new Set<string>();
  const visualViolationsSet = new Set<string>();
  const visualRemediationStepsSet = new Set<string>();
  const alternativeDrafts: string[] = [];

  parsedAgentsData.forEach(p => {
    if (p.imageAlternativeProposal) {
      const proposal = p.imageAlternativeProposal;
      if (Array.isArray(proposal.detectedVisualCopys)) {
        proposal.detectedVisualCopys.forEach((c: string) => detectedVisualCopysSet.add(c));
      }
      if (Array.isArray(proposal.visualViolations)) {
        proposal.visualViolations.forEach((v: string) => visualViolationsSet.add(v));
      }
      if (Array.isArray(proposal.visualRemediationSteps)) {
        proposal.visualRemediationSteps.forEach((s: string) => visualRemediationStepsSet.add(s));
      }
      if (typeof proposal.alternativeVisualDraft === 'string' && proposal.alternativeVisualDraft.trim()) {
        alternativeDrafts.push(proposal.alternativeVisualDraft.trim());
      }
    }
  });

  finalResultData.imageAlternativeProposal = {
    detectedVisualCopys: Array.from(detectedVisualCopysSet),
    visualViolations: Array.from(visualViolationsSet),
    visualRemediationSteps: Array.from(visualRemediationStepsSet),
    alternativeVisualDraft: alternativeDrafts.join("\n\n")
  };

  usageMetadata = hasUsage ? {
    promptTokenCount: promptTokens,
    candidatesTokenCount: completionTokens,
    totalTokenCount: totalTokens
  } : null;

  // --- Postprocessing: Authentic Citation Verification & Action Plan generation ---
  if (finalResultData.violations && Array.isArray(finalResultData.violations)) {
    finalResultData.violations = finalResultData.violations.map((v: any, index: number) => {
      // Look up against the statutory REGULATORY_LIBRARY
      const matchingLaw = REGULATORY_LIBRARY.find(law => {
        const clauseNorm = (v.clause || "").replace(/\s+/g, "").toLowerCase();
        const lawClauseNorm = (law.clause || "").replace(/\s+/g, "").toLowerCase();
        const lawDomainNorm = (law.domain || "").replace(/\s+/g, "").toLowerCase();

        return clauseNorm.includes(lawClauseNorm) || 
               lawClauseNorm.includes(clauseNorm) ||
               clauseNorm.includes(lawDomainNorm);
      });

      const isCitationVerified = !!matchingLaw;
      const verifiedLawDetails = matchingLaw ? {
        id: matchingLaw.id,
        clause: matchingLaw.clause,
        domain: matchingLaw.domain,
        exactText: matchingLaw.text
      } : null;

      // Formulate customized 5-step action plan
      let actionPlan = v.actionPlan;
      if (!actionPlan || !Array.isArray(actionPlan) || actionPlan.length < 5) {
        actionPlan = generateDefaultActionPlan(v.originalFragment, v.replacement, matchingLaw ? matchingLaw.domain : '');
      }

      return {
        id: v.id || `violation_${index + 1}`,
        clause: v.clause,
        severity: v.severity,
        description: v.description,
        deductionPoints: v.deductionPoints,
        originalFragment: v.originalFragment,
        replacement: v.replacement,
        isCitationVerified,
        verifiedLawDetails,
        actionPlan
      };
    });
  }

  // Append RAG relevance calculations for missing law elements
  if (!finalResultData.matchedLaws || finalResultData.matchedLaws.length === 0) {
    finalResultData.matchedLaws = retrieved.map(r => ({
      tier: r.article.tier,
      title: r.article.clause,
      description: r.article.text,
      relevance: r.score
    }));
  }

  const duration = Date.now() - startTime;
  finalResultData.analysisTimeMs = duration;
  finalResultData.modelUsed = customModel && customModel.trim() ? customModel.trim() : (adapterType === 'GEMINI' || !adapterType ? 'gemini-2.5-flash' : 'llama3');

  // Attach token consumption analytics to finalResultData
  if (usageMetadata) {
    finalResultData.usage = {
      promptTokens: usageMetadata.promptTokenCount || 0,
      completionTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0
    };
  } else {
    // Estimate token count if mock adapter is run
    const promptTk = Math.round((textStrForAnalysis || "").length * 1.5 + (imageB64ForAnalysis ? 1000 : 0) + 400);
    const completionTk = Math.round(JSON.stringify(finalResultData).length / 3);
    finalResultData.usage = {
      promptTokens: promptTk,
      completionTokens: completionTk,
      totalTokens: promptTk + completionTk
    };
  }

  if (failedAgentMessages.length > 0) {
    finalResultData.localLlmError = `일부 전문 에이전트 분석이 실패하여 성공한 결과만 종합했습니다. ${failedAgentMessages.join(' / ')}`;
  }

  if (ocrFallback.used) {
    finalResultData.ocrFallbackUsed = true;
    finalResultData.ocrExtractedText = ocrFallback.extractedText;
    finalResultData.ocrNotice = ocrFallback.notice;
    finalResultData.localLlmError = finalResultData.localLlmError
      ? `${ocrFallback.notice} ${finalResultData.localLlmError}`
      : ocrFallback.notice;
  }

  finalResultData.pastCases = fewShots.map(fs => ({
    id: fs.id,
    title: `${fs.meta.productType} 과거 자진 심의 사례`,
    originalText: fs.inputText,
    resolution: `감점 점수: ${fs.score}점, 판결: ${fs.verdict}`,
    verdict: fs.verdict,
    similarity: 90
  }));

  // Record this evaluation event dynamically to our knowledge-base feed so that it cumulates self-learning!
  addToHistoryCollection({
    id: `hist_${Date.now()}`,
    inputText: textStrForAnalysis || "(이미지 단독 심사)",
    imagePresent: originalImagePayloads.length > 0,
    score: finalResultData.score,
    verdict: finalResultData.score >= 80 ? 'Approved' : 'Rejected',
    meta: finalResultData.parsedMeta,
    timestamp: new Date().toISOString(),
    result: finalResultData
  });

  return finalResultData;
}
