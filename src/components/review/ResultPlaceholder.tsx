import { FileText, Loader2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface ResultPlaceholderProps {
  readonly hasResult: boolean;
  readonly loading: boolean;
}

export function ResultPlaceholder({ hasResult, loading }: ResultPlaceholderProps) {
  const { darkMode, adapterType, customModel } = useApp();
  const analysisResult = hasResult ? {} : null;

  return (
    <>
        {/* 1st State: Waiting placeholder when no evaluation has been requested yet */}
        {!analysisResult && !loading && (
          <div className={`p-12 text-center rounded-3xl border flex flex-col items-center justify-center ${darkMode ? 'bg-[#0f1524]/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="w-16 h-16 rounded-full bg-slate-800/10 dark:bg-slate-805/50 flex items-center justify-center mb-4 text-slate-505 shrink-0">
              <FileText className="w-8 h-8 text-indigo-400" />
            </div>
            <h4 className={`font-black mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-850'}`}>준법 심의 대기 상태</h4>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed mx-auto text-center">
              검증 대상 광고 카피 혹은 웹주소를 입력하고, 상단의 [초엄격 준법성 자율 규율 검수 시작] 버튼을 누르면 RAG 분석에 근거한 준법 보고서가 생성됩니다.
            </p>
          </div>
        )}

        {/* 2nd State: Loading skeleton while asynchronous RAG filters are evaluating */}
        {loading && !analysisResult && (
          <div className="space-y-4 animate-pulse">
            <div className="p-10 text-center rounded-3xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-405 shrink-0" />
              <span className="text-xs text-indigo-305 font-extrabold animate-pulse">{adapterType === 'GEMINI' ? 'Gemini API' : 'OpenAI-Compatible'} ({customModel}) RAG 하이브리드 인텔리전트 심사분류기 동기화 중...</span>
            </div>
            <div className="h-28 rounded-2xl bg-slate-800/20" />
            <div className="h-44 rounded-2xl bg-slate-800/20" />
            <div className="h-32 rounded-2xl bg-slate-800/20" />
          </div>
        )}
    </>
  );
}
