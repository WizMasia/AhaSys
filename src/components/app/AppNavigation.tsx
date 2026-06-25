import { Gauge, History, Moon, Settings, Sun } from 'lucide-react';
import { MobileTabBar } from '../MobileTabBar';
import type { AppTab, FontSize } from './appTypes';

interface AppNavigationProps {
  readonly activeTab: AppTab;
  readonly darkMode: boolean;
  readonly fontSize: FontSize;
  readonly showBenchmarkTab: boolean;
  readonly onSelect: (tab: AppTab) => void;
  readonly setDarkMode: (enabled: boolean) => void;
  readonly setFontSize: (size: FontSize) => void;
}

const navButtonClass = (selected: boolean, darkMode: boolean): string => (
  `py-2 px-4 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
    selected
      ? (darkMode ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-md font-extrabold' : 'bg-indigo-600/10 text-indigo-700 border border-indigo-500/20 shadow-sm font-extrabold')
      : (darkMode ? 'text-slate-400 hover:text-slate-250 border border-transparent' : 'text-slate-600 hover:text-slate-900 border border-transparent')
  }`
);

const fontButtonClass = (selected: boolean, darkMode: boolean): string => (
  `px-2 py-1 rounded text-[10px] font-black cursor-pointer transition-colors ${
    selected ? 'bg-indigo-600 text-white shadow-sm' : (darkMode ? 'text-slate-500 hover:text-slate-350' : 'text-slate-600 hover:text-slate-900')
  }`
);

export function AppNavigation({
  activeTab,
  darkMode,
  fontSize,
  showBenchmarkTab,
  onSelect,
  setDarkMode,
  setFontSize,
}: AppNavigationProps) {
  return (
    <>
      <nav className={`no-print border-b sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex items-center justify-between transition-colors ${darkMode ? 'bg-[#060913]/85 border-slate-900/60' : 'bg-white/90 border-slate-200'}`}>
        <div
          onClick={() => onSelect('review')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-200">
            🛡️
          </div>
          <div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-black tracking-widest uppercase group-hover:text-indigo-300 transition-colors">Compliance RAG Platform Suite</span>
            <h1 className={`text-base font-black flex items-center gap-1.5 leading-none mt-1 ${darkMode ? 'text-slate-100' : 'text-slate-950'}`}>
              <span>아하시스턴트 AI (aHaSys)</span>
              <span className="text-[11px] text-slate-500 font-normal">v3.5.2 Pro</span>
            </h1>
          </div>
        </div>

        <div className={`hidden lg:flex items-center gap-2 p-1.5 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-800/40' : 'bg-slate-100 border-slate-200'}`}>
          <button onClick={() => onSelect('review')} className={navButtonClass(activeTab === 'review', darkMode)}>
            <span>✏️ 실시간 심의</span>
          </button>
          {showBenchmarkTab && (
            <button onClick={() => onSelect('benchmark')} className={navButtonClass(activeTab === 'benchmark', darkMode)}>
              <Gauge className="w-3.5 h-3.5" />
              <span>📊 무작위 벤치마크 대시보드</span>
            </button>
          )}
          <button onClick={() => onSelect('history')} className={navButtonClass(activeTab === 'history', darkMode)}>
            <History className="w-3.5 h-3.5" />
            <span>Timeline 저장소</span>
          </button>
          <button onClick={() => onSelect('about')} className={navButtonClass(activeTab === 'about', darkMode)}>
            <span>📜 플랫폼 지침</span>
          </button>
          <button onClick={() => onSelect('settings')} className={navButtonClass(activeTab === 'settings', darkMode)}>
            <Settings className="w-3.5 h-3.5" />
            <span>LLM 설정</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex rounded-lg p-0.5 no-print border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-250'}`}>
            <button onClick={() => setFontSize('sm')} className={fontButtonClass(fontSize === 'sm', darkMode)} title="글꼴 작게">A-</button>
            <button onClick={() => setFontSize('md')} className={fontButtonClass(fontSize === 'md', darkMode)} title="글꼴 표준">A</button>
            <button onClick={() => setFontSize('lg')} className={fontButtonClass(fontSize === 'lg', darkMode)} title="글꼴 크게">A+</button>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300' : 'bg-slate-100 border-slate-200 text-indigo-600 hover:text-indigo-800'}`}
            title={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      <MobileTabBar
        activeTab={activeTab}
        darkMode={darkMode}
        showBenchmarkTab={showBenchmarkTab}
        onSelect={onSelect}
      />
    </>
  );
}
