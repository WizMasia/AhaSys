/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { LawArticle, REGULATORY_LIBRARY } from '../db/regulatoryLibrary';
import { getSystemInstruction, getSocialControversyInstruction, getEsgGreenwashingInstruction, getPrivacyProtectionInstruction, getYouthProtectionInstruction, getOrchestratorRoutingInstruction, getCopyrightProtectionInstruction } from '../prompts/compliancePrompt';

// Constants
export const BASE_SCORE = 100;
export const RAG_HARD_FILTER_SCORE = 80.0;
export const DEFAULT_PRODUCT_TYPE = "일반광고";
export const DEFAULT_TARGETS = "일반 대중";
export const DEFAULT_REGULATORY_DOMAIN = "표시광고법";
export const DEFAULT_CHANNELS = "모든 채널";

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

// In-Memory Database for History RAG Cumulative Self-learning Loop
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

export let historyCollection: HistItem[] = [];

export function clearHistoryCollection() {
  historyCollection = [];
}

export function getHistoryCollection() {
  return historyCollection;
}

export function addToHistoryCollection(item: HistItem) {
  historyCollection.unshift(item);
}

// Helper: Calculate keyword distance overlay for RAG similarity mapping
export function calculateSimilarity(text: string, article: LawArticle): number {
  const normText = text.toLowerCase();
  let hits = 0;
  for (const kw of article.keywords) {
    if (normText.includes(kw.toLowerCase())) {
      hits += 1;
    }
  }

  if (hits === 0) return 0;

  // Let's model a realistic distance where 0 is perfect hit
  // If we match 3+ keywords, distance is very low (e.g. 50-100)
  // Decays exponentially: Score = e ^ (-Distance / 1350.0) * 100
  // Let's map hits to Distance:
  let distance = 1000;
  if (hits === 1) distance = 400;
  else if (hits === 2) distance = 200;
  else if (hits >= 3) distance = 50;

  const score = Math.exp(-distance / 1350.0) * 100;
  return Math.round(score * 10) / 10;
}

