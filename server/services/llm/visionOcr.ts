import { modelSupportsVision, shouldProbeVisionCapability } from '../../../shared/modelCapabilities';
import { extractTextWithEasyOcr, isEasyOcrAvailable } from '../easyOcrService';
import { getErrorMessage, ProviderRateLimitError } from './errors';
import { extractChatCompletionContent } from './responseParsing';
import type {
  ImageTextExtractor,
  OcrFallbackContext,
  VisionProbeParams,
  VisionProbeResult,
} from './types';

export { modelSupportsVision, shouldProbeVisionCapability };

export const isImageCapabilityErrorMessage = (message: string): boolean => {
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

export const isImageCapabilityError = (err: unknown): boolean => (
  isImageCapabilityErrorMessage(getErrorMessage(err))
);

export const collectImagePayloads = (
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
  if (imagePayloads.length === 0) return '';
  if (!isEasyOcrAvailable()) return '';
  return extractTextWithEasyOcr(imagePayloads);
};

export const buildOcrFallbackContext = async (params: {
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
    : !isEasyOcrAvailable()
      ? `${params.reason} 이 환경에서는 OCR 기능이 비활성화되어 있어 이미지 내부 텍스트를 추출하지 못했습니다. 시각 요소 평가는 제외되고 입력 텍스트만 광고 심사에 반영했습니다.`
      : ocrErrorMessage
        ? `${params.reason} 서버 OCR을 실행했지만 실패했습니다. OCR 오류: ${ocrErrorMessage}. 따라서 시각 요소 평가는 제외되고 입력 텍스트만 심사했습니다.`
        : `${params.reason} 서버 OCR을 실행했지만, 이미지에서 판독 가능한 문구를 찾지 못했습니다. 따라서 시각 요소 평가는 제외되고 입력 텍스트만 심사했습니다.`;

  return {
    used: true,
    extractedText,
    notice
  };
};
