import fs from 'fs';
import path from 'path';
import { BENCHMARK_CASES } from './benchmarkCases';
import { retrieveGuidelines } from './rag';
import type { LawArticle } from '../db/regulatoryLibrary';
import type { GeneratedBenchmarkCase } from './benchmarkCases';

export interface BenchmarkViolation {
  readonly id: string;
  readonly clause: string;
  readonly severity: "High" | "Medium" | "Low";
  readonly description: string;
  readonly deductionPoints: number;
  readonly originalFragment: string;
  readonly replacement: string;
}

export interface BenchmarkCaseReport {
  readonly id: string;
  readonly name: string;
  readonly inputText: string;
  readonly score: number;
  readonly violationsCount: number;
  readonly violations: readonly BenchmarkViolation[];
  readonly status: "success";
  readonly timeMs: number;
  readonly isPass: boolean;
}

interface BenchmarkStats {
  readonly passed: number;
  readonly failed: number;
}

interface BenchmarkRunOptions {
  readonly casesDir: string;
  readonly summaryFilePath: string;
  readonly readmeFilePath: string;
}

export interface BenchmarkRunResult {
  readonly success: true;
  readonly passed: number;
  readonly failed: number;
  readonly total: number;
  readonly reportLink: string;
  readonly testRuns: readonly BenchmarkCaseReport[];
}

export const pickRandomBenchmarkCases = (limit: number): GeneratedBenchmarkCase[] => {
  const total = BENCHMARK_CASES.length;
  const indices = new Set<number>();

  while (indices.size < limit && indices.size < total) {
    const idx = Math.floor(Math.random() * total);
    indices.add(idx);
  }

  return Array.from(indices)
    .map((idx) => BENCHMARK_CASES[idx])
    .filter((item): item is GeneratedBenchmarkCase => Boolean(item));
};

const getBenchmarkPenalty = (articleTier: number): { readonly deduction: number; readonly severity: "High" | "Medium" | "Low" } => {
  if (articleTier === 4) {
    return { deduction: 50, severity: "High" };
  }

  if (articleTier === 1) {
    return { deduction: 15, severity: "High" };
  }

  return { deduction: 10, severity: "Medium" };
};

const buildBenchmarkViolation = (benchmarkCase: GeneratedBenchmarkCase, article: LawArticle, index: number): BenchmarkViolation => {
  const matchedKw = article.keywords.find((kw) => benchmarkCase.inputText.toLowerCase().includes(kw.toLowerCase())) || "의심 구절";
  const penalty = getBenchmarkPenalty(article.tier);

  return {
    id: `v_b_${benchmarkCase.id}_${index + 1}`,
    clause: article.clause,
    severity: penalty.severity,
    description: `${article.domain} 기준 저촉 의심 관측 (${matchedKw})`,
    deductionPoints: penalty.deduction,
    originalFragment: matchedKw,
    replacement: "준법 권장 표현으로 대체"
  };
};

const buildBenchmarkCaseReport = (benchmarkCase: GeneratedBenchmarkCase): BenchmarkCaseReport => {
  const caseStartTime = Date.now();
  const retrieved = retrieveGuidelines(benchmarkCase.inputText);
  const violations = retrieved.map((r, index) => buildBenchmarkViolation(benchmarkCase, r.article, index));
  const totalDeductions = violations.reduce((sum, violation) => sum + violation.deductionPoints, 0);
  const calculatedScore = Math.max(0, 100 - totalDeductions);
  const isPass = calculatedScore >= 80;
  const duration = Date.now() - caseStartTime;

  return {
    id: benchmarkCase.id,
    name: benchmarkCase.name,
    inputText: benchmarkCase.inputText,
    score: calculatedScore,
    violationsCount: violations.length,
    violations,
    status: "success",
    timeMs: duration,
    isPass
  };
};

