import { Layers } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { SystemAnalysisResult } from '../../types';

interface LegalMappingPanelProps {
  readonly analysisResult: SystemAnalysisResult;
  readonly makeLawGoLink: (clause: string) => string;
}

export function LegalMappingPanel({ analysisResult, makeLawGoLink }: LegalMappingPanelProps) {
  const { darkMode } = useApp();

  return (
    <>
            {/* 5-Tier Legal Hierarchy & Exponential RAG Decay score details */}
            <div className={`p-5 rounded-3xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-400 animate-bounce" />
                  <h4 className="font-bold text-xs uppercase tracking-wide">5단계 법률 위계 매핑 & RAG 연관성 지수 공식</h4>
                </div>
                <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">Score = e^(-D/1350) * 100</span>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  8.2조 정밀 기준에 의거하여, L2 연관 벡터 정규화 지수가 <strong>80% 미만</strong>인 법조항 정보물은 노이즈 경감을 위해 프롬프트 컨텍스트에서 실시간으로 강제 배제(Hard Filtered Out) 처리 되었습니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisResult.matchedLaws.map((law, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5 flex-wrap">
                          <span className="text-[9px] font-extrabold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Tier {law.tier}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-black ${law.relevance >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{law.relevance}% 유사도</span>
                            <a
                              href={makeLawGoLink(law.title)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="no-print text-[9px] font-extrabold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-0.5 shrink-0 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded"
                              title="국가법령정보 본문 조회"
                            >
                              <span>공동연계 ↗</span>
                            </a>
                          </div>
                        </div>
                        <span className="block font-bold text-xs text-slate-202 mb-1">{law.title}</span>
                        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{law.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
    </>
  );
}
