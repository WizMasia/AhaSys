/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

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
    },
    modelUsed: { type: "STRING", description: "분석에 사용된 실제 LLM 모델명" }
  },
  required: ["parsedMeta", "score", "violations", "matchedLaws", "imageAlternativeProposal", "modelUsed"]
};

let instructionsCache: Record<string, string> | null = null;

function loadInstructions(): Record<string, string> {
  if (instructionsCache) return instructionsCache;

  const cache: Record<string, string> = {};
  try {
    const filePath = path.join(process.cwd(), 'server', 'prompts', 'agent_instructions.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    const sections = content.split(/---/);

    sections.forEach(sec => {
      const match = sec.match(/\[(ORCHESTRATOR|LEGAL|SOCIAL|ESG|PRIVACY|YOUTH)\]/);
      if (match) {
        const key = match[1];
        const rawText = sec.replace(match[0], '').trim();
        cache[key] = rawText;
      }
    });

    instructionsCache = cache;
  } catch (err) {
    console.error("Failed to dynamically load agent instructions markdown file:", err);
  }

  return cache;
}

export function getOrchestratorRoutingInstruction(): string {
  return loadInstructions()["ORCHESTRATOR"] || "";
}

export function getPrivacyProtectionInstruction(): string {
  return loadInstructions()["PRIVACY"] || "";
}

export function getYouthProtectionInstruction(): string {
  return loadInstructions()["YOUTH"] || "";
}

export function getCopyrightProtectionInstruction(): string {
  return loadInstructions()["COPYRIGHT"] || "";
}

export function getSocialControversyInstruction(): string {
  return loadInstructions()["SOCIAL"] || "";
}

export function getEsgGreenwashingInstruction(): string {
  return loadInstructions()["ESG"] || "";
}

export function getLegalFinanceInstruction(): string {
  return loadInstructions()["LEGAL_FINANCE"] || "";
}

export function getLegalCommerceInstruction(): string {
  return loadInstructions()["LEGAL_COMMERCE"] || "";
}

export function getLegalNetInstruction(): string {
  return loadInstructions()["LEGAL_NET"] || "";
}

export function getSystemInstruction(matchedLawsContext: string, fewShotContext: string): string {
  const legalBase = loadInstructions()["LEGAL_PRODUCT"] || "";
  return legalBase
    .replace(/\${matchedLawsContext \|\| '일반 표시광고법 및 부당광고 금지기준'}/g, matchedLawsContext || '일반 표시광고법 및 부당광고 금지기준')
    .replace(/\${fewShotContext \|\| '과거 유사 판례 없음.'}/g, fewShotContext || '과거 유사 판례 없음.');
}
