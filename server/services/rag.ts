import { REGULATORY_LIBRARY } from '../db/regulatoryLibrary';
import { getHistoryCollection } from './historyStore';
import type { LawArticle } from '../db/regulatoryLibrary';
import type { HistItem } from './historyStore';

export const RAG_HARD_FILTER_SCORE = 80.0;

const T4_TRIGGER_KEYWORDS = ["세월호", "5.18", "5/18", "5/15", "5/20", "10/29", "10.29", "할로윈", "holocaust", "홀로코스트", "우크라이나", "9/11", "이태원", "전쟁", "테러", "난민", "단테", "탱크", "나수", "단원고", "광주"] as const;

export const calculateSimilarity = (text: string, article: LawArticle): number => {
  const normText = text.toLowerCase();
  const hits = article.keywords.filter((kw) => normText.includes(kw.toLowerCase())).length;

  if (hits === 0) return 0;

  const distance = hits === 1 ? 400 : hits === 2 ? 200 : 50;

  const score = Math.exp(-distance / 1350.0) * 100;
  return Math.round(score * 10) / 10;
};

const calculateTierOneBoostedScore = (article: LawArticle, textLower: string, baseScore: number): number => {
  const isCosmeticTrigger = ["화장품", "여드름", "피부", "주름", "아토피"].some((keyword) => textLower.includes(keyword));
  const isSupplementTrigger = ["다이어트", "체지방", "비타민", "식약처"].some((keyword) => textLower.includes(keyword));
  const isMedicalTrigger = ["수술", "치과", "병원", "치료"].some((keyword) => textLower.includes(keyword));
  const isFinanceTrigger = ["수익률", "원금", "이자", "코인", "투자"].some((keyword) => textLower.includes(keyword));

  if (article.domain === "화장품법" && isCosmeticTrigger) return Math.max(baseScore, 92.0);
  if (article.domain === "식품표시광고법" && isSupplementTrigger) return Math.max(baseScore, 94.0);
  if (article.domain === "의료법" && isMedicalTrigger) return Math.max(baseScore, 91.0);
  if (article.domain === "금융소비자보호법" && isFinanceTrigger) return Math.max(baseScore, 95.0);

  return baseScore;
};

const calculateRelevanceScore = (text: string, textLower: string, article: LawArticle, forcingHighT4: boolean): number => {
  const baseScore = forcingHighT4 && article.tier === 4
    ? 100.0
    : calculateSimilarity(text, article);

  return article.tier === 1
    ? calculateTierOneBoostedScore(article, textLower, baseScore)
    : baseScore;
};

export const retrieveGuidelines = (text: string): { article: LawArticle; score: number }[] => {
  const textLower = text.toLowerCase();
  const results: { article: LawArticle; score: number }[] = [];
  const forcingHighT4 = T4_TRIGGER_KEYWORDS.some((keyword) => textLower.includes(keyword));

  for (const article of REGULATORY_LIBRARY) {
    const relevanceScore = calculateRelevanceScore(text, textLower, article, forcingHighT4);

    if (relevanceScore >= RAG_HARD_FILTER_SCORE) {
      results.push({ article, score: relevanceScore });
    }
  }

  return results.sort((a, b) => b.score - a.score);
};

export const retrieveFewShots = (text: string): readonly HistItem[] => {
  const historyCollection = getHistoryCollection();
  const matchSet: HistItem[] = [];
  for (const item of historyCollection) {
    const words = item.inputText.split(/\s+/);
    const intersection = words.filter((word) => word.length > 1 && text.includes(word)).length;

    if (intersection > 1 || item.score < 60) {
      matchSet.push(item);
    }
    if (matchSet.length >= 2) break;
  }

  if (matchSet.length === 0 && historyCollection.length > 0) {
    return historyCollection.slice(0, Math.min(2, historyCollection.length));
  }

  return matchSet;
};
