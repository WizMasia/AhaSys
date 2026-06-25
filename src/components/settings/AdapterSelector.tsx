import { Sliders } from 'lucide-react';
import { DEFAULT_GEMINI_MODEL } from '../../constants/llm';
import { useApp } from '../../contexts/AppContext';
import { LLMType } from '../../types';

interface AdapterSelectorProps {
  readonly draftAdapterType: LLMType;
  readonly setDraftAdapterType: (type: LLMType) => void;
  readonly setDraftCustomModel: (model: string) => void;
  readonly applyLocalPreset: () => void;
  readonly applyCloudPreset: () => void;
}

export function AdapterSelector({
  draftAdapterType,
  setDraftAdapterType,
  setDraftCustomModel,
  applyLocalPreset,
  applyCloudPreset,
}: AdapterSelectorProps) {
  const { darkMode } = useApp();
  const buttonClass = (selected: boolean, selectedClass: string): string => (
    `py-3 px-2 rounded-xl border text-xs font-black cursor-pointer text-center transition-all ${
      selected ? selectedClass : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-350 hover:bg-slate-900/60'
    }`
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 mb-1 text-slate-300">
        <Sliders className="w-4 h-4 text-amber-500" />
        <h4 className={`font-black text-sm uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-950 font-black'}`}>1. 기저 추론 엔진 선정</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          id="settings_adapter_tab_gemini"
          onClick={() => {
            setDraftAdapterType(LLMType.GEMINI);
            setDraftCustomModel(DEFAULT_GEMINI_MODEL);
          }}
          className={buttonClass(draftAdapterType === LLMType.GEMINI, 'border-amber-500 bg-amber-500/15 text-amber-400 font-extrabold shadow-md')}
        >
          기본 Gemini 어댑터
        </button>
        <button
          type="button"
          id="settings_adapter_tab_ollama"
          onClick={() => {
            setDraftAdapterType(LLMType.OLLAMA);
            applyLocalPreset();
          }}
          className={buttonClass(draftAdapterType === LLMType.OLLAMA, 'border-teal-500 bg-teal-500/15 text-teal-400 font-extrabold shadow-md')}
        >
          로컬 데스크톱 LLM 어댑터
        </button>
        <button
          type="button"
          id="settings_adapter_tab_custom"
          onClick={() => {
            setDraftAdapterType(LLMType.CUSTOM);
            applyCloudPreset();
          }}
          className={buttonClass(draftAdapterType === LLMType.CUSTOM, 'border-indigo-500 bg-indigo-500/15 text-indigo-405 font-extrabold shadow-md')}
        >
          기타 타사 클라우드 API
        </button>
      </div>
    </div>
  );
}