const buildBenchmarkCaseMarkdown = (benchmarkCase: GeneratedBenchmarkCase, report: BenchmarkCaseReport): string => `# Benchmark Report for [${benchmarkCase.id}] - ${benchmarkCase.name}
- **Date/Time**: ${new Date().toISOString()}
- **Scoring Status**: ${report.score} / 100 (${report.isPass ? 'PASS' : 'FAIL - REJECTED'})
- **Analysis Execution Time**: ${report.timeMs} ms
- **Detected Violations**: ${report.violations.length}

## Direct Input Advertisement:
> ${benchmarkCase.inputText}

## Core Compliance Violations:
${report.violations.length === 0 ? "No compliance rules violated. Pristine Ad copy!" : 
report.violations.map((violation, index) => `### ${index + 1}. [${violation.severity}] Clause: ${violation.clause} (Deduction: -${violation.deductionPoints} pts)
- **Problematic Fragment**: "${violation.originalFragment}"
- **Deduction Reason**: ${violation.description}
- **Clean Safe Alternative replacement**: "${violation.replacement}"`).join('\n\n')}

---
*AnSimSim Compliance Automated Suite Engine (v1.0.0)*`;

const calculateBenchmarkStats = (testRuns: readonly BenchmarkCaseReport[]): BenchmarkStats => (
  testRuns.reduce<BenchmarkStats>((stats, testRun) => (
    testRun.isPass
      ? { passed: stats.passed + 1, failed: stats.failed }
      : { passed: stats.passed, failed: stats.failed + 1 }
  ), { passed: 0, failed: 0 })
);

const buildBenchmarkReadme = (selectedCases: readonly GeneratedBenchmarkCase[], testRuns: readonly BenchmarkCaseReport[], stats: BenchmarkStats): string => {
  const passRate = selectedCases.length === 0 ? 0 : Math.round((stats.passed / selectedCases.length) * 100);

  return `# AnSimSim Automated Multi-Case Compliance Benchmark Suite
## Executive Quantitative Summary
- **Total Executed cases**: ${selectedCases.length}
- **Compliance Passing Rate**: ${passRate}%
- **Passed Cases**: ${stats.passed}
- **Rejected Warnings (Deducted < 80)**: ${stats.failed}
- **Benchmarking Platform Run Timestamp**: ${new Date().toISOString()}

### Case Ledger Scorecard (Top 50 Display):
| Case ID | Core Title | Score | Integrity Status | Analysis Time |
|---|---|---|---|---|
|---|---|---|---|---|
${testRuns.slice(0, 50).map((tr) => `| ${tr.id} | ${tr.name} | ${tr.score} | ${tr.isPass ? '🟢 PASS' : '🔴 FAIL'} | ${tr.timeMs}ms |`).join('\n')}

---
*Comprehensive split files have been partitioned and saved securely inside \`/docs/benchmark/cases/*.md\` for strict compliance filing audits.*`;
};

export const runBenchmarkSuite = (options: BenchmarkRunOptions): BenchmarkRunResult => {
  if (!fs.existsSync(options.casesDir)) {
    fs.mkdirSync(options.casesDir, { recursive: true });
  }

  const selectedCases = pickRandomBenchmarkCases(100);
  const testRuns = selectedCases.map((benchmarkCase, index) => {
    const caseReport = buildBenchmarkCaseReport(benchmarkCase);

    if (index < 30) {
      fs.writeFileSync(path.join(options.casesDir, `${benchmarkCase.id}.md`), buildBenchmarkCaseMarkdown(benchmarkCase, caseReport));
    }

    return caseReport;
  });
  const stats = calculateBenchmarkStats(testRuns);

  fs.writeFileSync(options.summaryFilePath, JSON.stringify(testRuns, null, 2));
  fs.writeFileSync(options.readmeFilePath, buildBenchmarkReadme(selectedCases, testRuns, stats));

  return {
    success: true,
    passed: stats.passed,
    failed: stats.failed,
    total: selectedCases.length,
    reportLink: "/docs/benchmark/README.md",
    testRuns
  };
};
