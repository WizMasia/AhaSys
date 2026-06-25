import type { BenchmarkCase } from '../../types';
import type { HistoryItem } from '../../types/api';
import { AboutTab } from '../AboutTab';
import { BenchmarkTab } from '../BenchmarkTab';
import { HistoryTab } from '../HistoryTab';
import { ReviewTab } from '../ReviewTab';
import { SettingsTab } from '../SettingsTab';
import type { ReviewTabProps } from '../review/ReviewTab.types';
import type { AppTab, FontSize } from './appTypes';

interface BenchmarkState {
  readonly running: boolean;
  readonly progress: number;
  readonly statusMsg: string;
  readonly stats: {
    readonly passed: number;
    readonly failed: number;
    readonly total: number;
    readonly averageLatency: number;
  } | null;
  readonly cases: readonly BenchmarkCase[];
  readonly trigger: () => Promise<void>;
}

interface HistoryState {
  readonly items: readonly HistoryItem[];
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly categoryFilter: string;
  readonly setCategoryFilter: (filter: string) => void;
  readonly verdictFilter: string;
  readonly setVerdictFilter: (filter: string) => void;
  readonly clearLedger: () => Promise<void>;
  readonly restoreResult: (item: HistoryItem) => void;
}

interface AppTabPanelsProps {
  readonly activeTab: AppTab;
  readonly fontSize: FontSize;
  readonly showBenchmarkTab: boolean;
  readonly reviewProps: ReviewTabProps;
  readonly benchmark: BenchmarkState;
  readonly history: HistoryState;
}

export function AppTabPanels({
  activeTab,
  fontSize,
  showBenchmarkTab,
  reviewProps,
  benchmark,
  history,
}: AppTabPanelsProps) {
  return (
    <main className={`max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 no-print ${fontSize === 'sm' ? 'text-size-sm' : fontSize === 'lg' ? 'text-size-lg' : 'text-size-md'}`}>
      {activeTab === 'review' && <ReviewTab {...reviewProps} />}

      {activeTab === 'settings' && <SettingsTab />}

      {activeTab === 'about' && <AboutTab />}

      {activeTab === 'benchmark' && showBenchmarkTab && (
        <BenchmarkTab
          benchmarkRunning={benchmark.running}
          benchmarkProgress={benchmark.progress}
          benchmarkStatusMsg={benchmark.statusMsg}
          benchmarkStats={benchmark.stats}
          benchmarkCases={[...benchmark.cases]}
          triggerBenchmark={benchmark.trigger}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          historyItems={[...history.items]}
          historySearchQuery={history.searchQuery}
          setHistorySearchQuery={history.setSearchQuery}
          historyCategoryFilter={history.categoryFilter}
          setHistoryCategoryFilter={history.setCategoryFilter}
          historyVerdictFilter={history.verdictFilter}
          setHistoryVerdictFilter={history.setVerdictFilter}
          clearHistoryLedger={history.clearLedger}
          setInputText={reviewProps.setInputText}
          restoreHistoryResult={history.restoreResult}
          getCsatGradeInfo={reviewProps.getCsatGradeInfo}
        />
      )}
    </main>
  );
}
