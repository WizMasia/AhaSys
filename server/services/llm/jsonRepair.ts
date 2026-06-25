import { isRecord } from './responseParsing';

export type JsonObject = Record<string, unknown>;

export function repairAndParseJson(text: string): JsonObject | null;
export function repairAndParseJson<T extends JsonObject>(text: string, fallback: T): JsonObject | T;
export function repairAndParseJson<T extends JsonObject>(
  text: string,
  fallback: T | null = null
): JsonObject | T | null {
  const trimmed = text.trim();
  try {
    const parsed: unknown = JSON.parse(trimmed.replace(/```json/g, "").replace(/```/g, ""));
    return isRecord(parsed) ? parsed : fallback;
  } catch (err: unknown) {
    if (!(err instanceof SyntaxError)) {
      throw err;
    }
    try {
      const cleanJsonStr = trimmed.substring(trimmed.indexOf('{'), trimmed.lastIndexOf('}') + 1);
      const parsed: unknown = JSON.parse(cleanJsonStr);
      return isRecord(parsed) ? parsed : fallback;
    } catch (repairErr: unknown) {
      if (!(repairErr instanceof SyntaxError)) {
        throw repairErr;
      }
      console.error("Failed to repair and parse JSON string:", text);
      return fallback;
    }
  }
}
