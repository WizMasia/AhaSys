/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import type { BenchmarkCase } from './types';
import type { HistoryItem } from './types/api';
import { AppFooter } from './components/app/AppFooter';
import { AppNavigation } from './components/app/AppNavigation';
import { AppTabPanels } from './components/app/AppTabPanels';
import { PrintReportModal } from './components/app/PrintReportModal';
import type { AppTab } from './components/app/appTypes';
import type { ReviewInputMode } from './components/review/ReviewTab.types';
import { useApp } from './contexts/AppContext';
import { useAnalysisRunner } from './hooks/useAnalysisRunner';
import { useBenchmarkRunner } from './hooks/useBenchmarkRunner';
import { useImageUploads } from './hooks/useImageUploads';
import { apiClient } from './services/api';
import { browserPrintAdapter } from './utils/print/browserPrintAdapter';
import {
  buildMarkdownReport,
  getCsatGradeInfo,
  getScoreColor,
  getSeverityBadge,
  makeLawGoLink,
} from './utils/report';

export default function App() {
  const llm = useApp();
  const { darkMode, setDarkMode, fontSize, setFontSize, activeTab, setActiveTab } = llm;

  const [copied, setCopied] = useState(false);
  const [inputMode, setInputMode] = useState<ReviewInputMode>('text');
  const [inputText, setInputText] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showKeyAlert, setShowKeyAlert] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('all');
  const [historyVerdictFilter, setHistoryVerdictFilter] = useState('all');
  const [showBenchmarkTab, setShowBenchmarkTab] = useState(false);
  const [benchmarkCases, setBenchmarkCases] = useState<BenchmarkCase[]>([]);

  const {
    uploadedImages,
    dragActive,
    handleDrag,
    handleDrop,
    handleImageChange,
    clearAllImages,
    removeUploadedImage,
  } = useImageUploads();

  const fetchHistory = async () => {
    try {
      const data = await apiClient.getHistory();
      setHistoryItems(data);
    } catch {
      console.warn('Failed to retrieve history nodes.');
    }
  };

  const fetchBenchmarkCases = async () => {
    try {
      const data = await apiClient.getBenchmarkCases();
      setBenchmarkCases(data.map((item) => ({ ...item, status: 'pending' })));
    } catch {
      console.warn('Failed to load benchmark index.');
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchBenchmarkCases();
    setShowBenchmarkTab(false);
  }, [activeTab]);

  const {
    loading,
    analysisProgress,
    analysisStatusMsg,
    analysisResult,
    setAnalysisResult,
    errorText,
    setErrorText,
    localLlmErrorText,
    analysisMode,
    setAnalysisMode,
    triggerAnalysis,
  } = useAnalysisRunner({
    inputText,
    websiteUrl,
    additionalContext,
    uploadedImages,
    adapterType: llm.adapterType,
    customModel: llm.customModel,
    customEndpoint: llm.customEndpoint,
    customApiKey: llm.customApiKey,
    analysisMode: 'optimized',
    refreshHistory: fetchHistory,
  });

  const {
    benchmarkRunning,
    benchmarkProgress,
    benchmarkStatusMsg,
    benchmarkStats,
    triggerBenchmark,
  } = useBenchmarkRunner({
    adapterType: llm.adapterType,
    customModel: llm.customModel,
    setBenchmarkCases,
    setErrorText,
  });

  const getMarkdownReportString = (): string => buildMarkdownReport(analysisResult, llm.customModel);

  const handleCopyMarkdown = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(getMarkdownReportString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenPrintTab = () => {
    if (!analysisResult) return;
    browserPrintAdapter.open({ analysisResult, inputText, websiteUrl, additionalContext });
  };

  const clearHistoryLedger = async () => {
    try {
      await apiClient.clearHistory();
      setHistoryItems([]);
      setAnalysisResult(null);
    } catch {
      console.warn('Failed to clear history on endpoint.');
    }
  };

  const restoreHistoryResult = (item: HistoryItem) => {
    setAnalysisResult(item.result || null);
    setInputText(item.inputText || '');
    setErrorText(null);
    setActiveTab('review');
  };

  const handleTabSelect = (tab: AppTab) => {
    setActiveTab(tab);
    setErrorText(null);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans tracking-tight ${darkMode ? 'bg-[#060913] text-slate-100 dark' : 'bg-slate-50 text-slate-900'}`}>
      <AppNavigation
        activeTab={activeTab}
        darkMode={darkMode}
        fontSize={fontSize}
        showBenchmarkTab={showBenchmarkTab}
        onSelect={handleTabSelect}
        setDarkMode={setDarkMode}
        setFontSize={setFontSize}
      />

      <AppTabPanels
        activeTab={activeTab}
        fontSize={fontSize}
        showBenchmarkTab={showBenchmarkTab}
        reviewProps={{
          errorText,
          setErrorText,
          showKeyAlert,
          setShowKeyAlert,
          inputMode,
          setInputMode,
          inputText,
          setInputText,
          websiteUrl,
          setWebsiteUrl,
          additionalContext,
          setAdditionalContext,
          uploadedImages,
          dragActive,
          handleDrag,
          handleDrop,
          handleImageChange,
          clearAllImages,
          removeUploadedImage,
          triggerAnalysis,
          loading,
          analysisProgress,
          analysisStatusMsg,
          analysisResult,
          localLlmErrorText,
          handleCopyMarkdown,
          copied,
          setShowPrintModal,
          analysisMode,
          setAnalysisMode,
          getCsatGradeInfo,
          getScoreColor,
          getMarkdownReportString,
          makeLawGoLink,
          getSeverityBadge,
        }}
        benchmark={{
          running: benchmarkRunning,
          progress: benchmarkProgress,
          statusMsg: benchmarkStatusMsg,
          stats: benchmarkStats,
          cases: benchmarkCases,
          trigger: triggerBenchmark,
        }}
        history={{
          items: historyItems,
          searchQuery: historySearchQuery,
          setSearchQuery: setHistorySearchQuery,
          categoryFilter: historyCategoryFilter,
          setCategoryFilter: setHistoryCategoryFilter,
          verdictFilter: historyVerdictFilter,
          setVerdictFilter: setHistoryVerdictFilter,
          clearLedger: clearHistoryLedger,
          restoreResult: restoreHistoryResult,
        }}
      />

      <AppFooter adapterType={llm.adapterType} customModel={llm.customModel} />

      {showPrintModal && analysisResult && (
        <PrintReportModal
          analysisResult={analysisResult}
          inputText={inputText}
          websiteUrl={websiteUrl}
          additionalContext={additionalContext}
          onOpenPrintTab={handleOpenPrintTab}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
