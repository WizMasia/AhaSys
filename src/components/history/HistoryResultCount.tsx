interface HistoryResultCountProps {
  readonly filteredCount: number;
}

export function HistoryResultCount({ filteredCount }: HistoryResultCountProps) {
  return (
    <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono pl-1">
      <span>
        조회된 필터링 결과: 총 <strong className="text-amber-500 font-extrabold">{filteredCount}개</strong> 이력 매치
      </span>
      <span>RAG 피팅 전용 퓨샷 활성화</span>
    </div>
  );
}
