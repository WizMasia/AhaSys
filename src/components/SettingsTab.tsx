/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { LLMType } from '../types';
import { AdapterSelector } from './settings/AdapterSelector';
import { CloudModelSettingsPanel } from './settings/CloudModelSettingsPanel';
import { GeminiSettingsPanel } from './settings/GeminiSettingsPanel';
import { LocalModelSettingsPanel } from './settings/LocalModelSettingsPanel';
import { getCloudPresetAdapter, getLocalPresetAdapter, getSortedModelOptions } from './settings/providerPresetAdapters';
import { SettingsIntroCard } from './settings/SettingsIntroCard';
import { SettingsSavePanel } from './settings/SettingsSavePanel';
import type { CloudPreset, LocalPreset, ModelLookupState } from './settings/settingsTypes';

const normalizeLocalPreset = (preset: string): LocalPreset => (
  preset === 'lmstudio' ? 'lmstudio' : 'ollama'
);

const normalizeCloudPreset = (preset: string): CloudPreset => {
  if (preset === 'openrouter' || preset === 'custom') return preset;
  return 'openai';
};

export function SettingsTab() {
  const {
    darkMode,
    adapterType,
    customModel,
    customEndpoint,
    customApiKey,
    localPreset: initialLocalPreset,
    otherPreset: initialOtherPreset,
    fetchedModels,
    fetchModelsLoading,
    fetchModelsError,
    settingsSavedSuccess,
    handleFetchModels,
    handleSaveSettings,
  } = useApp();

  const [draftAdapterType, setDraftAdapterType] = useState<LLMType>(adapterType);
  const [draftCustomModel, setDraftCustomModel] = useState(customModel);
  const [draftCustomEndpoint, setDraftCustomEndpoint] = useState(customEndpoint);
  const [draftCustomApiKey, setDraftCustomApiKey] = useState(customApiKey);
  const [localPreset, setLocalPreset] = useState<LocalPreset>(normalizeLocalPreset(initialLocalPreset));
  const [cloudPreset, setCloudPreset] = useState<CloudPreset>(normalizeCloudPreset(initialOtherPreset));
  const [modelSearchQuery, setModelSearchQuery] = useState('');

  const sortedModelOptions = useMemo(
    () => getSortedModelOptions(fetchedModels, modelSearchQuery),
    [fetchedModels, modelSearchQuery]
  );

  useEffect(() => {
    setDraftAdapterType(adapterType);
    setDraftCustomModel(customModel);
    setDraftCustomEndpoint(customEndpoint);
    setDraftCustomApiKey(customApiKey);
    setLocalPreset(normalizeLocalPreset(initialLocalPreset));
    setCloudPreset(normalizeCloudPreset(initialOtherPreset));
  }, [adapterType, customModel, customEndpoint, customApiKey, initialLocalPreset, initialOtherPreset]);

  const applyLocalPreset = (preset: LocalPreset = 'ollama') => {
    const adapter = getLocalPresetAdapter(preset);
    setLocalPreset(adapter.id);
    setDraftCustomEndpoint(adapter.endpoint);
    setDraftCustomModel(adapter.model);
  };

  const applyCloudPreset = (preset: CloudPreset = 'openai') => {
    const adapter = getCloudPresetAdapter(preset);
    setCloudPreset(adapter.id);
    setDraftCustomEndpoint(adapter.endpoint);
    setDraftCustomModel(adapter.model);
  };

  const onFetchModels = async () => {
    const list = await handleFetchModels(draftCustomEndpoint, draftCustomApiKey);
    if (list && list.length > 0) setDraftCustomModel(list[0]);
  };

  const onSave = () => {
    handleSaveSettings({
      adapterType: draftAdapterType,
      customModel: draftCustomModel,
      customEndpoint: draftCustomEndpoint,
      customApiKey: draftCustomApiKey,
      localPreset,
      otherPreset: cloudPreset,
    });
  };

  const lookup: ModelLookupState = {
    fetchedModels,
    fetchModelsLoading,
    fetchModelsError,
    modelSearchQuery,
    sortedModelOptions,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SettingsIntroCard />

      <div className={`p-6 rounded-3xl border space-y-5 ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-205 shadow-md'}`}>
        <AdapterSelector
          draftAdapterType={draftAdapterType}
          setDraftAdapterType={setDraftAdapterType}
          setDraftCustomModel={setDraftCustomModel}
          applyLocalPreset={() => applyLocalPreset('ollama')}
          applyCloudPreset={() => applyCloudPreset('openai')}
        />

        {draftAdapterType === LLMType.GEMINI && (
          <GeminiSettingsPanel
            draftCustomApiKey={draftCustomApiKey}
            setDraftCustomApiKey={setDraftCustomApiKey}
          />
        )}

        {draftAdapterType === LLMType.OLLAMA && (
          <LocalModelSettingsPanel
            localPreset={localPreset}
            applyLocalPreset={applyLocalPreset}
            draftCustomEndpoint={draftCustomEndpoint}
            setDraftCustomEndpoint={setDraftCustomEndpoint}
            draftCustomModel={draftCustomModel}
            setDraftCustomModel={setDraftCustomModel}
            lookup={lookup}
            setModelSearchQuery={setModelSearchQuery}
            onFetchModels={onFetchModels}
          />
        )}

        {draftAdapterType === LLMType.CUSTOM && (
          <CloudModelSettingsPanel
            cloudPreset={cloudPreset}
            applyCloudPreset={applyCloudPreset}
            draftCustomEndpoint={draftCustomEndpoint}
            setDraftCustomEndpoint={setDraftCustomEndpoint}
            draftCustomApiKey={draftCustomApiKey}
            setDraftCustomApiKey={setDraftCustomApiKey}
            draftCustomModel={draftCustomModel}
            setDraftCustomModel={setDraftCustomModel}
            lookup={lookup}
            setModelSearchQuery={setModelSearchQuery}
            onFetchModels={onFetchModels}
          />
        )}

        <SettingsSavePanel settingsSavedSuccess={settingsSavedSuccess} onSave={onSave} />
      </div>
    </div>
  );
}
