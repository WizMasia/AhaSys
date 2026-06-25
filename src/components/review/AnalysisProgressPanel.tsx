import type { ReactNode } from 'react';
import { Check, Cpu, Loader2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { UploadedImage } from './ReviewTab.types';
import { getPredictedAgents } from './agentPrediction';

interface ProgressStep {
  readonly id: number;
  readonly title: string;
  readonly desc: string;
  readonly completed: boolean;
  readonly running: boolean;
  readonly extraInfo?: ReactNode;
}

interface AnalysisProgressPanelProps {
  readonly analysisProgress: number;
  readonly analysisStatusMsg: string;
  readonly inputText: string;
  readonly websiteUrl: string;
  readonly uploadedImages: readonly UploadedImage[];
}

export function AnalysisProgressPanel({
  analysisProgress,
  analysisStatusMsg,
  inputText,
  websiteUrl,
  uploadedImages,
}: AnalysisProgressPanelProps) {
  const { darkMode } = useApp();
  const progressSteps: readonly ProgressStep[] = [
    {
      id: 1,
      title: '1단계: 오케스트레이터 에이전트 기동 및 광고 파싱',
      desc: '제출된 텍스트 및 이미지 자원 분해 및 메타정보 파싱',
      completed: analysisProgress >= 20,
      running: analysisProgress < 20,
    },
    {
      id: 2,
      title: '2단계: 하이브리드 RAG 엔진 가동 및 법규/판례 키워드 대조',
      desc: '국가법령 및 위반 사례 데이터베이스 대조 연계 지수 도출',
      completed: analysisProgress >= 40,
      running: analysisProgress >= 20 && analysisProgress < 40,
    },
    {
      id: 3,
      title: '3단계: 오케스트레이터 분석 및 다중 에이전트 라우팅 연산',
      desc: '부문별 심사 적합성 감별 및 활성 타겟 서브 에이전트 경로 결정',
      completed: analysisProgress >= 65,
      running: analysisProgress >= 40 && analysisProgress < 65,
    },
    {
      id: 4,
      title: '4단계: 다중 전문 에이전트 병렬 협동 검정 구동',
      desc: 'LEGAL(식의약/금융/공정거래/정보망), SOCIAL, ESG, PRIVACY, YOUTH, COPYRIGHT 병렬 심의',
      completed: analysisProgress >= 85,
      running: analysisProgress >= 65 && analysisProgress < 85,
      extraInfo: analysisProgress >= 65 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {getPredictedAgents(inputText || websiteUrl, uploadedImages.length > 0).map((ag, idx) => (
            <span key={idx} className="text-[9px] bg-slate-900 border border-slate-800/80 text-indigo-300 px-2 py-0.5 rounded-md font-mono font-bold">
              • {ag}
            </span>
          ))}
        </div>
      ) : undefined,
    },
    {
      id: 5,
      title: '5단계: 검출 조항 가중치 집계 및 마케팅 안심 순화안 도출',
      desc: '최종 벌점 연산, 합격/반려 판정 및 1:1 세이프티 대체 카피 처방',
      completed: analysisProgress >= 100,
      running: analysisProgress >= 85 && analysisProgress < 100,
    },
  ];

  return (
    <div className={`mt-6 p-6 rounded-2xl border space-y-5 no-print transition-all duration-300 ${darkMode ? 'bg-[#0f1524]/80 border-indigo-500/20' : 'bg-white border-slate-205 shadow-md'}`}>
      <div className="flex justify-between items-center pb-3 border-b border-slate-800/10 dark:border-slate-800/50">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>AI 실시간 준법 감시 파이프라인 심사 중</span>
          </h4>
          <p className="text-[10px] text-slate-500 font-semibold">{analysisStatusMsg}</p>
        </div>
        <div className="text-right">
          <span className="font-mono text-lg font-black text-indigo-400 tracking-tight">{analysisProgress}%</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {progressSteps.map((step) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
              step.completed
                ? (darkMode ? 'bg-emerald-950/10 border-emerald-900/20 text-slate-300' : 'bg-emerald-550/5 border-emerald-100 text-slate-700')
                : step.running
                ? (darkMode ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-200 animate-pulse' : 'bg-indigo-50/50 border-indigo-200 text-indigo-900')
                : (darkMode ? 'bg-slate-950/30 border-slate-900/60 text-slate-600' : 'bg-slate-50 border-slate-150 text-slate-400')
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {step.completed ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                  <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                </div>
              ) : step.running ? (
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  <Loader2 className="w-3 h-3 animate-spin" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-slate-700 dark:border-slate-805 flex items-center justify-center text-[10px] font-bold">
                  {step.id}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-0.5">
              <h5 className="font-extrabold text-xs leading-none">{step.title}</h5>
              <p className="text-[10px] text-slate-500 leading-tight">{step.desc}</p>
              {step.extraInfo}
            </div>
            <div className="shrink-0 text-[10px] font-black uppercase tracking-wider">
              {step.completed ? (
                <span className="text-emerald-500 font-bold">완료</span>
              ) : step.running ? (
                <span className="text-indigo-400 font-bold animate-pulse">분석 중</span>
              ) : (
                <span className="text-slate-505 font-bold">대기</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/85">
        <div
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 h-1.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${analysisProgress}%` }}
        />
      </div>
    </div>
  );
}
