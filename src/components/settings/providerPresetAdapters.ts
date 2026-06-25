import {
  DEFAULT_LM_STUDIO_ENDPOINT,
  DEFAULT_LM_STUDIO_MODEL,
  DEFAULT_OLLAMA_ENDPOINT,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OPENAI_ENDPOINT,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_OPENROUTER_ENDPOINT,
  DEFAULT_OPENROUTER_MODEL,
} from '../../constants/llm';
import type { CloudPreset, LocalPreset, ProviderPresetAdapter } from './settingsTypes';

export const LOCAL_PROVIDER_PRESETS: readonly ProviderPresetAdapter<LocalPreset>[] = [
  {
    id: 'ollama',
    label: 'Ollama 프리셋',
    endpoint: DEFAULT_OLLAMA_ENDPOINT,
    model: DEFAULT_OLLAMA_MODEL,
  },
  {
    id: 'lmstudio',
    label: 'LM Studio 프리셋',
    endpoint: DEFAULT_LM_STUDIO_ENDPOINT,
    model: DEFAULT_LM_STUDIO_MODEL,
  },
] as const;

export const CLOUD_PROVIDER_PRESETS: readonly ProviderPresetAdapter<CloudPreset>[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    endpoint: DEFAULT_OPENAI_ENDPOINT,
    model: DEFAULT_OPENAI_MODEL,
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    endpoint: DEFAULT_OPENROUTER_ENDPOINT,
    model: DEFAULT_OPENROUTER_MODEL,
  },
  {
    id: 'custom',
    label: '직접기입 (Custom)',
    endpoint: '',
    model: '',
  },
] as const;

export const getLocalPresetAdapter = (preset: LocalPreset): ProviderPresetAdapter<LocalPreset> => (
  LOCAL_PROVIDER_PRESETS.find((adapter) => adapter.id === preset) ?? LOCAL_PROVIDER_PRESETS[0]
);

export const getCloudPresetAdapter = (preset: CloudPreset): ProviderPresetAdapter<CloudPreset> => (
  CLOUD_PROVIDER_PRESETS.find((adapter) => adapter.id === preset) ?? CLOUD_PROVIDER_PRESETS[0]
);

export const getSortedModelOptions = (models: readonly string[], query: string): string[] => {
  const needle = query.trim().toLowerCase();
  const filteredModels = needle
    ? models.filter((model) => model.toLowerCase().includes(needle))
    : models;

  return [...filteredModels].sort((first, second) => first.localeCompare(second, 'en', { sensitivity: 'base' }));
};
