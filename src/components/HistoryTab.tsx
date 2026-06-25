/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { filterHistoryItems } from './history/historyFilters';
import { HistoryEmptyState } from './history/HistoryEmptyState';
import { HistoryFilterPanel } from './history/HistoryFilterPanel';
import { HistoryIntroCard } from './history/HistoryIntroCard';
import { HistoryResultCount } from './history/HistoryResultCount';
import { HistoryTimeline } from './history/HistoryTimeline';
import type { HistoryTabProps } from './history/historyTypes';

export function HistoryTab({
  historyItems,
  historySearchQuery,
  setHistorySearchQuery,
  historyCategoryFilter,
  setHistoryCategoryFilter,
  historyVerdictFilter,
  setHistoryVerdictFilter,
  clearHistoryLedger,
  setInputText,
  restoreHistoryResult,
  getCsatGradeInfo
}: HistoryTabProps) {
  const { darkMode } = useApp();
  const filteredItems = useMemo(() => (
    filterHistoryItems(historyItems, {
      searchQuery: historySearchQuery,
      categoryFilter: historyCategoryFilter,
      verdictFilter: historyVerdictFilter,
    })
  ), [historyItems, historySearchQuery, historyCategoryFilter, historyVerdictFilter]);

  return (
    <div className="space-y-6">
      <HistoryIntroCard darkMode={darkMode} clearHistoryLedger={clearHistoryLedger} />
      <HistoryFilterPanel
        darkMode={darkMode}
        historySearchQuery={historySearchQuery}
        setHistorySearchQuery={setHistorySearchQuery}
        historyCategoryFilter={historyCategoryFilter}
        setHistoryCategoryFilter={setHistoryCategoryFilter}
        historyVerdictFilter={historyVerdictFilter}
        setHistoryVerdictFilter={setHistoryVerdictFilter}
      />
      <HistoryResultCount filteredCount={filteredItems.length} />
      {historyItems.length === 0 ? (
        <HistoryEmptyState kind="empty-ledger" />
      ) : filteredItems.length === 0 ? (
        <HistoryEmptyState kind="empty-filter" />
      ) : (
        <HistoryTimeline
          darkMode={darkMode}
          filteredItems={filteredItems}
          setInputText={setInputText}
          restoreHistoryResult={restoreHistoryResult}
          getCsatGradeInfo={getCsatGradeInfo}
        />
      )}
    </div>
  );
}
