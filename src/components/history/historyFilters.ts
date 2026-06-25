import type { HistoryItem } from '../../types/api';
import type { HistoryFilters } from './historyTypes';

const matchesHistoryCategory = (item: HistoryItem, filter: string): boolean => {
  if (filter === 'all') return true;

  const type = item.meta?.productType || '';

  switch (filter) {
    case 'food':
      return type.includes('식품');
    case 'cosmetic':
      return type.includes('화장품');
    case 'medical':
      return type.includes('의료');
    case 'finance':
      return type.includes('금융');
    case 'general':
      return !type.includes('식품') && !type.includes('화장품') && !type.includes('의료') && !type.includes('금융');
    default:
      return true;
  }
};

const matchesHistoryVerdict = (item: HistoryItem, filter: string): boolean => {
  if (filter === 'all') return true;

  const isPassed = item.score >= 80;

  switch (filter) {
    case 'passed':
      return isPassed;
    case 'failed':
      return !isPassed;
    default:
      return true;
  }
};

const matchesHistorySearch = (item: HistoryItem, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    (item.inputText && item.inputText.toLowerCase().includes(q)) ||
    (item.meta?.productType && item.meta.productType.toLowerCase().includes(q)) ||
    (item.meta?.regulatoryDomain && item.meta.regulatoryDomain.toLowerCase().includes(q)) ||
    false
  );
};

export const filterHistoryItems = (
  historyItems: readonly HistoryItem[],
  filters: HistoryFilters,
): readonly HistoryItem[] => (
  historyItems.filter((item) => (
    matchesHistorySearch(item, filters.searchQuery) &&
    matchesHistoryCategory(item, filters.categoryFilter) &&
    matchesHistoryVerdict(item, filters.verdictFilter)
  ))
);
