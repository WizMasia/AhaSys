import { getErrorMessage } from './errors';
import type { ImageTextExtractor, VisionProbeFunction } from './types';

export interface PerformAnalysisParams {
  readonly text: unknown;
  readonly imageB64: unknown;
  readonly imagesB64: unknown;
  readonly adapterType: unknown;
  readonly customModel: unknown;
  readonly customEndpoint: unknown;
  readonly customApiKey: unknown;
  readonly websiteUrl: unknown;
  readonly additionalContext: unknown;
  readonly analysisMode?: unknown;
  readonly globalApiKey: string | undefined;
  readonly ocrExtractor?: ImageTextExtractor;
  readonly visionProbe?: VisionProbeFunction;
  readonly forceOcrFallback?: boolean;
  readonly ocrFallbackReason?: string;
}

export type TokenUsageMetadata = {
  readonly promptTokenCount: number;
  readonly candidatesTokenCount: number;
  readonly totalTokenCount: number;
};

export const readImagePayloadArray = (value: unknown): readonly string[] | null => (
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : null
);

export const extractWebsiteText = async (websiteUrl: unknown): Promise<string> => {
  if (!websiteUrl || typeof websiteUrl !== 'string' || !websiteUrl.trim()) {
    return "";
  }

  try {
    const fetchRes = await fetch(websiteUrl.trim(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, bg-KR) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!fetchRes.ok) {
      return `[Error: URL fetch failed with status ${fetchRes.status}]`;
    }

    const rawHtml = await fetchRes.text();
    return rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1500);
  } catch (err: unknown) {
    return `[Error: URL fetch Exception - ${getErrorMessage(err)}]`;
  }
};

export const buildCombinedInputText = (
  textStrForAnalysis: string,
  websiteText: string,
  additionalContext: unknown
): string => {
  let combinedInputText = textStrForAnalysis;
  if (websiteText) {
    combinedInputText += `\n[수집된 웹페이지 내용]:\n${websiteText}`;
  }
  if (additionalContext && typeof additionalContext === 'string' && additionalContext.trim()) {
    combinedInputText += `\n[배경 맥락 및 시점/형태 요소]:\n${additionalContext}`;
  }
  return combinedInputText;
};
