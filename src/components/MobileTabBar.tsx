import type { LucideIcon } from 'lucide-react';
import { FileText, Gauge, History, Info, Settings } from 'lucide-react';

type AppTab = 'review' | 'about' | 'benchmark' | 'history' | 'settings';

interface MobileTabItem {
  readonly id: AppTab;
  readonly label: string;
  readonly icon: LucideIcon;
}

interface MobileTabBarProps {
  readonly activeTab: AppTab;
  readonly darkMode: boolean;
  readonly showBenchmarkTab: boolean;
  readonly onSelect: (tab: AppTab) => void;
}

const REVIEW_ITEM: MobileTabItem = { id: 'review', label: '심의', icon: FileText };

const BASE_ITEMS: readonly MobileTabItem[] = [
  REVIEW_ITEM,
  { id: 'settings', label: 'LLM 설정', icon: Settings },
  { id: 'history', label: '저장소', icon: History },
  { id: 'about', label: '지침', icon: Info },
] as const;

const BENCHMARK_ITEM: MobileTabItem = {
  id: 'benchmark',
  label: '벤치마크',
  icon: Gauge,
};

export function MobileTabBar({ activeTab, darkMode, showBenchmarkTab, onSelect }: MobileTabBarProps) {
  const items = showBenchmarkTab
    ? [REVIEW_ITEM, BENCHMARK_ITEM, ...BASE_ITEMS.slice(1)]
    : BASE_ITEMS;
  const gridClass = showBenchmarkTab ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <nav
      aria-label="모바일 주요 메뉴"
      className={`no-print lg:hidden sticky top-[97px] z-30 border-b px-3 py-2 backdrop-blur-xl ${
        darkMode ? 'bg-[#060913]/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}
    >
      <div className={`mx-auto grid max-w-md gap-1 ${gridClass}`}>
        {items.map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.id;
          const selectedClass = darkMode
            ? 'bg-indigo-600/15 text-indigo-300 border-indigo-500/30'
            : 'bg-indigo-600/10 text-indigo-700 border-indigo-500/20';
          const idleClass = darkMode
            ? 'text-slate-400 border-transparent hover:bg-slate-900/80 hover:text-slate-200'
            : 'text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-950';

          return (
            <button
              key={item.id}
              type="button"
              aria-current={selected ? 'page' : undefined}
              aria-label={`${item.label} 탭 열기`}
              onClick={() => onSelect(item.id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-[10px] font-black transition-colors ${
                selected ? selectedClass : idleClass
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
