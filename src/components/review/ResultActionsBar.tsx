import { Check, Copy, Printer } from 'lucide-react';

interface ResultActionsBarProps {
  readonly copied: boolean;
  readonly handleCopyMarkdown: () => void;
  readonly setShowPrintModal: (show: boolean) => void;
}

export function ResultActionsBar({ copied, handleCopyMarkdown, setShowPrintModal }: ResultActionsBarProps) {
  return (
    <>
            {/* Export and Actions Bar (Print/Copy) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between no-print border-b border-slate-800/20 pb-4 md:pb-2 gap-3">
              <span className="text-xs font-extrabold text-slate-500">📄 심의 결과보고서 인쇄 및 유통 도구:</span>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <button
                  onClick={handleCopyMarkdown}
                  className="w-full sm:w-auto py-2 px-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/25 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400 animate-bounce" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '클립보드 복사완료!' : 'Markdown 리포트 복사'}</span>
                </button>

                <button
                  onClick={() => setShowPrintModal(true)}
                  className="w-full sm:w-auto py-2 px-4 rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 animate-pulse"
                >
                  <Printer className="w-4 h-4" />
                  <span>새 창에서 보고서 인쇄 및 PDF 저장</span>
                </button>
              </div>
            </div>
    </>
  );
}
