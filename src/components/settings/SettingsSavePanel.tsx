import { Check, Save } from 'lucide-react';

interface SettingsSavePanelProps {
  readonly settingsSavedSuccess: boolean;
  readonly onSave: () => void;
}

export function SettingsSavePanel({ settingsSavedSuccess, onSave }: SettingsSavePanelProps) {
  return (
    <div className="pt-4 border-t border-slate-900 flex flex-col items-center gap-3">
      {settingsSavedSuccess && (
        <div id="settings_save_toast_banner" className="w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex gap-2 animate-pulse leading-normal font-bold">
          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
          <span>🎉 환경설정이 브라우저 보존 공간에 성공적으로 기입되었습니다. 모든 가동 컴플라이언스 엔진 대조 연산 시 저장된 복합 어댑터 규칙이 즉각 연동 적용됩니다.</span>
        </div>
      )}

      <button
        type="button"
        id="settings_save_button"
        onClick={onSave}
        className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition-all cursor-pointer text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
      >
        <Save className="w-4 h-4" />
        <span>환경설정 저장하기 (Save Configurations)</span>
      </button>
    </div>
  );
}
