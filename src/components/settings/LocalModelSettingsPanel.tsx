import { getLocalPresetAdapter, LOCAL_PROVIDER_PRESETS } from './providerPresetAdapters';
import type { LocalPreset, ModelLookupState } from './settingsTypes';
import { ModelLookupField } from './ModelLookupField';

interface LocalModelSettingsPanelProps {
  readonly localPreset: LocalPreset;
  readonly applyLocalPreset: (preset: LocalPreset) => void;
  readonly draftCustomEndpoint: string;
  readonly setDraftCustomEndpoint: (endpoint: string) => void;
  readonly draftCustomModel: string;
  readonly setDraftCustomModel: (model: string) => void;
  readonly lookup: ModelLookupState;
  readonly setModelSearchQuery: (query: string) => void;
  readonly onFetchModels: () => Promise<void>;
}

export function LocalModelSettingsPanel({
  localPreset,
  applyLocalPreset,
  draftCustomEndpoint,
  setDraftCustomEndpoint,
  draftCustomModel,
  setDraftCustomModel,
  lookup,
  setModelSearchQuery,
  onFetchModels,
}: LocalModelSettingsPanelProps) {
  const selectedPreset = getLocalPresetAdapter(localPreset);

  return (
    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
      <div className="flex items-center justify-between text-xs font-bold text-slate-350">
        <span className="font-black text-teal-400">🖥️ 로컬 데스크톱 서비스 어레인지 선택:</span>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-1">
        {LOCAL_PROVIDER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyLocalPreset(preset.id)}
            className={`py-2.5 px-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
              localPreset === preset.id ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-black' : 'border-slate-800 bg-slate-905 text-slate-400 hover:text-slate-300'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 pt-2">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1 font-bold">로컬 호스트 주소 (Endpoint Host)</label>
          <input
            type="text"
            value={draftCustomEndpoint}
            onChange={(event) => setDraftCustomEndpoint(event.target.value)}
            placeholder={selectedPreset.endpoint}
            className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 font-mono"
          />
        </div>

        <ModelLookupField
          lookup={lookup}
          draftCustomModel={draftCustomModel}
          setDraftCustomModel={setDraftCustomModel}
          setModelSearchQuery={setModelSearchQuery}
          onFetchModels={onFetchModels}
          fetchLabel="🔄 가용 로컬 모델 목록 확인"
          emptyPlaceholder={selectedPreset.model}
          searchRingClass="focus:ring-teal-500"
          selectBorderClass="border border-teal-500/40"
        />
      </div>
    </div>
  );
}