// 7. Dynamic Autonomous Hybrid RAG searcher
export function retrieveGuidelines(text: string): { article: LawArticle; score: number }[] {
  const textLower = text.toLowerCase();
  const results: { article: LawArticle; score: number }[] = [];

  // Scannable keyword overrides (Special scanning for Tier 4 to protect against Semantic Dilution)
  let forcingHighT4 = false;
  const T4TriggerKeywords = ["세월호", "5.18", "holocaust", "홀로코스트", "우크라이나", "9/11", "이태원", "전쟁", "테러", "난민"];
  if (T4TriggerKeywords.some(kw => textLower.includes(kw))) {
    forcingHighT4 = true;
  }

  for (const article of REGULATORY_LIBRARY) {
    let relevanceScore = calculateSimilarity(text, article);

    // If forcing high T4 and this is the Tier 4 catastrophe clause, upgrade score to 100% directly
    if (forcingHighT4 && article.tier === 4) {
      relevanceScore = 100.0;
    }

    // Direct binding weights for Tier 1 products
    if (article.tier === 1) {
      const isCosmeticTrigger = ["화장품", "여드름", "피부", "주름", "아토피"].some(k => textLower.includes(k));
      const isSupplementTrigger = ["다이어트", "체지방", "비타민", "식약처"].some(k => textLower.includes(k));
      const isMedicalTrigger = ["수술", "치과", "병원", "치료"].some(k => textLower.includes(k));
      const isFinanceTrigger = ["수익률", "원금", "이자", "코인", "투자"].some(k => textLower.includes(k));

      if (article.domain === "화장품법" && isCosmeticTrigger) relevanceScore = Math.max(relevanceScore, 92.0);
      if (article.domain === "식품표시광고법" && isSupplementTrigger) relevanceScore = Math.max(relevanceScore, 94.0);
      if (article.domain === "의료법" && isMedicalTrigger) relevanceScore = Math.max(relevanceScore, 91.0);
      if (article.domain === "금융소비자보호법" && isFinanceTrigger) relevanceScore = Math.max(relevanceScore, 95.0);
    }

    // Section 8.2: 80% Hard Filter block
    if (relevanceScore >= RAG_HARD_FILTER_SCORE) {
      results.push({ article, score: relevanceScore });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// Fewshot search matching
export function retrieveFewShots(text: string): HistItem[] {
  // Simple scan matching product metadata or text
  const matchSet: HistItem[] = [];
  for (const item of historyCollection) {
    let intersection = 0;
    const words = item.inputText.split(/\s+/);
    for (const w of words) {
      if (w.length > 1 && text.includes(w)) {
        intersection++;
      }
    }
    if (intersection > 1 || item.score < 60) {
      matchSet.push(item);
    }
    if (matchSet.length >= 2) break; // We need maximum 2-shot for prompt loading
  }

  // Fallback to latest history if empty
  if (matchSet.length === 0 && historyCollection.length > 0) {
    return historyCollection.slice(0, Math.min(2, historyCollection.length));
  }

  return matchSet;
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
    
    const imagePayloads: string[] = [];
    if (Array.isArray(imagesB64) && imagesB64.length > 0) {
      imagesB64.forEach((img) => { if (typeof img === 'string' && img.trim()) imagePayloads.push(img.trim()); });
    } else if (imageB64 && typeof imageB64 === 'string' && imageB64.trim()) {
      imagePayloads.push(imageB64.trim());
    }

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
    });

    return { responseText: response.text || "", usageMetadata: response.usageMetadata };
  } else {
    const endpointBase = customEndpoint && customEndpoint.trim() ? customEndpoint.trim() : "http://localhost:11434/v1";
    const cleanEndpoint = endpointBase.endsWith('/') ? endpointBase.slice(0, -1) : endpointBase;
    
    const messages = [
      { role: "system", content: systemInstruction }
    ];

    const userParts: any[] = [{ type: "text", text: `아래 내용을 광고 법률 기준에 따라 정밀 분석하여 법규 제재 항목, 벌점, 그리고 준법 대체 텍스트를 JSON 스키마 규격으로 즉시 도출하시오.\n\n광고 텍스트 원안: "${textStr}"` }];
    
    const imagePayloads: string[] = [];
    if (Array.isArray(imagesB64) && imagesB64.length > 0) {
      imagesB64.forEach((img) => { if (typeof img === 'string' && img.trim()) imagePayloads.push(img.trim()); });
    } else if (imageB64 && typeof imageB64 === 'string' && imageB64.trim()) {
      imagePayloads.push(imageB64.trim());
    }

    const modelNameLower = (customModel || "").toLowerCase();
    const supportsVision = modelNameLower.includes("vision") || 
                           modelNameLower.includes("gemini") || 
                           modelNameLower.includes("gpt-4o") || 
                           modelNameLower.includes("claude-3") || 
                           modelNameLower.includes("llava");

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
      throw new Error(`Endpoint returned status ${fetchResponse.status}: ${await fetchResponse.text()}`);
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
  globalApiKey: string | undefined;
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
    globalApiKey
  } = params;

  const startTime = Date.now();
  const textStr = typeof text === 'string' ? text : "";
  let usageMetadata: any = null;

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
  let combinedInputText = textStr;
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

  const systemInstructionLegal = getSystemInstruction(matchedLawsContext, fewShotContext);
  const systemInstructionSocial = getSocialControversyInstruction();
  const systemInstructionEsg = getEsgGreenwashingInstruction();
  const systemInstructionPrivacy = getPrivacyProtectionInstruction();
  const systemInstructionYouth = getYouthProtectionInstruction();
  const systemInstructionCopyright = getCopyrightProtectionInstruction();

  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let hasUsage = false;

  const orchestratorPayload: LLMAdapterPayload = {
    textStr,
    imageB64,
    imagesB64,
    systemInstruction: getOrchestratorRoutingInstruction(),
    customModel,
    customEndpoint,
    customApiKey,
    globalApiKey
  };

  let routeDecision = {
    needLegal: true,
    needSocial: false,
    needEsg: false,
    needPrivacy: false,
    needYouth: false,
    needCopyright: false,
    legalSegment: "",
    socialSegment: "",
    esgSegment: "",
    privacySegment: "",
    youthSegment: "",
    copyrightSegment: ""
  };

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
  routeDecision.needLegal = true;
  routeDecision.needSocial = true;
      routeDecision.needSocial = parsedRoute.needSocial === true;
      routeDecision.needEsg = parsedRoute.needEsg === true;
      routeDecision.needPrivacy = parsedRoute.needPrivacy === true;
      routeDecision.needYouth = parsedRoute.needYouth === true;
      routeDecision.needCopyright = parsedRoute.needCopyright === true;
      routeDecision.legalSegment = typeof parsedRoute.legalSegment === 'string' ? parsedRoute.legalSegment.trim() : "";
      routeDecision.socialSegment = typeof parsedRoute.socialSegment === 'string' ? parsedRoute.socialSegment.trim() : "";
      routeDecision.esgSegment = typeof parsedRoute.esgSegment === 'string' ? parsedRoute.esgSegment.trim() : "";
      routeDecision.privacySegment = typeof parsedRoute.privacySegment === 'string' ? parsedRoute.privacySegment.trim() : "";
      routeDecision.youthSegment = typeof parsedRoute.youthSegment === 'string' ? parsedRoute.youthSegment.trim() : "";
      routeDecision.copyrightSegment = typeof parsedRoute.copyrightSegment === 'string' ? parsedRoute.copyrightSegment.trim() : "";
    }
  } catch (err) {
    console.warn("Orchestrator routing failed, falling back to full review:", err);
    routeDecision = {
      needLegal: true,
      needSocial: true,
      needEsg: true,
      needPrivacy: true,
      needYouth: true,
      needCopyright: true,
      legalSegment: "",
      socialSegment: "",
      esgSegment: "",
      privacySegment: "",
      youthSegment: "",
      copyrightSegment: ""
    };
  }

  routeDecision.needLegal = true;

  const payloads: any[] = [];
  if (routeDecision.needLegal) {
    payloads.push({
      textStr: textStr,
      imageB64,
      imagesB64,
      systemInstruction: systemInstructionLegal,
      customModel,
      customEndpoint,
      customApiKey,
      globalApiKey
    });
  }
  if (routeDecision.needSocial) {
    payloads.push({
      textStr: routeDecision.socialSegment || textStr,
      imageB64,
      imagesB64,
      systemInstruction: systemInstructionSocial,
      customModel,
      customEndpoint,
      customApiKey,
      globalApiKey
    });
  }
  if (routeDecision.needEsg) {
    payloads.push({
      textStr: routeDecision.esgSegment || textStr,
      imageB64,
      imagesB64,
      systemInstruction: systemInstructionEsg,
      customModel,
      customEndpoint,
      customApiKey,
      globalApiKey
    });
  }
  if (routeDecision.needPrivacy) {
    payloads.push({
      textStr: routeDecision.privacySegment || textStr,
      imageB64,
      imagesB64,
      systemInstruction: systemInstructionPrivacy,
      customModel,
      customEndpoint,
      customApiKey,
      globalApiKey
    });
  }
  if (routeDecision.needYouth) {
    payloads.push({
      textStr: routeDecision.youthSegment || textStr,
      imageB64,
      imagesB64,
      systemInstruction: systemInstructionYouth,
      customModel,
      customEndpoint,
      customApiKey,
      globalApiKey
    });
  }
  if (routeDecision.needCopyright) {
    payloads.push({
      textStr: routeDecision.copyrightSegment || textStr,
      imageB64,
      imagesB64,
      systemInstruction: systemInstructionCopyright,
      customModel,
      customEndpoint,
      customApiKey,
      globalApiKey
    });
  }

  const agentResults = await Promise.all(payloads.map(p => executeLLMAnalysis(p, adapterType)));

  const parsedAgentsData: any[] = [];
  agentResults.forEach((result, idx) => {
    if (result.usageMetadata) {
      hasUsage = true;
      promptTokens += result.usageMetadata.promptTokenCount || 0;
      completionTokens += result.usageMetadata.candidatesTokenCount || 0;
      totalTokens += result.usageMetadata.totalTokenCount || 0;
    }
    
    const parsed = repairAndParseJson(result.responseText, { score: BASE_SCORE, violations: [], matchedLaws: [], imageAlternativeProposal: null });
    parsedAgentsData.push(parsed);
  });

  const agentsActivated: string[] = [];
  if (routeDecision.needLegal) agentsActivated.push("LEGAL (실정법률 준수 검사)");
  if (routeDecision.needSocial) agentsActivated.push("SOCIAL (사회적 논란/재난 심의)");
  if (routeDecision.needEsg) agentsActivated.push("ESG (그린워싱 광고 심사)");
  if (routeDecision.needPrivacy) agentsActivated.push("PRIVACY (개인정보 보호 심사)");
  if (routeDecision.needYouth) agentsActivated.push("YOUTH (청소년 위해/사행성 심사)");
  if (routeDecision.needCopyright) agentsActivated.push("COPYRIGHT (지식재산권 보호 심사)");

  const finalResultData: any = {
    parsedMeta: parsedAgentsData[0].parsedMeta || parsedAgentsData[1].parsedMeta || parsedAgentsData[2].parsedMeta || {
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
    const promptTk = Math.round((textStr || "").length * 1.5 + (imageB64 ? 1000 : 0) + 400);
    const completionTk = Math.round(JSON.stringify(finalResultData).length / 3);
    finalResultData.usage = {
      promptTokens: promptTk,
      completionTokens: completionTk,
      totalTokens: promptTk + completionTk
    };
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
    inputText: textStr || "(이미지 단독 심사)",
    imagePresent: !!(imageB64 || (Array.isArray(imagesB64) && imagesB64.length > 0)),
    score: finalResultData.score,
    verdict: finalResultData.score >= 80 ? 'Approved' : 'Rejected',
    meta: finalResultData.parsedMeta,
    timestamp: new Date().toISOString(),
    result: finalResultData
  });

  return finalResultData;
}

