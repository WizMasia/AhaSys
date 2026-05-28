/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  RefreshCw, 
  Play, 
  FileText 
} from 'lucide-react';
import { BenchmarkCase } from '../types';

interface BenchmarkTabProps {
  darkMode: boolean;
  benchmarkRunning: boolean;
  benchmarkStats: {
    passed: number;
    failed: number;
    total: number;
    averageLatency: number;
  } | null;
  benchmarkCases: BenchmarkCase[];
  triggerBenchmark: () => Promise<void>;
}

export function BenchmarkTab({
  darkMode,
  benchmarkRunning,
  benchmarkStats,
  benchmarkCases,
  triggerBenchmark
}: BenchmarkTabProps) {
  return (
    <div className="space-y-8">
      
      {/* Header Description Dashboard */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="space-y-2">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-405 px-3 py-0.5 rounded uppercase font-bold">대규모 병렬 회귀 테스트 엔진</span>
          <h3 className="text-2xl font-black tracking-tight">1,000-Case 회귀성 검정 대시보드 (Split Reporting)</h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            멀티어댑터 무결성 보증을 시험합니다. 본사 규정집에 탑재된 대규모 독립 광고안 시안을 다스레드 병렬 실행 스레드로 호출해 분석하고 개별 보고서 분할 가습구조를 생성합니다.
          </p>
        </div>

        <button
          id="run_benchmark_btn"
          onClick={triggerBenchmark}
          disabled={benchmarkRunning}
          className="py-3 px-6 rounded-xl bg-indigo-600 text-slate-100 font-bold hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 self-stretch md:self-auto text-center justify-center text-xs"
        >
          {benchmarkRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>배치 병렬 스레드 가동중...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-100" />
              <span>1,000-Case 회귀 심사 개시</span>
            </>
          )}
        </button>
      </div>

      {/* Quick stats grid scoreboard */}
      {benchmarkStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
            <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">합격 성공률 (Passing Rate)</span>
            <span className="text-2xl font-black text-emerald-400">{Math.round((benchmarkStats.passed / benchmarkStats.total) * 100)}%</span>
            <span className="block text-[9px] text-slate-500 mt-1">감점 80점 이상 기준</span>
          </div>
          <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
            <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">합격 건수 (Passed)</span>
            <span className="text-2xl font-black text-slate-205">{benchmarkStats.passed} / {benchmarkStats.total}</span>
            <span className="block text-[9px] text-slate-500 mt-1">위반 배제 무결 복수</span>
          </div>
          <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
            <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">반려 벌점 건수 (Rejected)</span>
            <span className="text-2xl font-black text-rose-400">{benchmarkStats.failed}</span>
            <span className="block text-[9px] text-slate-500 mt-1">벌점누적 강제 제한 건</span>
          </div>
          <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
            <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">평균 분석 지연속도 (Latency)</span>
            <span className="text-2xl font-black text-indigo-400">{benchmarkStats.averageLatency} ms</span>
            <span className="block text-[9px] text-slate-500 mt-1">Multi-Threading Concurrency</span>
          </div>
        </div>
      )}

      {/* Folder Structure mapping simulation display */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950/70 border-slate-850' : 'bg-slate-100 border-slate-250'}`}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h4 className="font-extrabold text-xs">수행 로그 리포트 디렉토리 파티셔닝 구조 (물리 아카이빙)</h4>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-[11px] font-mono whitespace-pre text-slate-400 leading-relaxed overflow-x-auto">
          {`app_workspace/docs/benchmark/
├── README.md                          # 종합 통계 및 총점 대시보드 리포팅 마크다운 파일 (${benchmarkStats ? '🟢 실시간 생성 완료' : '대기'})
├── test_runs.json                     # 정량 평가 데이터 통합 원본 파일 (${benchmarkStats ? '🟢 실시간 연동 완료' : '대기'})
└── cases/                             # 개별 시안 테스트 케이스 상세 결과 분기 적재
    ├── case_0001.md                   # ${benchmarkCases[0]?.status === 'success' ? '🟢 생성완료 (건강식품)' : '대기'}
    ├── case_0002.md                   # ${benchmarkCases[1]?.status === 'success' ? '🟢 생성완료 (코스메틱)' : '대기'}
    ├── case_0003.md                   # ${benchmarkCases[2]?.status === 'success' ? '🟢 생성완료 (유기농 토마토)' : '대기'}
    ...
    └── case_0010.md                   # ${benchmarkCases[9]?.status === 'success' ? '🟢 생성완료 (일상의 부드러운 수분)' : '대기'}`}
        </div>
      </div>

      {/* Benchmark ledger list cases with performance limits */}
      <div className={`p-4 rounded-xl border text-xs leading-relaxed ${darkMode ? 'bg-indigo-950/10 border-indigo-900/30 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-850'}`}>
        💡 **성능 최적화 명세**: 1,000개 전수 심의 판정 결과는 백엔드 파일 시스템(`docs/benchmark/test_runs.json` 및 종합 벤치마크 브리핑 리포트)에 무손실 물리 저장되며, 본 대시보드 리스트에는 원활한 렌더링 성능 유지를 위하여 상위 **50개 대표 케이스**의 실시간 판정 결과가 시각화 적재됩니다.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benchmarkCases.slice(0, 50).map((bc) => (
          <div key={bc.id} className={`p-5 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono bg-slate-800 text-slate-405 px-2 py-0.5 rounded">{bc.id}</span>
                <div className="flex items-center gap-1.5">
                  {bc.status === 'pending' && <span className="text-[10px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded">분석 대기</span>}
                  {bc.status === 'running' && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded animate-pulse">심사 엔진 가동</span>}
                  {bc.status === 'success' && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${bc.result && bc.result.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {bc.result && bc.result.score >= 80 ? '🟢 합격' : '🔴 반려'}
                    </span>
                  )}
                </div>
              </div>

              <h4 className="font-extrabold text-xs text-slate-200 mb-1">{bc.name}</h4>
              <p className="text-[11px] text-slate-400 italic line-clamp-2 leading-tight mb-4">&quot;{bc.inputText}&quot;</p>
            </div>

            {bc.result && (
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-500">
                <span>최종벌점 적용치: <strong className="text-slate-300 font-extrabold">{bc.result.score}점</strong></span>
                <span>위반 건수: <strong className="text-rose-400 font-black">{bc.result.violationsCount}건</strong></span>
                <span>지연속도: <strong className="text-indigo-400">{bc.result.timeMs}ms</strong></span>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
