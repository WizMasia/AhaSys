/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  RefreshCw, 
  Play, 
  FileText,
  Download
} from 'lucide-react';
import { BenchmarkCase } from '../types';
import { useApp } from '../contexts/AppContext';

interface BenchmarkTabProps {
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
  benchmarkRunning,
  benchmarkStats,
  benchmarkCases,
  triggerBenchmark
}: BenchmarkTabProps) {
  const { darkMode } = useApp();

  const handleDownloadDataset = () => {
    window.open('/api/benchmark/download', '_blank');
  };

  return (
    <div className="space-y-8">
      
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="space-y-2">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-3 py-0.5 rounded uppercase font-bold">대규모 병렬 회귀 테스트 엔진</span>
          <h3 className="text-2xl font-black tracking-tight">무작위 샘플링 벤치마크 검정 대시보드</h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            20,000건의 메가스케일 준법 심의 시안 데이터셋으로부터 회귀 안정성 보증을 시험합니다. 벤치마크 개시 시 무작위로 100건의 심사 대상을 발췌하여 다중 스레드 병렬 검정을 시뮬레이션 수행합니다.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto self-stretch md:self-auto">
          <button
            type="button"
            onClick={handleDownloadDataset}
            className={`py-3 px-5 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs ${
              darkMode 
                ? 'border-slate-800 bg-slate-900/60 text-slate-350 hover:bg-slate-800 hover:text-slate-100' 
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>20,000건 테스트 팩 (JSON)</span>
          </button>

          <button
            id="run_benchmark_btn"
            onClick={triggerBenchmark}
            disabled={benchmarkRunning}
            className="py-3 px-6 rounded-xl bg-indigo-600 text-slate-100 font-bold hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 text-center justify-center text-xs"
          >
            {benchmarkRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>무작위 100건 검정 중...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-100" />
                <span>RNG 100건 샘플링 검정 개시</span>
              </>
            )}
          </button>
        </div>
      </div>

      {benchmarkStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
            <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1 font-black">종합 패스율 (Compliance Grade)</span>
            <span className="text-2xl font-black text-emerald-400">{Math.round((benchmarkStats.passed / benchmarkStats.total) * 100)}%</span>
            <span className="block text-[9px] text-slate-500 mt-1">감점 80점 이상 기준</span>
          </div>
          <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
            <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">합격 건수 (Passed)</span>
            <span className="text-2xl font-black text-slate-200">{benchmarkStats.passed} / {benchmarkStats.total}</span>
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
    ├── case_xxxx.md                   # ${benchmarkStats ? '🟢 100건 샘플 생성완료' : '대기'}
    └── ...`}
        </div>
      </div>

    </div>
  );
}
