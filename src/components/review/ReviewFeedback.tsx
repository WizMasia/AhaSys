import { HelpCircle, Info } from 'lucide-react';

interface ReviewFeedbackProps {
  readonly errorText: string | null;
  readonly localLlmErrorText: string | null;
}

export function ReviewFeedback({ errorText, localLlmErrorText }: ReviewFeedbackProps) {
  return (
    <>
        {errorText && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </div>
        )}

        {localLlmErrorText && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 leading-relaxed">
            <div className="flex gap-2 font-bold text-amber-400">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>분석 처리 안내</span>
            </div>
            <p className="pl-6 text-slate-300 whitespace-pre-wrap">{localLlmErrorText}</p>
          </div>
        )}
    </>
  );
}
