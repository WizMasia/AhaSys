import { Database } from 'lucide-react';
import type { HistoryThemeProps } from './historyTypes';

interface HistoryFilterPanelProps extends HistoryThemeProps {
  readonly historySearchQuery: string;
  readonly setHistorySearchQuery: (query: string) => void;
  readonly historyCategoryFilter: string;
  readonly setHistoryCategoryFilter: (filter: string) => void;
  readonly historyVerdictFilter: string;
  readonly setHistoryVerdictFilter: (filter: string) => void;
}

export function HistoryFilterPanel({
  darkMode,
  historySearchQuery,
  setHistorySearchQuery,
  historyCategoryFilter,
  setHistoryCategoryFilter,
  historyVerdictFilter,
  setHistoryVerdictFilter,
}: HistoryFilterPanelProps) {
  return (
    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#0d1321] border-slate-805' : 'bg-slate-100 border-slate-200'} grid grid-cols-1 md:grid-cols-12 gap-3 items-center no-print`}>
      <div className="md:col-span-6 relative">
        <input
          type="text"
          value={historySearchQuery}
          onChange={(e) => setHistorySearchQuery(e.target.value)}
          placeholder="검색할 광고 카피 원문 또는 키워드를 기입하세요..."
          className={`w-full text-xs py-2 px-3 pl-8 rounded-xl outline-none border transition-all ${
            darkMode
              ? 'bg-[#0b0f19] border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500'
              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-450 focus:border-indigo-500'
          }`}
        />
        <Database className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-505 pointer-events-none" />
      </div>

      <div className="md:col-span-3">
        <select
          value={historyCategoryFilter}
          onChange={(e) => setHistoryCategoryFilter(e.target.value)}
          className={`w-full text-xs py-2 px-3 rounded-xl outline-none border transition-all cursor-pointer ${
            darkMode
              ? 'bg-[#0b0f19] border-slate-800 text-slate-300 focus:border-indigo-500'
              : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-500'
          }`}
        >
          <option value="all">📁 모든 심사 카테고리</option>
          <option value="food">식품 (건강기능/식품표시광고)</option>
          <option value="cosmetic">화장품 (기능성/일반화장품)</option>
          <option value="medical">의료 (병원/약사법/의료용구)</option>
          <option value="finance">금융 (금융상품/보장금소법)</option>
          <option value="general">일반 광고 (표시광고법 등)</option>
        </select>
      </div>

      <div className="md:col-span-3">
        <select
          value={historyVerdictFilter}
          onChange={(e) => setHistoryVerdictFilter(e.target.value)}
          className={`w-full text-xs py-2 px-3 rounded-xl outline-none border transition-all cursor-pointer ${
            darkMode
              ? 'bg-[#0b0f19] border-slate-800 text-slate-300 focus:border-indigo-500'
              : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-500'
          }`}
        >
          <option value="all">🟢 전체 준법 성적</option>
          <option value="passed">합격 통과 (80점 이상)</option>
          <option value="failed">반려/조정 필요 (80점 미만)</option>
        </select>
      </div>
    </div>
  );
}
