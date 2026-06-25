import { getSystemInstruction } from '../../prompts/compliancePrompt';
import type { JsonObject } from './jsonRepair';
import type { LLMAdapterPayload } from './types';
import type { AnalysisInstructions } from './instructions';

export interface RouteDecision {
  readonly needLegalProduct: boolean;
  readonly needLegalFinance: boolean;
  readonly needLegalCommerce: boolean;
  readonly needLegalNet: boolean;
  readonly needSocial: boolean;
  readonly needEsg: boolean;
  readonly needPrivacy: boolean;
  readonly needYouth: boolean;
  readonly needCopyright: boolean;
  readonly legalProductSegment: string;
  readonly legalFinanceSegment: string;
  readonly legalCommerceSegment: string;
  readonly legalNetSegment: string;
  readonly socialSegment: string;
  readonly esgSegment: string;
  readonly privacySegment: string;
  readonly youthSegment: string;
  readonly copyrightSegment: string;
}

interface BuildAgentPayloadsParams {
  readonly routeDecision: RouteDecision;
  readonly instructions: AnalysisInstructions;
  readonly shouldUseConsolidatedGeminiReview: boolean;
  readonly combinedInputText: string;
  readonly textStrForAnalysis: string;
  readonly imageB64ForAnalysis: string | undefined | null;
  readonly imagesB64ForAnalysis: readonly string[] | undefined | null;
  readonly customModel: string | undefined | null;
  readonly customEndpoint: string | undefined | null;
  readonly customApiKey: string | undefined | null;
  readonly globalApiKey: string | undefined;
  readonly forceImageInput: boolean;
}

const emptySegments = {
  legalProductSegment: "",
  legalFinanceSegment: "",
  legalCommerceSegment: "",
  legalNetSegment: "",
  socialSegment: "",
  esgSegment: "",
  privacySegment: "",
  youthSegment: "",
  copyrightSegment: "",
} as const;

export const createDefaultRouteDecision = (): RouteDecision => ({
  needLegalProduct: true,
  needLegalFinance: false,
  needLegalCommerce: false,
  needLegalNet: false,
  needSocial: false,
  needEsg: false,
  needPrivacy: false,
  needYouth: false,
  needCopyright: false,
  ...emptySegments,
});

export const createFullRouteDecision = (): RouteDecision => ({
  needLegalProduct: true,
  needLegalFinance: true,
  needLegalCommerce: true,
  needLegalNet: true,
  needSocial: true,
  needEsg: true,
  needPrivacy: true,
  needYouth: true,
  needCopyright: true,
  ...emptySegments,
});

const readSegment = (route: JsonObject, key: keyof RouteDecision): string => {
  const value = route[key];
  return typeof value === 'string' ? value.trim() : "";
};

export const parseRouteDecision = (parsedRoute: JsonObject | null): RouteDecision => {
  if (!parsedRoute) {
    return createDefaultRouteDecision();
  }

  return {
    needLegalProduct: true,
    needLegalFinance: parsedRoute.needLegalFinance === true,
    needLegalCommerce: parsedRoute.needLegalCommerce === true,
    needLegalNet: parsedRoute.needLegalNet === true,
    needSocial: parsedRoute.needSocial === true,
    needEsg: parsedRoute.needEsg === true,
    needPrivacy: parsedRoute.needPrivacy === true,
    needYouth: parsedRoute.needYouth === true,
    needCopyright: parsedRoute.needCopyright === true,
    legalProductSegment: readSegment(parsedRoute, 'legalProductSegment'),
    legalFinanceSegment: readSegment(parsedRoute, 'legalFinanceSegment'),
    legalCommerceSegment: readSegment(parsedRoute, 'legalCommerceSegment'),
    legalNetSegment: readSegment(parsedRoute, 'legalNetSegment'),
    socialSegment: readSegment(parsedRoute, 'socialSegment'),
    esgSegment: readSegment(parsedRoute, 'esgSegment'),
    privacySegment: readSegment(parsedRoute, 'privacySegment'),
    youthSegment: readSegment(parsedRoute, 'youthSegment'),
    copyrightSegment: readSegment(parsedRoute, 'copyrightSegment'),
  };
};

export const getAgentsActivated = (routeDecision: RouteDecision): string[] => {
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
  return agentsActivated;
};

const buildPayload = (params: BuildAgentPayloadsParams, textStr: string, systemInstruction: string): LLMAdapterPayload => ({
  textStr,
  imageB64: params.imageB64ForAnalysis,
  imagesB64: params.imagesB64ForAnalysis,
  systemInstruction,
  customModel: params.customModel,
  customEndpoint: params.customEndpoint,
  customApiKey: params.customApiKey,
  globalApiKey: params.globalApiKey,
  forceImageInput: params.forceImageInput,
});

export const buildAgentPayloads = (params: BuildAgentPayloadsParams): LLMAdapterPayload[] => {
  if (params.shouldUseConsolidatedGeminiReview) {
    return [buildPayload(
      params,
      params.combinedInputText || params.textStrForAnalysis,
      `${getSystemInstruction(params.instructions.fullLibraryContext, params.instructions.fewShotContext)}

[Gemini 이미지 통합 검토 지시]
첨부 이미지가 있는 경우에는 다중 에이전트 팬아웃 대신 이 단일 호출에서 식의약/보건, 금융/게임, 공정거래/전자상거래, 정보망/아동복지, 사회적 논란, ESG, 개인정보, 청소년 보호, 저작권/상표권 위험을 모두 종합 심사하십시오.
반드시 기존 JSON 스키마를 유지하고, 이미지 내부 문구와 시각 요소의 위반 사항도 violations, matchedLaws, imageAlternativeProposal에 병합해 반환하십시오.`
    )];
  }

  const payloads: LLMAdapterPayload[] = [];
  const { routeDecision } = params;
  if (routeDecision.needLegalProduct) {
    payloads.push(buildPayload(params, routeDecision.legalProductSegment || params.textStrForAnalysis, params.instructions.legalProduct));
  }
  if (routeDecision.needLegalFinance) {
    payloads.push(buildPayload(params, routeDecision.legalFinanceSegment || params.textStrForAnalysis, params.instructions.legalFinance));
  }
  if (routeDecision.needLegalCommerce) {
    payloads.push(buildPayload(params, routeDecision.legalCommerceSegment || params.textStrForAnalysis, params.instructions.legalCommerce));
  }
  if (routeDecision.needLegalNet) {
    payloads.push(buildPayload(params, routeDecision.legalNetSegment || params.textStrForAnalysis, params.instructions.legalNet));
  }
  if (routeDecision.needSocial) {
    payloads.push(buildPayload(params, routeDecision.socialSegment || params.textStrForAnalysis, params.instructions.social));
  }
  if (routeDecision.needEsg) {
    payloads.push(buildPayload(params, routeDecision.esgSegment || params.textStrForAnalysis, params.instructions.esg));
  }
  if (routeDecision.needPrivacy) {
    payloads.push(buildPayload(params, routeDecision.privacySegment || params.textStrForAnalysis, params.instructions.privacy));
  }
  if (routeDecision.needYouth) {
    payloads.push(buildPayload(params, routeDecision.youthSegment || params.textStrForAnalysis, params.instructions.youth));
  }
  if (routeDecision.needCopyright) {
    payloads.push(buildPayload(params, routeDecision.copyrightSegment || params.textStrForAnalysis, params.instructions.copyright));
  }
  return payloads;
};