// 1,000-Case Concurrent Benchmark Template definitions
export const BENCHMARK_TEMPLATES = [
  // --- Deceptive Modern Web Ads ---
  {
    category: "Modern Web / SNS Ads",
    name: "[기만] 인공지능 주름 지우개 미백 화장품",
    inputText: "SNS 대유행! 인공지능이 세포를 찾아가 아토피를 완치하는 획기적인 주름 미백 지우개 크림 복합 세트 런칭.",
    expectedViolations: 1
  },
  {
    category: "Modern Web / SNS Ads",
    name: "[과장] 즉각 연소 하루 완치 다이어트 쉐이크",
    inputText: "이 쉐이크만 하루 3번 마시면 체지방이 100% 즉시 분해 연소되고 요요 현상이 평생 차단되는 기적의 임상 완료!",
    expectedViolations: 1
  },
  {
    category: "Modern Web / SNS Ads",
    name: "[금융] 고수익 확정 및 원금 보장 기만 사모펀드",
    inputText: "원금 100% 무손실 보장! 매달 25% 확정 금리 배당을 지급하는 무위험 고수익 재테크 사모 펀드 선착순 마감 공지.",
    expectedViolations: 1
  },
  {
    category: "Modern Web / SNS Ads",
    name: "[보건] 무증빙 당뇨 치료 한방 만약",
    inputText: "말기 고혈압 및 각종 대형 암 세포를 억제하고 면역을 완전 치료해 주는 신비의 무독성 한방 안심 면역 수소수.",
    expectedViolations: 1
  },
  {
    category: "Modern Web / SNS Ads",
    name: "[사행] 확률형 아이템 100% 획득 조작 팩",
    inputText: "즉시 100% 최강의 레전드 뽑기 획득 보장! 친구들의 게임 계정을 박살내는 확률형 울트라 상자 한정 패키지.",
    expectedViolations: 1
  },
  // --- Historical Deceptive Ads ---
  {
    category: "Historical Ads (1920-2000)",
    name: "1920년대 라듐 방사능 만병통치 천연 미백 미용수",
    inputText: "빛나는 젊음의 특권! 진짜 라듐 성분이 함유되어 피부 세포를 활성화하고 기미와 아토피를 영구 완치하는 만병통치형 라듐 토닉.",
    expectedViolations: 1
  },
  {
    category: "Historical Ads (1920-2000)",
    name: "1950년대 의사 추천 건강 치료 필터 담배",
    inputText: "폐를 완벽히 보호하고 목 질환을 즉시 치료해서 전 세계 의사들이 적극 강력 권장하는 마법의 천연 필터 건강 담배 특판.",
    expectedViolations: 1
  },
  {
    category: "Historical Ads (1920-2000)",
    name: "1970년대 세포 자생 완치 우황 인삼 오일",
    inputText: "만병의 근원인 피로를 즉시 완치하고 소아 발육 및 체지방을 억제해 주는 동양 신비의 천연 우황 인삼 활력 영양 앰플.",
    expectedViolations: 1
  },
  {
    category: "Historical Ads (1920-2000)",
    name: "1990년대 원금 500% 초고속 벤처 펀드",
    inputText: "확정 이율 연 45% 최저 보증! 파격적인 정부 주도 닷컴 벤처 특별 사모 펀드로 원금 손실 걱칙 없이 초고수익 보증.",
    expectedViolations: 1
  },
  {
    category: "Historical Ads (1920-2000)",
    name: "2000년대 미니홈피 도토리 자동 무한 복사기",
    inputText: "클릭 한 번으로 도토리 매일 1000개 영구 자동 복사 보장! 소유권 획득 즉시 무제한 발행 불법 차단 우회 안심 프로그램.",
    expectedViolations: 1
  },
  // --- Sensitive Social / Tragedy Ads (Tier 4 Check) ---
  {
    category: "Historical Tragedy Abuse (Tier 4 Violation)",
    name: "세월호 리본 상업적 오용 목걸이 특가",
    inputText: "기억해야 할 세월호 참사를 추모하며 기획한 노란 리본 목걸이 펜던트 할인 특가전! 수익금의 극히 일부를 유족 도울 수전으로 기증합니다.",
    expectedViolations: 1
  },
  {
    category: "Historical Tragedy Abuse (Tier 4 Violation)",
    name: "우크라이나 폭격 참사 아토피 피부 재생 크림",
    inputText: "전쟁의 아픔과 상흔처럼 붉게 얼룩진 청소년 등 여드름 자국 아토피! 참화 속에서도 맑게 피어나는 우크라이나 완치 크림.",
    expectedViolations: 1
  },
  {
    category: "Historical Tragedy Abuse (Tier 4 Violation)",
    name: "이태원 비극 핼러윈 호러 체리 시럽 패키지",
    inputText: "이태원 비극의 골목을 붉게 장식하는 할로윈 비명 패키지 판매! 피를 상징하는 붉은 피 시럽 제공으로 공포 분위기 연출.",
    expectedViolations: 1
  },
  {
    category: "Historical Tragedy Abuse (Tier 4 Violation)",
    name: "홀로코스트 추모 한정판 프리미엄 골드 초콜릿",
    inputText: "진중한 역사적 비극 홀로코스트 추모 기획! 깊고 씁쓸한 카카오의 원액을 전면에 배합하여 만든 극강의 참상 조문 초코 바.",
    expectedViolations: 1
  },
  // --- Compliant Safe Ads ---
  {
    category: "Compliant / Safe Ads",
    name: "친환경 리얼 참나무 미니멀 가구 리빙 거울 (안전)",
    inputText: "오래 쓰는 견고한 리얼 참나무 가구 시리즈입니다. 공간 미학을 높이고 눈의 편안함을 선사하는 미니멀 디자인 경대.",
    expectedViolations: 0
  },
  {
    category: "Compliant / Safe Ads",
    name: "자연재배 완숙 토마토 산지직송 포장 (안전)",
    inputText: "자연 친화적 농법으로 정성껏 키운 완숙 토마토입니다. 아침 주스나 일상의 영양 섭취에 유용하도록 풍부한 수분을 머금고 있습니다.",
    expectedViolations: 0
  },
  {
    category: "Compliant / Safe Ads",
    name: "저소음 아날로그 침실 디자인 벽시계 (안전)",
    inputText: "한밤중에도 평온한 수면을 방해하지 않는 아날로그 무소음 벽시계입니다. 모던한 주방 벽 연출에 잘 어울립니다.",
    expectedViolations: 0
  },
  {
    category: "Compliant / Safe Ads",
    name: "고풍량 하이브리드 무선 서큘레이터형 팬 (안전)",
    inputText: "실내 공기 순환을 자연스럽고 쾌적하게 돕는 하이브리드 입방 바람 순환 기기입니다. 3단계 제어를 실증 테스트 완료했습니다.",
    expectedViolations: 0
  },
  {
    category: "Compliant / Safe Ads",
    name: "순면 100% 저자극 흡수 유아용 가공패드 (안전)",
    inputText: "지친 아기 피부를 보드랍고 포근하게 감싸주는 친환경 순면 기저귀입니다. 일상의 쾌적함과 고유의 안전 규격을 모두 합격했습니다.",
    expectedViolations: 0
  }
];

