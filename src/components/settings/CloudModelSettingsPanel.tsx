import { HelpCircle } from 'lucide-react';
import { CLOUD_PROVIDER_PRESETS, getCloudPresetAdapter } from './providerPresetAdapters';
import type { CloudPreset, ModelLookupState } from './settingsTypes';
import { ModelLookupField } from './ModelLookupField';

interface CloudModelSettingsPanelProps {
  readonly cloudPreset: CloudPreset;
  readonly applyCloudPreset: (preset: CloudPreset) => void;
  readonly draftCustomEndpoint: string;
  readonly setDraftCustomEndpoint: (endpoint: string) => void;
  readonly draftCustomApiKey: string;
  readonly setDraftCustomApiKey: (apiKey: string) => void;
  readonly draftCustomModel: string;
  readonly setDraftCustomModel: (model: string) => void;
  readonly lookup: ModelLookupState;
  readonly setModelSearchQuery: (query: string) => void;
  readonly onFetchModels: () => Promise<void>;
}

const PresetNotice = ({ cloudPreset }: { readonly cloudPreset: CloudPreset }) => {
  if (cloudPreset === 'openai') {
    return (
      <div className="text-amber-400 flex items-start gap-1.5">
        <HelpCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <span>기본 제공: OpenAI GPT-4o-mini 프리셋이 선택되었습니다. 호스팅 통신 인가를 위해 본인의 OpenAI Key를 하단에 기재해 주셔야 합니다.</span>
      </div>
    );
  }
  if (cloudPreset === 'openrouter') {
    return (
      <div className="text-indigo-400 flex items-start gap-1.5">
        <HelpCircle className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
        <span>기본 제공: OpenRouter Free Model 프리셋이 선택되었습니다. API Key 필수 기입이 필요합니다.</span>
      </div>
    );
  }

  return (
    <div className="text-rose-450 flex items-start gap-1.5">
      <HelpCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
      <span>⚠️ OpenAI 및 OpenRouter 이외의 타사 OpenAI 호환 클라우드 LLM 서비스를 연동하시는 경우, 직접 엔드포인트 URL과 지정 모델 ID, API Key를 입력해주셔야 정상 연동됩니다.</span>
    </div>
  );
};

export function CloudModelSettingsPanel({
  cloudPreset,
  applyCloudPreset,
  draftCustomEndpoint,
  setDraftCustomEndpoint,
  draftCustomApiKey,
  setDraftCustomApiKey,
  draftCustomModel,
  setDraftCustomModel,
  lookup,
  setModelSearchQuery,
  onFetchModels,
}: CloudModelSettingsPanelProps) {
  const selectedPreset = getCloudPresetAdapter(cloudPreset);

  return (
    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
      <div className="flex items-center justify-between text-xs font-bold text-slate-350">
        <span className="font-black text-indigo-400">🌐 클라우드 외부 서비스 프리셋 선택:</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pb-2">
        {CLOUD_PROVIDER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyCloudPreset(preset.id)}
            className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all ${
              cloudPreset === preset.id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-300'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="p-3.5 rounded-xl bg-[#121626] border border-indigo-500/10 text-xs text-slate-300 leading-relaxed font-semibold">
        <PresetNotice cloudPreset={cloudPreset} />
      </div>

      <div className="space-y-3.5">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1 font-bold flex items-center justify-between">
            <span>엔드포인트 주소 (Endpoint Host URL)</span>
            <span className="text-[10px] text-indigo-400 font-mono italic">{selectedPreset.endpoint ? `기본: ${selectedPreset.endpoint}` : '사용자 입력'}</span>
          </label>
          <input
            type="text"
            value={draftCustomEndpoint}
            onChange={(event) => setDraftCustomEndpoint(event.target.value)}
            placeholder={selectedPreset.endpoint || 'https://example.com/v1'}
            className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-700 focus:ring-1 focus:ring-amber-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1 font-bold">인증 권한 토큰 API Key</label>
          <input
            type="password"
            value={draftCustomApiKey}
            onChange={(event) => setDraftCustomApiKey(event.target.value)}
            placeholder={cloudPreset === 'openai' ? 'sk-...' : 'OpenRouter API Key'}
            className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-700 focus:ring-1 focus:ring-amber-500 font-mono"
          />
        </div>

        <div className="pt-2 border-t border-slate-900">
          <ModelLookupField
            lookup={lookup}
            draftCustomModel={draftCustomModel}
            setDraftCustomModel={setDraftCustomModel}
            setModelSearchQuery={setModelSearchQuery}
            onFetchModels={onFetchModels}
            fetchLabel="🔄 서비스 모델 목록 가져오기"
            emptyPlaceholder={selectedPreset.model || 'google/gemini-2.5-flash'}
            searchRingClass="focus:ring-indigo-500"
            selectBorderClass="border border-indigo-500/35"
          />
        </div>
      </div>
    </div>
  );
}
