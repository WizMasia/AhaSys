import { Loader2, ShieldCheck } from 'lucide-react';

interface StartAnalysisButtonProps {
  readonly loading: boolean;
  readonly triggerAnalysis: () => Promise<void>;
}

export function StartAnalysisButton({ loading, triggerAnalysis }: StartAnalysisButtonProps) {
  return (
        <button
          id="start_review_btn"
          onClick={() => triggerAnalysis()}
          disabled={loading}
          className={`w-full mt-6 py-4 rounded-xl font-extrabold text-sm flex justify-center items-center gap-2 cursor-pointer transition-transform duration-200 active:scale-95 ${loading ? 'bg-slate-700 text-slate-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300'}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>준법 감시 위스크 분석이 진행 중입니다...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>초엄격 준법성 자율 규율 검수 시작</span>
            </>
          )}
        </button>
  );
}
