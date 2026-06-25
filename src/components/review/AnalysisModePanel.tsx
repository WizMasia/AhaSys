import { useApp } from '../../contexts/AppContext';
import type { AnalysisMode } from './ReviewTab.types';

interface AnalysisModePanelProps {
  readonly analysisMode: AnalysisMode;
  readonly setAnalysisMode: (mode: AnalysisMode) => void;
  readonly hasCustomKey: boolean;
}

export function AnalysisModePanel({ analysisMode, setAnalysisMode, hasCustomKey }: AnalysisModePanelProps) {
  const { darkMode } = useApp();

  return (
        <div className={`p-4 rounded-xl border mt-4 ${darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
          <span className="block text-xs font-extrabold text-indigo-300 mb-2.5 uppercase tracking-wide">
            ⚙️ 심사 분석 옵션 모드 (Auditing Mode Options)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAnalysisMode('optimized')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                analysisMode === 'optimized'
                  ? 'border-indigo-500 bg-indigo-500/10 text-slate-100 font-extrabold'
                  : darkMode ? 'border-slate-850 bg-slate-950/40 text-slate-400 hover:text-slate-205' : 'border-slate-200 bg-white text-slate-650 hover:text-slate-900'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black">⚡ 토큰 절약 최적화 모드</span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold">권장</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                메인 AI가 문맥을 1차 진단한 뒤, 리스크가 식별된 관련 서브 에이전트만 선택 기동하여 토큰 소모를 최소화합니다.
              </p>
            </button>

            <button
              type="button"
              disabled={!hasCustomKey}
              onClick={() => setAnalysisMode('full')}
              className={`p-3 rounded-xl border text-left transition-all ${
                !hasCustomKey
                  ? 'opacity-40 cursor-not-allowed border-slate-850 bg-slate-950/20 text-slate-500'
                  : analysisMode === 'full'
                  ? 'border-indigo-500 bg-indigo-500/10 text-slate-100 font-extrabold cursor-pointer'
                  : darkMode ? 'border-slate-850 bg-slate-950/40 text-slate-400 hover:text-slate-205 cursor-pointer' : 'border-slate-200 bg-white text-slate-650 hover:text-slate-900 cursor-pointer'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black">🛡️ 전체 정밀 전수 검사 모드</span>
                {!hasCustomKey && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">개인 Key 필요</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                6개의 전문 에이전트를 생략 없이 일제히 기동하여 모든 법률/사회적 리스크를 빈틈없이 전면 교차 심의합니다.
              </p>
            </button>
          </div>
        </div>
  );
}
