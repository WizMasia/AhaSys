import modelCapabilityCatalog from './modelCapabilityCatalog.json';

const VISION_MODEL_KEYWORDS = modelCapabilityCatalog.visionModelKeywords;

export const modelSupportsVision = (modelName: string | undefined | null): boolean => {
  const normalizedModelName = (modelName || '').toLowerCase();
  return VISION_MODEL_KEYWORDS.some((keyword) => normalizedModelName.includes(keyword));
};

export const shouldUseOcrFallback = (params: {
  readonly adapterType: string | undefined | null;
  readonly modelName: string | undefined | null;
  readonly hasImages: boolean;
}): boolean => {
  const adapterType = params.adapterType || '';
  return params.hasImages && adapterType !== 'GEMINI' && !modelSupportsVision(params.modelName);
};

export const shouldProbeVisionCapability = shouldUseOcrFallback;
