import { LLMType } from '../../types';

export type LocalPreset = 'ollama' | 'lmstudio';
export type CloudPreset = 'openai' | 'openrouter' | 'custom';

export interface ProviderPresetAdapter<PresetId extends string> {
  readonly id: PresetId;
  readonly label: string;
  readonly endpoint: string;
  readonly model: string;
}

export interface SettingsDraftState {
  readonly adapterType: LLMType;
  readonly customModel: string;
  readonly customEndpoint: string;
  readonly customApiKey: string;
  readonly localPreset: LocalPreset;
  readonly cloudPreset: CloudPreset;
}

export interface ModelLookupState {
  readonly fetchedModels: readonly string[];
  readonly fetchModelsLoading: boolean;
  readonly fetchModelsError: string | null;
  readonly modelSearchQuery: string;
  readonly sortedModelOptions: readonly string[];
}
