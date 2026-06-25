import type { SystemAnalysisResult } from '../types';

export const SCORE_THRESHOLD_EXCELLENT = 95;
export const SCORE_THRESHOLD_GOOD = 80;
export const SCORE_THRESHOLD_NORMAL = 60;
export const SCORE_THRESHOLD_WARNING = 40;

export interface GradeInfo {
  readonly grade: number;
  readonly label: string;
  readonly isPassed: boolean;
  readonly color: string;
  readonly hasWarning: boolean;
  readonly desc: string;
}

export const getCsatGradeInfo = (score: number): GradeInfo => {
  if (score >= SCORE_THRESHOLD_EXCELLENT) {
    return {
      grade: 1,
      label: "🥇 1등급 (최우수)",
      isPassed: true,
      color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-450 dark:text-emerald-400",
      hasWarning: false,
      desc: "대한민국 광고 위법 자율성 최상위 등급입니다. 특정한 가처분이나 과장 표현 위반 조사 지점이 발견되지 않았습니다."
    };
  }
  if (score >= SCORE_THRESHOLD_GOOD) {
    return {
      grade: 2,
      label: "🥈 2등급 (우수 - 조건부 승인)",
      isPassed: true,
      color: "bg-teal-500/10 border-teal-500/30 text-teal-450 dark:text-teal-400",
      hasWarning: false,
      desc: "일부 조항 대조 시 경미한 위반 가능 영역이나 근거 자료 출처 증명서 배포가 보류 권장되는 지점이 검출되었으나, 준법 권장사항을 수용 조율할 시 충분히 안전하게 통과 가능합니다."
    };
  }
  if (score >= SCORE_THRESHOLD_NORMAL) {
    return {
      grade: 3,
      label: "🥉 3등급 (보통 - 전면 재검토 요망)",
      isPassed: false,
      color: "bg-amber-500/10 border-amber-500/30 text-amber-450 dark:text-amber-400",
      hasWarning: true,
      desc: "허위 기만광고의 소지가 있어 공정거래법 저촉 위험이 현저히 농후합니다. 벌점 감쇄에 따른 법정 분쟁 및 행정 처분 가능성이 존재하므로, 즉시 안전한 교정 대안안으로 전면 순화하여 배포하십시오."
    };
  }
  if (score >= SCORE_THRESHOLD_WARNING) {
    return {
      grade: 4,
      label: "⚠️ 4등급 (경고 - 제재 위험군)",
      isPassed: false,
      color: "bg-orange-500/10 border-orange-500/30 text-orange-450 dark:text-orange-400",
      hasWarning: true,
      desc: "소비자 오인 야기 소지가 극히 다분한 다수의 특별법 저촉이 탐색되었습니다. 관계 당국의 직권 조사와 정정 광고 게재 명령이 촉발될 수 있는 수준이오니 사안을 즉각 폐기하고 리디렉션하십시오."
    };
  }
  return {
    grade: 5,
    label: "🚨 5등급 (위험 - 즉각 수정 의무)",
    isPassed: false,
    color: "bg-rose-500/10 border-rose-500/30 text-rose-450 dark:text-rose-400",
    hasWarning: true,
    desc: "참사/비극 오용 및 특별법 규정 위배가 극심하여 행정 고발 및 형사 제재 사유에 해당할 소지가 100% 농후합니다. 대외 유포를 당장 전면 중지하십시오."
  };
};

export const getScoreColor = (score: number): string => {
  if (score >= SCORE_THRESHOLD_EXCELLENT) return 'border-emerald-500 text-emerald-400';
  if (score >= SCORE_THRESHOLD_GOOD) return 'border-teal-500 text-teal-400';
  if (score >= SCORE_THRESHOLD_NORMAL) return 'border-amber-500 text-amber-400';
  if (score >= SCORE_THRESHOLD_WARNING) return 'border-orange-500 text-orange-400';
  return 'border-rose-500 text-rose-450 dark:text-rose-400';
};

export const getSeverityBadge = (severity: 'High' | 'Medium' | 'Low'): string => {
  if (severity === 'High') return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
  if (severity === 'Medium') return 'bg-orange-500/10 text-orange-405 border border-orange-500/30';
  return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
};

export const makeLawGoLink = (clause: string): string => {
  const match = clause.match(/^([가-힣\s]+법)/);
  const lawName = match ? match[1].replace(/\s+/g, "") : "표시광고의공정화에관한법률";

  return `https://www.law.go.kr/법령/${encodeURIComponent(lawName)}`;
};

