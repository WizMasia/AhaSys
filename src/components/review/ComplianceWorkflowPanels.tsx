import { Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { SystemAnalysisResult } from '../../types';
import type { Severity } from './ReviewTab.types';

interface ComplianceWorkflowPanelsProps {
  readonly analysisResult: SystemAnalysisResult;
  readonly inputText: string;
  readonly makeLawGoLink: (clause: string) => string;
  readonly getSeverityBadge: (severity: Severity) => string;
}

export function ComplianceWorkflowPanels({
  analysisResult,
  inputText,
  makeLawGoLink,
  getSeverityBadge,
}: ComplianceWorkflowPanelsProps) {
  const { darkMode } = useApp();

  return (
    <>
            {/* Core 3-Stage Compliance Workflow Panels */}
            <div className="space-y-4">

              {/* Stage 1: Autonomous Meta Parsing */}
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-slate-950 font-black text-[11px] flex items-center justify-center">1</span>
                  <h4 className="font-bold text-xs uppercase tracking-wide text-indigo-300">1단계: 자율 가중 문맥 추론 메타포팅 (Context Analysis)</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Product Type (물품)", value: analysisResult.parsedMeta.productType || '일반 광고' },
                    { label: "Target Demographic (대상)", value: analysisResult.parsedMeta.targets || '일반 성인' },
                    { label: "Regulatory Domain (규정)", value: analysisResult.parsedMeta.regulatoryDomain || '공정거래규정', colorClass: "text-orange-400" },
                    { label: "Marketing Channel (매체)", value: analysisResult.parsedMeta.channels || '소셜 네트워크' }
                  ].map((card, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150'}`}>
                      <span className="block text-[9px] text-slate-500 uppercase font-bold">{card.label}</span>
                      <span className={`font-extrabold text-xs ${card.colorClass || 'text-slate-200'}`}>{card.value}</span>
                    </div>
                  ))}
                </div>

                {analysisResult.agentsActivated && analysisResult.agentsActivated.length > 0 && (
                  <div className="mt-3 p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                    <span className="block text-[9px] text-indigo-400 font-extrabold uppercase tracking-wide mb-1.5">🛡️ 평가 참여 에이전트 브리핑 (Agent Audit Briefing)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.agentsActivated.map((agent, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-900 border border-slate-800/80 text-indigo-300 px-2.5 py-0.5 rounded-lg font-bold">
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Visual Alternative Proposal Card for Multimodal Image Evaluation */}
              {analysisResult.imageAlternativeProposal && (
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1d3a]/60 border-indigo-500/25' : 'bg-indigo-50/50 border-indigo-150'} space-y-4`}>
                  <div className="flex items-center gap-2 border-b border-indigo-500/10 pb-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-450 shrink-0" />
                    <h4 className="font-extrabold text-xs uppercase tracking-wide text-indigo-300">
                      🎨 이미지 파스 진단: 비주얼 카피 및 레이아웃 교정 초안 제안
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950/90 border-slate-850/80' : 'bg-rose-500/5 border-rose-100'} space-y-2`}>
                      <span className="block text-[10px] text-rose-400 font-extrabold uppercase tracking-wide">식별된 원본 시각적 하자 (Detected Visual Risks)</span>
                      <div className="space-y-2">
                        {analysisResult.imageAlternativeProposal.detectedVisualCopys && analysisResult.imageAlternativeProposal.detectedVisualCopys.length > 0 && (
                          <div className="space-y-1">
                            <span className="block text-[9px] text-slate-505 font-bold">식별 텍스트:</span>
                            {analysisResult.imageAlternativeProposal.detectedVisualCopys.map((copy, idx) => (
                              <div key={idx} className="text-xs text-slate-300 flex items-start gap-1">
                                <span className="text-slate-500">•</span>
                                <span>&quot;{copy}&quot;</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {analysisResult.imageAlternativeProposal.visualViolations && analysisResult.imageAlternativeProposal.visualViolations.length > 0 && (
                          <div className="space-y-1">
                            <span className="block text-[9px] text-slate-505 font-bold">비주얼 리스크 소견:</span>
                            {analysisResult.imageAlternativeProposal.visualViolations.map((vv, idx) => (
                              <div key={idx} className="text-xs text-rose-400/90 flex items-start gap-1">
                                <span className="text-rose-500 font-bold">⚠️</span>
                                <span>{vv}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950/90 border-slate-850/80' : 'bg-emerald-500/5 border-emerald-100'} space-y-2`}>
                      <span className="block text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide">수정 권고 시각 조치선 (Recommended Visual Adjustments)</span>
                      {analysisResult.imageAlternativeProposal.visualRemediationSteps && (
                        <div className="space-y-1.5">
                          {analysisResult.imageAlternativeProposal.visualRemediationSteps.map((step, idx) => (
                            <div key={idx} className="text-xs text-slate-300 flex items-start gap-1">
                              <span className="text-emerald-500">✔</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/80 border-slate-850' : 'bg-white border-slate-205'} space-y-1.5`}>
                    <span className="block text-[10px] text-amber-400 font-extrabold uppercase tracking-wide">💡 정제 비주얼 우회 가이드라인 및 레이아웃 시안 설명</span>
                    <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                      {analysisResult.imageAlternativeProposal.alternativeVisualDraft}
                    </p>
                  </div>
                </div>
              )}

              {/* Stage 2: Violations and Warning Deductions */}
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center">2</span>
                    <h4 className="font-bold text-xs uppercase tracking-wide text-amber-400">2단계: 정밀 벌점 공출 내역 (Violations Ledger)</h4>
                  </div>
                  <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">감점 합산: {analysisResult.violations.reduce((acc, curr) => acc + curr.deductionPoints, 0)}점</span>
                </div>

                {analysisResult.violations.length === 0 ? (
                  <div className="p-4 rounded-xl text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    🎉 위반 사안이 검출되지 않았습니다. 브랜드 이미지에 부합하는 정직하고 안전한 광고 문안입니다!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysisResult.violations.map((v, i) => (
                      <div key={v.id || i} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/55 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs text-rose-400">{v.clause}</span>
                            <a
                              href={makeLawGoLink(v.clause)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="no-print text-[10px] font-black bg-indigo-500/10 hover:bg-slate-800 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded flex items-center gap-0.5 shadow-sm transition-all"
                              title="국가법령정보공동연계 자동조회 바로가기"
                            >
                              <span>law.go.kr ↗</span>
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                            <span className={`px-2 py-0.5 rounded-full ${getSeverityBadge(v.severity)}`}>{v.severity} Case</span>
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full">벌점 -{v.deductionPoints}점</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3"><strong className="text-slate-505">원인:</strong> {v.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] border-t border-slate-800/40 pt-3">
                          <div className="bg-rose-500/5 p-2 rounded border border-rose-500/10 text-rose-300">
                            <span className="block font-bold text-[9px] text-slate-500 mb-1">문제가 발견된 원본 구절</span>
                            <span>&quot;{v.originalFragment}&quot;</span>
                          </div>
                          <div className="bg-emerald-500/5 p-2 rounded border border-emerald-500/10 text-emerald-300">
                            <span className="block font-bold text-[9px] text-slate-500 mb-1">법적 무해 안전 대안 교정안</span>
                            <span>&quot;{v.replacement}&quot;</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stage 3: Professional High-Conversion Alternatives */}
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800/80' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center justify-center">3</span>
                  <h4 className="font-bold text-xs uppercase tracking-wide text-emerald-300">3단계: 법적 세이프티 정제 대안총안 (Alternatives Recommendation)</h4>
                </div>

                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs text-slate-300 space-y-4">
                  <p className="border-b border-slate-850 pb-2 text-[10px] text-slate-505">법적 하자가 전혀 없는 최적 고매출 전환 대안안을 조합해 드립니다.</p>

                  {analysisResult.violations.length === 0 ? (
                    <div className="text-slate-400 text-xs">
                      위반 요소가 없어 대안 문구를 결합할 필요가 없습니다. 현재 원본 문구를 자신 있게 그대로 발행하십시오!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <strong className="block text-[10px] text-rose-400 mb-1">🚨 [위험] 기존 오인지 원안</strong>
                        <p className="bg-rose-500/5 p-2.5 rounded text-rose-300 italic border border-rose-500/10">&quot;{inputText}&quot;</p>
                      </div>

                      <div>
                        <strong className="block text-[10px] text-emerald-400 mb-1">✅ [적합] 안심심 정제 통과안</strong>
                        <p className="bg-emerald-500/5 p-2.5 rounded text-emerald-300 font-bold border border-emerald-500/10">
                          {inputText.split(' ').map(word => {
                            const matchingViolation = analysisResult.violations.find(v => v.originalFragment && word.includes(v.originalFragment));
                            return matchingViolation ? `[${matchingViolation.replacement}]` : word;
                          }).join(' ')}
                        </p>
                        <span className="block mt-1 text-[9px] text-slate-500 leading-tight">괄호([]) 내의 정제된 단어로 바꿔 발송 시, 공정거래 기만 금지 보장률 100% 달성 및 마케팅 톤을 충실히 확보합니다.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
    </>
  );
}
