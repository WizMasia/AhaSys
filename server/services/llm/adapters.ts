import { GoogleGenAI } from '@google/genai';
import { modelSupportsVision } from '../../../shared/modelCapabilities';
import {
  getErrorMessage,
  isProviderRateLimitError,
  MissingApiKeyError,
  ProviderRateLimitError,
} from './errors';
import { extractChatCompletionContent } from './responseParsing';
import { collectImagePayloads } from './visionOcr';
import type { LLMAdapterPayload, SystemAnalysisResult } from './types';

type GeminiPart =
  | { readonly text: string }
  | { readonly inlineData: { readonly mimeType: string; readonly data: string } };

type OpenAiTextPart = { readonly type: "text"; readonly text: string };
type OpenAiImagePart = { readonly type: "image_url"; readonly image_url: { readonly url: string } };
type OpenAiUserPart = OpenAiTextPart | OpenAiImagePart;
type ChatMessage =
  | { readonly role: "system"; readonly content: string }
  | { readonly role: "user"; readonly content: readonly OpenAiUserPart[] };

const buildGeminiParts = (textStr: string, imagePayloads: readonly string[]): GeminiPart[] => {
  const adText = textStr.trim() ? `\"${textStr}\"` : `\"(텍스트는 별도로 입력하지 않았음. 이미지 내부의 텍스트와 시각 요소를 바탕으로 심사해주십시오.)\"`;
  const parts: GeminiPart[] = [{ text: `아래 내용을 분석해주십시오:\n\n광고 텍스트 원안: ${adText}` }];

  if (imagePayloads.length > 0) {
    imagePayloads.forEach((imgData) => {
      const mime = imgData.match(/data:(.*?);base64,/)?.[1] || "image/png";
      const cleanBase64 = imgData.replace(/^data:image\/\w+;base64,/, "");
      parts.push({ inlineData: { mimeType: mime, data: cleanBase64 } });
    });
    parts.push({ text: `[안내] 총 ${imagePayloads.length}개의 광고 이미지가 한 번에 첨부되었습니다. 텍스트 내용뿐만 아니라 각각의 이미지 내부의 시각적 요소(기만적인 원형 그래프 수치 왜곡, 안전성 검증 마크 미인증 무단 도용, 선정적인 상징물, 역사적 참사를 악용하거나 희하화하여 조롱하는 노란 리본이나 전쟁 참상 상업화 등 비주얼 검수 수칙)를 상세 진단하고 위반 시 정밀 감점을 더해주십시오.` });
  }

  return parts;
};

const buildOpenAiUserParts = (
  textStr: string,
  imagePayloads: readonly string[],
  customModel: string | undefined | null,
  forceImageInput: boolean | undefined
): OpenAiUserPart[] => {
  const supportsVision = forceImageInput === true || modelSupportsVision(customModel);
  let userText = `아래 내용을 광고 법률 기준에 따라 정밀 분석하여 법규 제재 항목, 벌점, 그리고 준법 대체 텍스트를 JSON 스키마 규격으로 즉시 도출하시오.\n\n광고 텍스트 원안: \"${textStr}\"`;

  if (imagePayloads.length > 0 && !supportsVision) {
    userText += `\n[안내: 사용자가 이미지를 첨부했으나 현재 검수 모델인 ${customModel}은 시각 분석을 미지원하는 텍스트 전용 모델이므로 이미지는 심사에서 제외되었습니다. 오로지 텍스트 내용만을 엄격히 감수하십시오.]`;
  }

  const userParts: OpenAiUserPart[] = [{ type: "text", text: userText }];
  if (imagePayloads.length > 0 && supportsVision) {
    imagePayloads.forEach((imgData) => {
      const cleanBase64 = imgData.startsWith("data:") ? imgData : `data:image/png;base64,${imgData}`;
      userParts.push({ type: "image_url", image_url: { url: cleanBase64 } });
    });
  }

  return userParts;
};

const executeGeminiAnalysis = async (payload: LLMAdapterPayload): Promise<SystemAnalysisResult> => {
  const activeApiKey = (typeof payload.customApiKey === 'string' && payload.customApiKey.trim())
    ? payload.customApiKey.trim()
    : payload.globalApiKey;
  if (!activeApiKey) {
    throw new MissingApiKeyError("정부 RAG 데이터 연결을 처리할 Gemini API Key가 할당되지 않았습니다. 아하시스턴트 AI 정밀 진단을 실행하시려면 상단의 [LLM 설정] 탭으로 이동하시어 API Key를 등록해주십시오.");
  }

  const dynamicAi = new GoogleGenAI({
    apiKey: activeApiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  const imagePayloads = collectImagePayloads(payload.imageB64, payload.imagesB64);
  const response = await dynamicAi.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: buildGeminiParts(payload.textStr, imagePayloads) },
    config: { systemInstruction: payload.systemInstruction, responseMimeType: "application/json" }
  }).catch((err: unknown) => {
    if (isProviderRateLimitError(err)) {
      throw new ProviderRateLimitError(getErrorMessage(err), { cause: err });
    }
    throw err;
  });

  return { responseText: response.text || "", usageMetadata: response.usageMetadata };
};

const executeOpenAiCompatibleAnalysis = async (payload: LLMAdapterPayload): Promise<SystemAnalysisResult> => {
  const endpointBase = payload.customEndpoint && payload.customEndpoint.trim() ? payload.customEndpoint.trim() : "http://localhost:11434/v1";
  const cleanEndpoint = endpointBase.endsWith('/') ? endpointBase.slice(0, -1) : endpointBase;
  const imagePayloads = collectImagePayloads(payload.imageB64, payload.imagesB64);

  const messages: ChatMessage[] = [
    { role: "system", content: payload.systemInstruction },
    {
      role: "user",
      content: buildOpenAiUserParts(payload.textStr, imagePayloads, payload.customModel, payload.forceImageInput),
    },
  ];

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (payload.customApiKey && payload.customApiKey.trim()) {
    headers["Authorization"] = `Bearer ${payload.customApiKey.trim()}`;
  }

  const fetchResponse = await fetch(`${cleanEndpoint}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: payload.customModel && payload.customModel.trim() ? payload.customModel.trim() : "llama3",
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

  return { responseText: extractChatCompletionContent(await fetchResponse.json()) };
};

export async function executeLLMAnalysis(payload: LLMAdapterPayload, adapterType: string): Promise<SystemAnalysisResult> {
  if (adapterType === 'GEMINI' || !adapterType) {
    return executeGeminiAnalysis(payload);
  }

  return executeOpenAiCompatibleAnalysis(payload);
}