const buildViolationReportSection = (analysisResult: SystemAnalysisResult): string => {
  if (analysisResult.violations.length === 0) {
    return `## 3. 세부 위법 제재 조항 검출 및 감점 내역 (0건)
> ✔ **축하합니다! 위반 검출 사안이 없어 100% 무해성으로 통과 승인되었습니다.**`;
  }

  const violationBlocks = analysisResult.violations.map((violation, index) => `### [위반 ${index + 1}] ${violation.clause}
* **감점**: **-${violation.deductionPoints}점** | **위험도**: \`${violation.severity}\`
* **위법 위험 소견**: ${violation.description}
* **문제 발견 원안 구절**: \`"${violation.originalFragment}"\`
* **법적 무해 정정 대안안**: **\`"${violation.replacement}"\`**`);

  return [
    `## 3. 세부 위법 제재 조항 검출 및 감점 내역 (${analysisResult.violations.length}건)`,
    ...violationBlocks
  ].join('\n');
};

const buildImageReportSection = (analysisResult: SystemAnalysisResult): string => {
  if (!analysisResult.imageAlternativeProposal) {
    return "";
  }

  const proposal = analysisResult.imageAlternativeProposal;

  return `## 4. 이미지 비주얼 멀티모달 Vision 정밀 교정 보고
* **Detected Visual Copys (OCR 검출 텍스트)**: ${proposal.detectedVisualCopys?.join(', ') || '없음'}
* **Visual Violations (시각적 리스크 소견)**: ${proposal.visualViolations?.join(' / ') || '없음'}

### 🎨 이미지 우회 대안 처방 시안 가이드라인
> ${proposal.alternativeVisualDraft}`;
};

const buildOcrFallbackReportSection = (analysisResult: SystemAnalysisResult): string => {
  if (!analysisResult.ocrFallbackUsed) {
    return "";
  }

  const extractedTextBlock = analysisResult.ocrExtractedText
    ? `\n\n### OCR 추출 문구\n\`\`\`text\n${analysisResult.ocrExtractedText}\n\`\`\``
    : "";

  return `## OCR 텍스트 기반 이미지 검토 전환 안내
* **처리 방식**: 멀티모달 미지원 모델로 확인되어 이미지 직접 분석 대신 OCR 추출 문구만 심사에 반영했습니다.
* **상세 안내**: ${analysisResult.ocrNotice || 'OCR 폴백이 사용되었습니다.'}${extractedTextBlock}`;
};

export const buildMarkdownReport = (analysisResult: SystemAnalysisResult | null, fallbackModelName: string): string => {
  if (!analysisResult) return "";

  const gradeInfo = getCsatGradeInfo(analysisResult.score);
  const agentsActivatedLine = analysisResult.agentsActivated && analysisResult.agentsActivated.length > 0
    ? `* **참여 심의 서브 에이전트**: ${analysisResult.agentsActivated.map((agent) => `\`${agent}\``).join(', ')}`
    : "";
  const reportSections = [
    `# 🛡️ 광고 법률 자율 무결성 종합 준법 자문보고서`,
    `## 1. 종합 심의 판정 요약
* **종합 안전 벌점**: **${analysisResult.score}점** / 100점 만점
* **최종 준법 성적**: **${gradeInfo.label}** (${gradeInfo.isPassed ? "합격 - 통과 대상" : "기각 - 반려 대상"})
* **기저 인프라 엔진**: \`${analysisResult.modelUsed || fallbackModelName || 'Gemini'}\`

> 💡 **심의 요지**: ${gradeInfo.desc}`,
    `## 2. 심의 검수 대상 원안 메타 정보
* **추론 제품 분류군**: \`${analysisResult.parsedMeta.productType}\`
* **조사 특별 법령 영역**: \`${analysisResult.parsedMeta.regulatoryDomain}\`
* **유통 예정 마케팅 매체**: \`${analysisResult.parsedMeta.channels}\`
* **주요 타겟 세그먼트**: \`${analysisResult.parsedMeta.targets}\`
${agentsActivatedLine}`,
    buildViolationReportSection(analysisResult),
    buildOcrFallbackReportSection(analysisResult),
    buildImageReportSection(analysisResult),
    `---
*본 보고서의 유권 해석 최종 권리는 규제 당국의 심사위원에 귀속되므로 법률 자문 대조용으로 활용해 주십시오.*`
  ].filter((section) => section.trim().length > 0);

  return reportSections.join('\n\n');
};
