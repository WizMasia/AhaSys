import { Cpu } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { SystemAnalysisResult } from '../../types';

interface UsageAnalyticsCardProps {
  readonly analysisResult: SystemAnalysisResult;
}

export function UsageAnalyticsCard({ analysisResult }: UsageAnalyticsCardProps) {
  const { darkMode, adapterType, customModel } = useApp();

  return (
    <>
            {/* Token Consumption & Analysis Latency Analytics Box when using LLM */}
            {(analysisResult.usage || analysisResult.analysisTimeMs) && (
              <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 printable-report ${darkMode ? 'bg-indigo-950/20 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-200'}`}>
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-indigo-405 font-extrabold uppercase tracking-widest leading-none mb-1">⚡ 실시간 인프라 심사 연산 제원</span>
                    <span className="text-[11px] text-slate-400 leading-normal">
                      총 {analysisResult.analysisTimeMs ? (analysisResult.analysisTimeMs / 1000).toFixed(2) : '0.00'}초 소요 | {adapterType === 'GEMINI' ? 'Gemini API' : 'OpenAI-Compatible'} ({customModel}) 연동 분석
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-xs font-mono self-end md:self-center">
                  <div className="text-center">
                    <span className="block text-[8px] text-slate-505 mb-0.5 font-bold">ANALYSIS TIME</span>
                    <span className="font-extrabold text-amber-400">{analysisResult.analysisTimeMs ? (analysisResult.analysisTimeMs / 1000).toFixed(2) : '0.00'}<span className="text-[10px] font-normal">s</span></span>
                  </div>
                  <div className="text-slate-705 font-bold">/</div>
                  {analysisResult.usage && (
                    <>
                      <div className="text-center">
                        <span className="block text-[8px] text-slate-505 mb-0.5 font-bold">INPUT TOKENS</span>
                        <span className="font-extrabold text-slate-300">{analysisResult.usage.promptTokens.toLocaleString()}</span>
                      </div>
                      <div className="text-slate-705 font-bold">/</div>
                      <div className="text-center">
                        <span className="block text-[8px] text-slate-505 mb-0.5 font-bold">OUTPUT TOKENS</span>
                        <span className="font-extrabold text-indigo-400">{analysisResult.usage.completionTokens.toLocaleString()}</span>
                      </div>
                      <div className="text-slate-705 font-bold">=</div>
                      <div className="text-center bg-indigo-500/10 px-3.5 py-1.5 rounded-xl border border-indigo-500/20">
                        <span className="block text-[8px] text-indigo-300 mb-0.5 font-black uppercase">TOTAL TOKENS</span>
                        <span className="font-black text-indigo-300">{analysisResult.usage.totalTokens.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
    </>
  );
}
