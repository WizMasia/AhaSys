import type { HistoryItem } from '../../types/api';

export interface HistoryGradeInfo {
  readonly grade: number;
  readonly isPassed: boolean;
  readonly color: string;
  readonly hasWarning: boolean;
}

export interface HistoryFilters {
  readonly searchQuery: string;
  readonly categoryFilter: string;
  readonly verdictFilter: string;
}

export interface HistoryTabProps {
  readonly historyItems: readonly HistoryItem[];
  readonly historySearchQuery: string;
  readonly setHistorySearchQuery: (query: string) => void;
  readonly historyCategoryFilter: string;
  readonly setHistoryCategoryFilter: (filter: string) => void;
  readonly historyVerdictFilter: string;
  readonly setHistoryVerdictFilter: (filter: string) => void;
  readonly clearHistoryLedger: () => Promise<void>;
  readonly setInputText: (text: string) => void;
  readonly restoreHistoryResult: (item: HistoryItem) => void;
  readonly getCsatGradeInfo: (score: number) => HistoryGradeInfo;
}

export interface HistoryThemeProps {
  readonly darkMode: boolean;
}
