import { AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const GEMINI_TESTED_NOTICE = '현재 광고 검토 품질 테스트는 Gemini 어댑터 기준으로만 진행했습니다. 다른 모델에서는 위반 검출과 보고서 품질이 안정적이지 않을 수 있습니다.';

interface ReviewAlertsProps {
  readonly errorText: string | null;
  readonly setErrorText: (err: string | null) => void;
  readonly showKeyAlert: boolean;
  readonly setShowKeyAlert: (show: boolean) => void;
}

export function ReviewAlerts({ errorText, setErrorText, showKeyAlert, setShowKeyAlert }: ReviewAlertsProps) {
  const { darkMode, adapterType, setActiveTab } = useApp();
  const showQuotaAlert = (errorText !== null && (
    errorText.includes('Key') ||
    errorText.includes('키') ||
    errorText.includes('API') ||
    errorText.includes('Quota') ||
    errorText.includes('사용량') ||
    errorText.includes('429') ||
    errorText.includes('limit')
  )) || showKeyAlert;

  return (
    <>
      <div className={`rounded-2xl border p-4 text-xs leading-relaxed no-print ${
        darkMode ? 'border-amber-500/20 bg-amber-500/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-900'
      }`}>
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-2">
            <p className="font-bold">{GEMINI_TESTED_NOTICE}</p>
            {adapterType !== 'GEMINI' && (
              <button
                type="button"
                onClick={() => { setActiveTab('settings'); setErrorText(null); }}
                className="rounded-md border border-amber-500/30 px-2.5 py-1 text-[11px] font-black text-amber-300 transition-colors hover:bg-amber-500/10"
              >
                Gemini 설정으로 이동
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Urgent Gemini Quota/API Alert Banner */}
      {showQuotaAlert && (
        <div className="p-6 rounded-2xl border-2 border-rose-500 bg-rose-500/10 text-rose-400 space-y-3 no-print animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="font-extrabold text-sm uppercase tracking-wider text-rose-600">Gemini API 연산 긴급 우회 경보</span>
          </div>
          <div className="text-sm space-y-2 leading-relaxed">
            <p className={darkMode ? 'text-rose-300' : 'text-rose-900 font-bold'}>현재 RAG 심의 연산을 처리하는 무료 인프라 공유 <b>Gemini API Key의 사용량 한도(Quota Limit, 429)가 도달</b>했거나, <b>유효한 API 키가 설정되지 않았습니다.</b></p>
            <p className={darkMode ? 'text-rose-400' : 'text-slate-700'}>보안성 및 연산 성능을 온전히 유지하여 독립적인 심의 환경을 수립하고자 하시는 경우, 상단의 <strong className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer" onClick={() => { setActiveTab('settings'); setErrorText(null); }}>[LLM 설정] 탭</strong>으로 이동하셔서 개인용 Gemini API Key를 등록하여 주십시오.</p>
          </div>
          <div className="flex gap-2 pt-1 border-t border-rose-500/20">
            <button
              onClick={() => { setActiveTab('settings'); setErrorText(null); }}
              className="py-1.5 px-3 rounded bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] cursor-pointer"
            >
              설정 탭으로 이동하여 API Key 입력하기 &rarr;
            </button>
            <button
              onClick={() => { setShowKeyAlert(false); setErrorText(null); }}
              className="py-1.5 px-3 rounded bg-slate-800 text-slate-300 hover:text-slate-100 text-[11px] cursor-pointer"
            >
              경고 무시하고 닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
