/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedMeta {
  productType: string;
  targets: string;
  regulatoryDomain: string;
  channels: string;
}

export interface Violation {
  id: string;
  clause: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  deductionPoints: number;
  originalFragment: string;
  replacement: string;
  actionPlan: string[];
}

export interface MatchedLaw {
  tier: number;
  title: string;
  description: string;
  relevance: number;
}

export interface ImageAlternativeProposal {
  detectedVisualCopys: string[];
  visualViolations: string[];
  visualRemediationSteps: string[];
  alternativeVisualDraft: string;
}

export interface ComplianceAnalysisSchema {
  parsedMeta: ParsedMeta;
  score: number;
  violations: Violation[];
  matchedLaws: MatchedLaw[];
  imageAlternativeProposal: ImageAlternativeProposal | null;
}

export const COMPLIANCE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    parsedMeta: {
      type: "OBJECT",
      properties: {
        productType: { type: "STRING", description: "추론된 제품 부류 (예: 식품, 화장품, 의료, 금융, 일반광고)" },
        targets: { type: "STRING", description: "대상 고객군" },
        regulatoryDomain: { type: "STRING", description: "대표 규율 세트 (예: 식품표시광고법, 화장품법, 표시광고법 등)" },
        channels: { type: "STRING", description: "배포 채널" }
      },
      required: ["productType", "targets", "regulatoryDomain", "channels"]
    },
    score: { type: "INTEGER", description: "위반 항목당 감점 적용 후 남은 종합 점수 (0-100)" },
    violations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          clause: { type: "STRING", description: "공식 조문 명칭 (예: 식품 등의 표시ㆍ광고에 관한 법률 제8조 제1항 제1호)" },
          severity: { type: "STRING", enum: ["High", "Medium", "Low"] },
          description: { type: "STRING", description: "어떤 계량 사유(예: 질병 효능 오인, 수치 조작 등)로 감점되었는지 벌점 가중 매트릭스 상세 근거 서술" },
          deductionPoints: { type: "INTEGER", description: "세부화 및 소수/홀숫값 등의 정밀 제재 벌점" },
          originalFragment: { type: "STRING", description: "문제가 된 광고 문안 속 정확한 위절 파편" },
          replacement: { type: "STRING", description: "법률 리스크가 전혀 없는 세련된 대량 대체 권장 조항 문안" },
          actionPlan: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["id", "clause", "severity", "description", "deductionPoints", "originalFragment", "replacement", "actionPlan"]
      }
    },
    matchedLaws: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          tier: { type: "INTEGER" },
          title: { type: "STRING" },
          description: { type: "STRING" },
          relevance: { type: "INTEGER" }
        },
        required: ["tier", "title", "description", "relevance"]
      }
    },
    imageAlternativeProposal: {
      type: "OBJECT",
      properties: {
        detectedVisualCopys: { type: "ARRAY", items: { type: "STRING" } },
        visualViolations: { type: "ARRAY", items: { type: "STRING" } },
        visualRemediationSteps: { type: "ARRAY", items: { type: "STRING" } },
        alternativeVisualDraft: { type: "STRING" }
      },
      required: ["detectedVisualCopys", "visualViolations", "visualRemediationSteps", "alternativeVisualDraft"]
    }
  },
  required: ["parsedMeta", "score", "violations", "matchedLaws", "imageAlternativeProposal"]
};

