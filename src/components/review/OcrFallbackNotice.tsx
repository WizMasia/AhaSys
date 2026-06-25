import { FileText } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { SystemAnalysisResult } from '../../types';

interface OcrFallbackNoticeProps {
  readonly analysisResult: SystemAnalysisResult;
}

export function OcrFallbackNotice({ analysisResult }: OcrFallbackNoticeProps) {
  const { darkMode } = useApp();

  return (
    <>
            {analysisResult.ocrFallbackUsed && (
              <div className={`p-5 rounded-2xl border space-y-3 printable-report ${
                darkMode ? 'bg-amber-500/10 border-amber-500/25 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-start gap-2.5">
                  <FileText className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black">OCR 텍스트 기반 이미지 검토로 전환됨</h4>
                    <p className="text-xs leading-relaxed">
                      {analysisResult.ocrNotice || '선택한 모델이 이미지 입력을 직접 처리하지 못하는 것으로 확인되어, 서버 OCR로 추출한 문구만 광고 심사에 반영했습니다.'}
                    </p>
                  </div>
                </div>
                {analysisResult.ocrExtractedText && (
                  <pre className={`max-h-36 overflow-auto whitespace-pre-wrap rounded-xl border p-3 text-[11px] leading-relaxed ${
                    darkMode ? 'bg-slate-950/50 border-amber-500/15 text-slate-200' : 'bg-white/70 border-amber-200 text-slate-800'
                  }`}>
                    {analysisResult.ocrExtractedText}
                  </pre>
                )}
              </div>
            )}
    </>
  );
}
