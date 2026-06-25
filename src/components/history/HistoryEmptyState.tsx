interface HistoryEmptyStateProps {
  readonly kind: 'empty-ledger' | 'empty-filter';
}

export function HistoryEmptyState({ kind }: HistoryEmptyStateProps) {
  if (kind === 'empty-ledger') {
    return (
      <div className="p-12 border border-dashed rounded-3xl text-center text-slate-500 text-xs">
        저장된 자가 학습용 사례 데이터가 아직 없습니다. 최초 실시간 광고안 탐색을 마치는 즉시 기억 소자 노드가 누적됩니다.
      </div>
    );
  }

  return (
    <div className="p-12 border border-dashed border-slate-800 rounded-3xl text-center text-slate-500 text-xs">
      설정한 필터 조건 및 키워드에 부합하는 검토 이력이 없습니다. 검색어를 조율해 보십시오.
    </div>
  );
}
