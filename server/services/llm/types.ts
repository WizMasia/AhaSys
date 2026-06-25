export interface SystemAnalysisResult {
  readonly responseText: string;
  readonly usageMetadata?: {
    readonly promptTokenCount?: number;
    readonly candidatesTokenCount?: number;
    readonly totalTokenCount?: number;
  };
}

export interface LLMAdapterPayload {
  readonly textStr: string;
  readonly imageB64: string | undefined | null;
  readonly imagesB64: readonly string[] | undefined | null;
  readonly systemInstruction: string;
  readonly customModel: string | undefined | null;
  readonly customEndpoint: string | undefined | null;
  readonly customApiKey: string | undefined | null;
  readonly globalApiKey: string | undefined;
  readonly forceImageInput?: boolean;
}

export type ImageTextExtractor = (imagePayloads: readonly string[]) => Promise<string>;
export type VisionProbeFunction = (params: VisionProbeParams) => Promise<VisionProbeResult>;

export interface VisionProbeParams {
  readonly imagePayload: string;
  readonly customModel: string | undefined | null;
  readonly customEndpoint: string | undefined | null;
  readonly customApiKey: string | undefined | null;
}

export type VisionProbeResult =
  | { readonly kind: 'supported'; readonly reason: string }
  | { readonly kind: 'unsupported'; readonly reason: string };

export interface OcrFallbackContext {
  readonly used: boolean;
  readonly extractedText: string;
  readonly notice: string;
}

export interface LLMAdapter {
  analyze(payload: LLMAdapterPayload): Promise<SystemAnalysisResult>;
}

export interface ModelListResult {
  readonly success: true;
  readonly models: readonly string[];
}
