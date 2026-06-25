import type { ModelLookupState } from './settingsTypes';

interface ModelLookupFieldProps {
  readonly lookup: ModelLookupState;
  readonly draftCustomModel: string;
  readonly setDraftCustomModel: (model: string) => void;
  readonly setModelSearchQuery: (query: string) => void;
  readonly onFetchModels: () => Promise<void>;
  readonly fetchLabel: string;
  readonly emptyPlaceholder: string;
  readonly searchRingClass: string;
  readonly selectBorderClass: string;
}

export function ModelLookupField({
  lookup,
  draftCustomModel,
  setDraftCustomModel,
  setModelSearchQuery,
  onFetchModels,
  fetchLabel,
  emptyPlaceholder,
  searchRingClass,
  selectBorderClass,
}: ModelLookupFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] text-slate-350 font-bold">지정 모델 ID (Model ID)</label>
        <button
          type="button"
          onClick={onFetchModels}
          disabled={lookup.fetchModelsLoading}
          className="py-1 px-2.5 rounded-md bg-[#1d273a] border border-indigo-500/20 text-[10px] text-indigo-300 hover:bg-[#27354f] hover:text-indigo-100 font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          {lookup.fetchModelsLoading ? '조회 중...' : fetchLabel}
        </button>
      </div>

      {lookup.fetchModelsError && (
        <p className="p-2 rounded bg-rose-950/40 border border-rose-900/40 text-[10.5px] text-rose-400 leading-normal font-semibold">
          ⚠️ {lookup.fetchModelsError}
        </p>
      )}

      {lookup.fetchedModels.length > 0 ? (
        <div className="space-y-2">
          <input
            type="search"
            value={lookup.modelSearchQuery}
            onChange={(event) => setModelSearchQuery(event.target.value)}
            placeholder="모델명 검색 후 선택"
            className={`w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:ring-1 ${searchRingClass} font-mono`}
          />
          <select
            value={lookup.sortedModelOptions.includes(draftCustomModel) ? draftCustomModel : ''}
            onChange={(event) => {
              if (event.target.value) setDraftCustomModel(event.target.value);
            }}
            className={`w-full p-2.5 rounded-lg bg-slate-900 ${selectBorderClass} text-xs text-teal-400 focus:ring-1 focus:ring-amber-500 font-extrabold cursor-pointer`}
          >
            <option value="" disabled className="bg-slate-950 text-slate-500">
              {lookup.sortedModelOptions.length > 0 ? 'ABC 정렬된 모델 목록에서 선택' : '검색 결과가 없습니다'}
            </option>
            {lookup.sortedModelOptions.map((model) => (
              <option key={model} value={model} className="bg-slate-950 text-slate-300 font-mono">
                {model}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-teal-500/80">&bull; 전체 {lookup.fetchedModels.length}개 모델을 ABC 순서로 정렬했습니다. 현재 검색 결과는 {lookup.sortedModelOptions.length}개입니다.</p>
          <input
            type="text"
            value={draftCustomModel}
            onChange={(event) => setDraftCustomModel(event.target.value)}
            placeholder={emptyPlaceholder}
            className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 font-mono"
          />
          <p className="text-[10px] text-slate-500">&bull; 검색 목록에 없어도 모델 ID를 직접 입력할 수 있습니다.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <input
            type="text"
            value={draftCustomModel}
            onChange={(event) => setDraftCustomModel(event.target.value)}
            placeholder={emptyPlaceholder}
            className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 font-mono"
          />
          <p className="text-[10px] text-slate-500">&bull; 원하시는 모델명이 모델 목록 가져오기 전인 경우 직접 기입해 주셔도 됩니다.</p>
        </div>
      )}
    </div>
  );
}
