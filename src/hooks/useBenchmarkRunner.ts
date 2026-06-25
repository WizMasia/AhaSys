import { useState } from 'react';
import type { BenchmarkCase } from '../types';
import { apiClient } from '../services/api';

export interface BenchmarkStats {
  readonly passed: number;
  readonly failed: number;
  readonly total: number;
  readonly averageLatency: number;
}

interface UseBenchmarkRunnerParams {
  readonly adapterType: string;
  readonly customModel: string;
  readonly setBenchmarkCases: (cases: BenchmarkCase[] | ((prev: BenchmarkCase[]) => BenchmarkCase[])) => void;
  readonly setErrorText: (message: string | null) => void;
}

export const useBenchmarkRunner = ({
  adapterType,
  customModel,
  setBenchmarkCases,
  setErrorText,
}: UseBenchmarkRunnerParams) => {
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  const [benchmarkStatusMsg, setBenchmarkStatusMsg] = useState("");
  const [benchmarkStats, setBenchmarkStats] = useState<BenchmarkStats | null>(null);

  const triggerBenchmark = async (): Promise<void> => {
    setBenchmarkRunning(true);
    setBenchmarkProgress(0);
    setBenchmarkStatusMsg("벤치마크 엔진 기동 중...");
    setBenchmarkCases((prev) => prev.map((item) => ({ ...item, status: 'running' })));

    const progressInterval = setInterval(() => {
      setBenchmarkProgress((prev) => {
        if (prev >= 98) return prev;
        const remains = 100 - prev;
        const step = Math.max(1, Math.round(remains * 0.15));
        const next = Math.min(98, prev + step);
        if (next < 25) {
          setBenchmarkStatusMsg("1단계: 무작위 100건 심의 대상 케이스 샘플 추출 중...");
        } else if (next < 55) {
          setBenchmarkStatusMsg("2단계: 다중 스레드 병렬 자율 법률 매핑 시뮬레이션 가동 중...");
        } else if (next < 80) {
          setBenchmarkStatusMsg("3단계: 준법 위반 조항 연계 판정 및 감점 가중치 연산 중...");
        } else {
          setBenchmarkStatusMsg("4단계: 물리 보고서 마크다운 디렉토리 파티셔닝 적재 중...");
        }
        return next;
      });
    }, 150);

    try {
      const data = await apiClient.runBenchmark();
      clearInterval(progressInterval);
      setBenchmarkProgress(100);
      setBenchmarkStatusMsg("벤치마크 검정 완료!");

      const runCases: BenchmarkCase[] = data.testRuns.map((run) => {
        const status: BenchmarkCase['status'] = run.isPass ? 'success' : 'failed';
        return {
          id: run.id,
          name: run.name,
          inputText: run.inputText,
          expectedViolations: run.violationsCount,
          status,
          result: {
            score: run.score,
            violationsCount: run.violationsCount,
            meta: { productType: "자동 추론", targets: "혼합 세그먼트", regulatoryDomain: "계통 특별법", channels: "옴니채널" },
            timeMs: run.timeMs,
            adapterUsed: `${adapterType} (${customModel})`,
          },
        };
      });
      setBenchmarkCases(runCases);
      setBenchmarkStats({
        passed: data.passed,
        failed: data.failed,
        total: data.total,
        averageLatency: Math.round(data.testRuns.reduce((acc, run) => acc + run.timeMs, 0) / data.total),
      });
    } catch {
      clearInterval(progressInterval);
      setBenchmarkProgress(0);
      setBenchmarkStatusMsg("벤치마크 수행 실패");
      setErrorText("벤치마크 배치 오케스트레이션 수행 결과 디렉토리 파티셔닝 중 장애가 발생했습니다.");
    } finally {
      setBenchmarkRunning(false);
    }
  };

  return {
    benchmarkRunning,
    benchmarkProgress,
    benchmarkStatusMsg,
    benchmarkStats,
    triggerBenchmark,
  };
};

