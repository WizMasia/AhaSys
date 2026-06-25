import type { ModelListResult } from './types';
import { isRecord, isString } from './responseParsing';

const normalizeEndpoint = (endpoint: string): string => {
  const trimmed = endpoint.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const extractOpenAiModelIds = (data: unknown): string[] | null => {
  if (!isRecord(data) || !Array.isArray(data.data)) {
    return null;
  }

  const models = data.data
    .map((item) => isRecord(item) ? item.id : null)
    .filter(isString);
  return models.length > 0 ? models : null;
};

const extractOllamaModelIds = (data: unknown): string[] | null => {
  if (!isRecord(data) || !Array.isArray(data.models)) {
    return null;
  }

  const models = data.models
    .map((item) => {
      if (!isRecord(item)) return null;
      return isString(item.name) ? item.name : item.model;
    })
    .filter(isString);
  return models.length > 0 ? models : null;
};

const fetchOllamaModels = async (cleanEndpoint: string): Promise<string[] | null> => {
  try {
    const parsedUrl = new URL(cleanEndpoint);
    const hostWithPort = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const ollamaResponse = await fetch(`${hostWithPort}/api/tags`);
    if (!ollamaResponse.ok) {
      return null;
    }
    return extractOllamaModelIds(await ollamaResponse.json());
  } catch (err: unknown) {
    if (err instanceof Error) {
      return null;
    }
    throw err;
  }
};

export async function handleFetchModels(endpoint: string, apiKey?: string): Promise<ModelListResult> {
  const cleanEndpoint = normalizeEndpoint(endpoint);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey && apiKey.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }

  const fetchUrl = `${cleanEndpoint}/models`;
  const response = await fetch(fetchUrl, {
    method: "GET",
    headers
  });

  if (response.ok) {
    const models = extractOpenAiModelIds(await response.json());
    if (models) {
      return { success: true, models };
    }
  }

  const ollamaModels = await fetchOllamaModels(cleanEndpoint);
  if (ollamaModels) {
    return { success: true, models: ollamaModels };
  }

  throw new Error("OpenAI 호환 API 또는 Ollama 서버로부터 모델 목록을 조회하지 못했습니다. 엔드포인트 URL을 확인해 주십시오.");
}