export function generateLargeBenchmarkCases() {
  const resultList = [];
  const templates = BENCHMARK_TEMPLATES;
  for (let i = 1; i <= 20000; i++) {
    const tmpl = templates[(i - 1) % templates.length];
    const itemNum = String(i).padStart(5, '0');
    
    let name = tmpl.name;
    let inputText = tmpl.inputText;
    
    // Add realistic variations dynamically to ensure completely distinct 20,000 cases
    if (tmpl.expectedViolations > 0) {
      if (tmpl.inputText.includes("체지방")) {
        inputText = tmpl.inputText.replace("100% 즉시 분해", `${70 + (i % 25)}% 세포 급속 분해 연소`);
        inputText = inputText.replace("하루 3번", `하루 ${2 + (i % 3)}회`);
      } else if (tmpl.inputText.includes("아토피")) {
        inputText = tmpl.inputText.replace("하루만에", `${2 + (i % 3)}일 만에`);
      } else if (tmpl.inputText.includes("원금 100%")) {
        inputText = tmpl.inputText.replace("25%", `${10 + (i % 20)}%`);
      } else if (tmpl.inputText.includes("노란 리본")) {
        name = `[참사오용 No.${itemNum}] 세월호 리본 참사 마케팅 특별가전`;
        inputText = tmpl.inputText.replace("할인 특가전!", `한정 추모 오용 목걸이 특가 런칭 (No.${i})!`);
      } else if (tmpl.inputText.includes("대출")) {
        inputText = tmpl.inputText.replace("청소년", `소외 청소년 및 대입 수험생 (No.${i})`);
      }
    } else {
      // Compliant ones
      if (tmpl.inputText.includes("토마토")) {
        inputText = tmpl.inputText.replace("완숙 토마토입니다.", `정직하게 수확해 낸 무농약 완숙 토마토 세트 (일괄 ${4 + (i % 5)}kg).`);
      } else if (tmpl.inputText.includes("벽시계")) {
        inputText = tmpl.inputText.replace("무소음", `지속 충전형 저소음 특허 아날로그 무브먼트`);
      }
    }

    // Additional modulo math variations to make every single case 100% unique and distinct
    const suffixes = ["", " [신규]", " [특별 기획]", " [추천]", " [인기]", " [화제]", " [시즌 한정]", " [단독 수입]", " [체험단 모집]", " [실시간 할인]"];
    const suffix = suffixes[i % suffixes.length];

    resultList.push({
      id: `case_${itemNum}`,
      category: tmpl.category,
      name: `${tmpl.category === "Compliant / Safe Ads" ? "🟢 [안심]" : "🚨 [위반]"} No.${itemNum} - ${name.replace(/\[.*\]\s*/g, "")}${suffix}`,
      inputText: `${inputText} (${i})`,
      expectedViolations: tmpl.expectedViolations
    });
  }
  return resultList;
}

export const BENCHMARK_CASES = generateLargeBenchmarkCases();
