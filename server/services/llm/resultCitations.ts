import { REGULATORY_LIBRARY } from '../../db/regulatoryLibrary';
import { isRecord } from './responseParsing';
import { generateDefaultActionPlan } from './resultDefaults';

interface RetrievedGuideline {
  readonly article: {
    readonly tier: number;
    readonly clause: string;
    readonly text: string;
  };
  readonly score: number;
}

const readString = (value: unknown): string => (
  typeof value === 'string' ? value : ''
);

const readNumber = (value: unknown): number => (
  typeof value === 'number' ? value : 0
);

const normalizeViolation = (violation: unknown, index: number): Record<string, unknown> => {
  const source = isRecord(violation) ? violation : {};
  const clauseNorm = readString(source.clause).replace(/\s+/g, "").toLowerCase();
  const matchingLaw = REGULATORY_LIBRARY.find((law) => {
    const lawClauseNorm = law.clause.replace(/\s+/g, "").toLowerCase();
    const lawDomainNorm = law.domain.replace(/\s+/g, "").toLowerCase();

    return clauseNorm.includes(lawClauseNorm) ||
      lawClauseNorm.includes(clauseNorm) ||
      clauseNorm.includes(lawDomainNorm);
  });
  const existingActionPlan = source.actionPlan;
  const actionPlan = Array.isArray(existingActionPlan) && existingActionPlan.length >= 5
    ? existingActionPlan
    : generateDefaultActionPlan(
      readString(source.originalFragment),
      readString(source.replacement),
      matchingLaw ? matchingLaw.domain : ''
    );

  return {
    id: readString(source.id) || `violation_${index + 1}`,
    clause: source.clause,
    severity: source.severity,
    description: source.description,
    deductionPoints: source.deductionPoints,
    originalFragment: source.originalFragment,
    replacement: source.replacement,
    isCitationVerified: Boolean(matchingLaw),
    verifiedLawDetails: matchingLaw ? {
      id: matchingLaw.id,
      clause: matchingLaw.clause,
      domain: matchingLaw.domain,
      exactText: matchingLaw.text
    } : null,
    actionPlan
  };
};

export const normalizeViolations = (parsedAgentsData: readonly Record<string, unknown>[]): Record<string, unknown>[] => (
  parsedAgentsData
    .flatMap((parsed) => Array.isArray(parsed.violations) ? parsed.violations : [])
    .map(normalizeViolation)
);

export const sumDeductions = (violations: readonly Record<string, unknown>[]): number => (
  violations.reduce((sum, violation) => sum + readNumber(violation.deductionPoints), 0)
);

export const buildMatchedLaws = (
  parsedAgentsData: readonly Record<string, unknown>[],
  retrieved: readonly RetrievedGuideline[]
): unknown[] => {
  const matchedLaws: unknown[] = [];
  const seenLaws = new Set<string>();
  parsedAgentsData.forEach((parsed) => {
    if (!Array.isArray(parsed.matchedLaws)) return;
    parsed.matchedLaws.forEach((law) => {
      if (!isRecord(law)) return;
      const key = `${readString(law.title)}-${readNumber(law.tier)}`;
      if (!seenLaws.has(key)) {
        seenLaws.add(key);
        matchedLaws.push(law);
      }
    });
  });

  if (matchedLaws.length > 0) {
    return matchedLaws;
  }

  return retrieved.map((item) => ({
    tier: item.article.tier,
    title: item.article.clause,
    description: item.article.text,
    relevance: item.score
  }));
};
