import { AlertTriangle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { SystemAnalysisResult } from '../../types';
import type { CsatGradeInfo } from './ReviewTab.types';

interface GradeSummaryCardProps {
  readonly analysisResult: SystemAnalysisResult;
  readonly getCsatGradeInfo: (score: number) => CsatGradeInfo;
  readonly getScoreColor: (score: number) => string;
}

export function GradeSummaryCard({ analysisResult, getCsatGradeInfo, getScoreColor }: GradeSummaryCardProps) {
  const { darkMode } = useApp();

  return (
    <>
            {/* Csat Grade Card Dashboard Indicator */}
            {(() => {
              const gradeInfo = getCsatGradeInfo(analysisResult.score);
              return (
                <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 printable-report tracking-tight ${darkMode ? 'bg-[#101729] border-slate-800' : 'bg-white border-slate-205 shadow-md'}`}>
                  <div className="space-y-3 text-center md:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded font-black uppercase tracking-wider">
                        수능 등급식 법규 성적표
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded font-black flex items-center gap-1 ${gradeInfo.color}`}>
                        {gradeInfo.hasWarning && <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 select-none animate-bounce" />}
                        <span>{gradeInfo.label}</span>
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${gradeInfo.isPassed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35' : 'bg-rose-500/15 text-rose-400 border border-rose-500/35'}`}>
                        {gradeInfo.isPassed ? '합격 (Pass)' : '심의 기각탈락 (Fail)'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-extrabold text-xl tracking-tight flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span>최종 판정:</span>
                        <span className={`font-black underline decoration-2 ${gradeInfo.isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {gradeInfo.isPassed ? '승인 통과 가능 (Approved)' : '심심 제재/반려 (Rejected)'}
                        </span>
                      </h3>
                      <p className={`text-xs font-semibold leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                        {gradeInfo.desc}
                      </p>
                    </div>

                    <div className="text-[11px] leading-normal text-slate-500 font-medium">
                      {gradeInfo.grade === 1 && "🎉 축하합니다! 완벽에 가까운 1등급 안심 문안입니다. 어떠한 사전 제재 조항 검출도 우회 승인되었습니다."}
                      {gradeInfo.grade === 2 && "⚠️ 2등급 판정: 미세 가이드 수치 조정이나 출처 제시가 요구되는 문단이 검출되었습니다. 조건부로 매체 유포할 수 있습니다."}
                      {gradeInfo.grade >= 3 && "🚫 탈락 (3등급 이하 법정 위험): 수능 심의 기준 3등급 이하는 시판 전면 불가 규격입니다. 아래의 AI 5단계 안전 정비안을 적용하여 대체 교체하여 주십시오."}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-center">
                    {/* CSAT-style Grade Medal */}
                    <div className={`w-28 h-28 rounded-2xl border flex flex-col items-center justify-center relative transition-transform hover:scale-105 duration-200 ${gradeInfo.color}`}>
                      {gradeInfo.hasWarning && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center absolute -top-2 -right-2 tracking-tighter" title="1등급 이외 경고조치 강제발령">
                          ⚠️
                        </span>
                      )}
                      <span className="text-3xl font-black font-serif">{gradeInfo.grade}</span>
                      <span className="text-[10px] font-black tracking-widest mt-0.5">등급</span>
                      <span className="text-[9px] font-bold opacity-85 mt-1">{gradeInfo.isPassed ? '통과 대상' : '탈락 대상'}</span>
                    </div>

                    {/* Right Panel: Total Score */}
                    <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shrink-0 ${getScoreColor(analysisResult.score)}`}>
                      <span className="text-2xl font-black">{analysisResult.score}</span>
                      <span className="text-[8px] font-bold text-slate-405">COMPLIANCE</span>
                    </div>
                  </div>
                </div>
              );
            })()}
    </>
  );
}
