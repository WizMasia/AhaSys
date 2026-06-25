import { HelpCircle, Settings } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const GEMINI_TESTED_NOTICE = '현재 광고 검토 품질 테스트는 Gemini 어댑터 기준으로만 진행했습니다. 다른 OpenAI 호환 모델이나 로컬 모델은 응답 구조 차이로 위반 검출과 보고서 품질이 불안정할 수 있습니다.';

export function SettingsIntroCard() {
  const { darkMode } = useApp();

  return (
    <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-405 font-bold shadow-lg shadow-indigo-500/5">
          <Settings className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <h2 className={`font-black text-lg flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-950'}`}>
            <span>준법 RAG 엔진 물리 어댑터 설정</span>
            <span className="text-xs bg-slate-500/20 px-2 py-0.5 rounded font-normal text-slate-405 font-sans">LLM Configuration</span>
          </h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Select Infrastructure Adapter & Set API Key Credentials</p>
        </div>
      </div>

      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'} leading-relaxed`}>
        대한민국의 복합적 광고 법규 및 RAG 가중 전파 수칙을 통섭하는 물리 어댑터 어레인지 환경설정입니다.
        인프라 공유 기본 Gemini 모델을 활용할 수 있으나, 할당량 초과(429 Quota Exceeded) 예방이나 쾌적한 처리 향상을 위해 수동 API Key 우회 설정을 권장해 드립니다.
      </p>

      <div className={`mt-4 rounded-2xl border p-3 text-[11px] leading-relaxed ${
        darkMode ? 'border-amber-500/20 bg-amber-500/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-900'
      }`}>
        <div className="flex items-start gap-2">
          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-bold">{GEMINI_TESTED_NOTICE}</p>
        </div>
      </div>
    </div>
  );
}
