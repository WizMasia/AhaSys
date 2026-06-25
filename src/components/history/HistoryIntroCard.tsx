import { Trash2 } from 'lucide-react';
import type { HistoryThemeProps } from './historyTypes';

interface HistoryIntroCardProps extends HistoryThemeProps {
  readonly clearHistoryLedger: () => Promise<void>;
}

export function HistoryIntroCard({ darkMode, clearHistoryLedger }: HistoryIntroCardProps) {
  return (
    <div className={`p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="space-y-1">
        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-3 py-0.5 rounded uppercase font-bold">자가 축적형 RAG 대조 보관소</span>
        <h3 className="text-2xl font-black tracking-tight">지식 누적 및 심의 로그 데이터베이스 (Compliance Log)</h3>
        <p className="text-xs text-slate-400 max-w-xl">
          이전에 단프라 심의 위원회를 거쳐 검사된 광고 텍스트와 이미지 분석 이력이 보수 저장되어 있습니다. 기록을 키워드별, 영역별로 복합 검색해 재심사하거나 결과보고서를 즉시 복원할 수 있습니다.
        </p>
      </div>

      <button
        id="clear_ledger_btn"
        onClick={clearHistoryLedger}
        className="py-2.5 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>데이터 일괄 삭제</span>
      </button>
    </div>
  );
}
