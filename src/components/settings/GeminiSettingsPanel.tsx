interface GeminiSettingsPanelProps {
  readonly draftCustomApiKey: string;
  readonly setDraftCustomApiKey: (apiKey: string) => void;
}

export function GeminiSettingsPanel({ draftCustomApiKey, setDraftCustomApiKey }: GeminiSettingsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 space-y-2">
        <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
          <span>🌟 Gemini 인프라 공유 기본 탑재 모델</span>
        </h5>
        <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
          WizMasia Cloud에서 기본 제공하는 공유 자원을 점유 호출합니다. 별도의 개인 API Key 세팅을 할 필요 없이 즉시 기동 가능하지만, 타 사용자와 트래픽 공유로 인하여 일시적 429 Quota Alert 한도 초과 오류가 노출될 수 있습니다.
        </p>
      </div>

      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-3">
        <label className="block text-[11px] text-slate-400 font-bold">개인전용 Gemini API Key (선택)</label>
        <input
          type="password"
          value={draftCustomApiKey}
          onChange={(event) => setDraftCustomApiKey(event.target.value)}
          placeholder="AI Studio에서 발급받은 API Key (AIzaSy...)"
          className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-700 focus:ring-1 focus:ring-amber-500 font-mono"
        />
        <p className="text-[10px] text-slate-500">&bull; 개인용 키를 입력하고 저장하시면 서버 공용 일일 트래픽 한도(429)와 무관하게 안정적인 독립 연산이 보장됩니다.</p>
      </div>
    </div>
  );
}
