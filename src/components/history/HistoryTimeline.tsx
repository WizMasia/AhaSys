import { AlertTriangle, Copy, FileText } from 'lucide-react';
import type { HistoryItem } from '../../types/api';
import type { HistoryGradeInfo, HistoryThemeProps } from './historyTypes';

interface HistoryTimelineProps extends HistoryThemeProps {
  readonly filteredItems: readonly HistoryItem[];
  readonly setInputText: (text: string) => void;
  readonly restoreHistoryResult: (item: HistoryItem) => void;
  readonly getCsatGradeInfo: (score: number) => HistoryGradeInfo;
}

interface HistoryTimelineItemProps extends HistoryThemeProps {
  readonly item: HistoryItem;
  readonly setInputText: (text: string) => void;
  readonly restoreHistoryResult: (item: HistoryItem) => void;
  readonly getCsatGradeInfo: (score: number) => HistoryGradeInfo;
}

function HistoryTimelineItem({
  darkMode,
  item,
  setInputText,
  restoreHistoryResult,
  getCsatGradeInfo,
}: HistoryTimelineItemProps) {
  const info = getCsatGradeInfo(item.score);

  return (
    <div className="relative">
      <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#0b0f19] bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold" />

      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm'} transition-colors space-y-3`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-x-1.5">
            <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded font-mono font-bold uppercase">{item.meta?.productType || '일반 광고'}</span>
            <span className="text-[9px] bg-slate-805 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold">{item.meta?.regulatoryDomain || '기본 표시법'}</span>
            {item.imagePresent && (
              <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold">📷 이미지 첨부됨</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-slate-500 font-mono">{new Date(item.timestamp).toLocaleString()}</span>
            <span className={`px-2 py-0.5 rounded-full font-black text-[9px] flex items-center gap-0.5 ${info.color}`}>
              {info.hasWarning && <AlertTriangle className="w-2.5 h-2.5 text-amber-550 shrink-0 select-none" />}
              <span>{info.grade}등급 ({info.isPassed ? '합격' : '반려/조정'})</span>
            </span>
          </div>
        </div>

        <div>
          <strong className="block text-[11px] font-extrabold text-slate-500 mb-1">제출 원안 카피:</strong>
          <p className="text-xs text-slate-300 italic leading-relaxed bg-[#0a0e18] p-3 rounded-xl border border-slate-900 select-all font-sans">
            &quot;{item.inputText}&quot;
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-850/40 pt-3 flex-wrap gap-2">
          <div className="space-x-3">
            <span>종합 평가벌점: <strong className="text-slate-300 font-black">{item.score}점</strong></span>
            <span>사용 엔진 어댑터: <strong className="text-indigo-400">{item.result?.usage?.totalTokens ? 'AI Cloud Engine' : 'Local/Standard Engine'}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 no-print">
            <button
              onClick={() => {
                setInputText(item.inputText || '');
                alert('광고 원문 카피가 상단 검사창에 입력되었습니다. 수정하거나 신규 진단을 개시하십시오.');
              }}
              className={`py-1 px-2.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                darkMode ? 'border-slate-800 bg-slate-805 hover:bg-slate-800 text-slate-350' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
              title="입력창에 본문 텍스트 복사"
            >
              <Copy className="w-3 h-3 text-indigo-400" />
              <span>입력창 복원</span>
            </button>

            <button
              onClick={() => restoreHistoryResult(item)}
              className={`py-1 px-2.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                darkMode ? 'border-slate-800 bg-slate-805 hover:bg-slate-800 text-slate-350' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
              title="기 연산된 상세보고서 뷰어 즉시 로드"
            >
              <FileText className="w-3 h-3 text-indigo-400" />
              <span>상세 결과보고서 다시보기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HistoryTimeline({
  darkMode,
  filteredItems,
  setInputText,
  restoreHistoryResult,
  getCsatGradeInfo,
}: HistoryTimelineProps) {
  return (
    <div className="relative border-l-2 border-indigo-500/20 pl-6 ml-4 space-y-6 py-2">
      {filteredItems.map((item, idx) => (
        <HistoryTimelineItem
          key={item.id || idx}
          darkMode={darkMode}
          item={item}
          setInputText={setInputText}
          restoreHistoryResult={restoreHistoryResult}
          getCsatGradeInfo={getCsatGradeInfo}
        />
      ))}
    </div>
  );
}