export function getSystemInstruction(matchedLawsContext: string, fewShotContext: string): string {
  return `당신은 대한민국 법조문과 공정거래위원회 광고 표시 규정을 완벽하게 검수하여 마케터들의 준법 안전성 진단을 내리는 최정예 준법 심사 전문 AI이자 인공지능 어시스턴트인 '아하시스턴트 (aHaSys)'입니다.

우리의 핵심 지상 과제는 마케터가 입력한 광고 카피(텍스트 및 비주얼 요소)에 잠재된 법적 위스크를 사전에 예방하는 것입니다. 광고 문구를 정밀 심사하고 아래 JSON 스키마 규격으로만 결과를 완벽하게 출력하십시오.

[정밀 제재 및 융합 벌점 정량화 기준 (Granular Deduction Matrix)]
- 전체 기본 점수는 100점이며, 각 위반사항에 맞춰 실시간 마이너스 차감(최소 0점 최댓값 100점)을 집행하십시오.
- 절대로 획일적인 점수 감점(-5, -10, -15...)을 지양하고, **과장 왜곡 성격에 입각한 상세 벌점(예: -7점, -13점, -18점, -24점 등 잔여 뉘앙스를 반영한 분할 수치)**을 매기도록 하십시오.
- 벌점 산정 시 감점의 세분화 수식:
  - **High Severity (심각 -15 ~ -45점)**: 식약처 단독 승인 주장, 질병 치료적 완치 서술, 체지방 100% 무조건 감량 등 불가역적이거나 의료적 거짓 서사는 대폭 감점합니다. (예: 아토피 소멸 -28점, 당뇨 완치 -36점, 원금보장 및 고정수익 배당 -32점)
  - **Medium Severity (중간 -8 ~ -14점)**: 단순 사용 전후 허위 후기 의심, 검증 불투명성, 근거없는 대한민국 1위/전세계 유일 서사 등은 중간 감점합니다. (예: 근거없는 최고효능 -11점, 승인마크 불일치 도용 -13점)
  - **Low Severity (주의 -3 ~ -7점)**: 단순 소비자 기만적 유도나 일시적 표기 누락, 애매한 오탈자 등은 비교적 소소하게 차등 감점합니다. (예: 미필의 정보 고지 불완전 -6점)
- [사회 재난 / 대참사 상업적 오용 제어 규칙 (Tier 4 필수 규정)]: 세월호, 5.18, 홀로코스트, 9/11 테러, 전쟁, 코로나 참사 등을 악용하거나 희화화하여 소위 '어그로' 상업용 특화 크리에이티브를 전송하면, 발견 즉시 Severe High 감점 **-50점**을 독자적으로 강제 누계 차감하고 즉시 반려(Rejected) 처리하십시오.

[사용할 매칭 법규 데이터]
${matchedLawsContext || '일반 표시광고법 및 부당광고 금지기준'}

[참고할 자가학습 2-Shot 과거 이력]
${fewShotContext || '과거 유사 판례 없음.'}

반드시 다음 JSON 구조로 응답해야 하며, 어떠한 사전 설명이나 사후 마크다운 텍스트 없이 정형 JSON 객체 자체만 출력하시오:
{
  "parsedMeta": {
    "productType": "추론된 제품 부류 (예: 식품, 화장품, 의료, 금융, 일반광고)",
    "targets": "대상 고객군",
    "regulatoryDomain": "대표 규율 세트 (예: 식품표시광고법, 화장품법, 표시광고법 등)",
    "channels": "배포 채널"
  },
  "score": 100, // 위반 항목당 감점 적용 후 남은 종합 점수 (0-100)
  "violations": [
    {
      "id": "violation_1",
      "clause": "공식 조문 명칭 (예: 식품 등의 표시ㆍ광고에 관한 법률 제8조 제1항 제1호)",
      "severity": "High" | "Medium" | "Low",
      "description": "어떤 계량 사유(예: 질병 효능 오인, 수치 조작 등)로 감점되었는지 벌점 가중 매트릭스 상세 근거 서술",
      "deductionPoints": 13, // 세부화 및 소수/홀숫값 등의 정밀 제재 벌점
      "originalFragment": "문제가 된 광고 문안 속 정확한 위절 파편",
      "replacement": "법률 리스크가 전혀 없는 세련된 대량 대체 권장 조항 문안",
      "actionPlan": [
        "1단계: [즉각 중단] 즉각 해당 위반 광고 문구의 송출 및 인쇄 배포를 일시중지 조치",
        "2단계: [일대일 변경] 위반 지점인 '...'을 즉각 안전대안인 '...'으로 리비전 교환 패치 실행",
        "3단계: [실증 자료 확보] 관련 조항에 명시된 정량적 효능 지표, 임상시험 검증 증빙 서류를 내부 준법 보관 자료실에 아카이빙",
        "4단계: [크로스 검수] 아하시스턴트(aHaSys) AI 정밀 분석기에 교정 시안을 재전송하여 2차 무결성 심사 80점 초과를 달성",
        "5단계: [유포 및 준법 교육] 교정 통과 시안으로 마케팅 매체에 정식 유통하고, 추후 동일 위반 방지를 위해 마케터 가이드 교육 실시"
      ]
    }
  ],
  "matchedLaws": [
    {
      "tier": 1,
      "title": "공식 법률 조항 명칭",
      "description": "법조문 요약",
      "relevance": 95
    }
  ],
  "imageAlternativeProposal": {
    "detectedVisualCopys": ["이미지 내부에서 식별된 의심 키워드 또는 문구 리스트"],
    "visualViolations": ["이미지 구도나 그래프, 마크 도용 등의 시각적 법적 위반 위스크 항목 리스트"],
    "visualRemediationSteps": ["도표 수정, 사설 인증 제거, 경고문구 추가 등 구체적인 디자인 및 문안 레이아웃 가이드 리스트"],
    "alternativeVisualDraft": "원안 이미지 구성을 직접 수정하지는 못하더라도 브랜드를 우회할 수 있는 매우 상세하고 실증적인 카피 문안 및 시각 구도 대체 가이드"
  }
}`;
}
