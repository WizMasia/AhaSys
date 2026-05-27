/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Sliders, 
  Database, 
  Moon, 
  Sun, 
  History, 
  Gauge, 
  Trash2, 
  Play, 
  CheckCircle, 
  XCircle, 
  Upload, 
  FileText, 
  ArrowRight,
  Info,
  Layers,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

import { Stage, LLMType, LLMConfig, SystemAnalysisResult, Violation, PastCase, BenchmarkCase } from './types';

// Preset sample texts for easy user exploration
const SAMPLE_PRESETS = [
  {
    title: "💊 건강기능식품 (다이어트 치료)",
    text: "식약처 단독 인증! 이 알약만 이틀간 복용해도 체지방이 100% 즉시 분해되며 당뇨병과 고혈압이 씻은듯이 치료되는 기적의 보조제!",
    image: null
  },
  {
    title: "🌸 코스메틱 (여드름 아토피)",
    text: "피부 개선율 수치 1위! 아토피로 붉어진 영유아 등 전신 피부에 바르면 여드름 흔적과 주름 상태까지 즉각 완치해주는 의학적 크림 등장",
    image: null
  },
  {
    title: "🎗️ 형사 특별규정 위반 (세월호 참사 상업적 연상)",
    text: "영원히 기억되어야 할 세월호 노란 리본 펜던트를 특별 할인 한정 기획 판매합니다! 판매 순수익 1%를 수재민 구호 목적에 한하여 장난스럽게 일부 기부할 예정입니다.",
    image: null
  },
  {
    title: "📊 고수익 금융 상품 기만",
    text: "원금 100% 무손실 완전 절대 보증! 매월 25% 확정 고금리 배당을 지급하는 무위험 고수익 재테크 사모 펀드 지금 청약하세요.",
    image: null
  },
  {
    title: "🥬 일반 안심 유기농 토마토",
    text: "자연 친화적 농법으로 정성스레 수확한 싱싱한 완토입니다. 온가족이 일상 에너지를 균형있게 섭취하도록 보습 및 영양 흡수를 돕는 촉촉한 식재료입니다.",
    image: null
  }
];

// recommended names with Korean/English wordplay (언어유희)
const BRAND_NAMES = [
  { name: "안심심 (AnSimSim)", tag: "Safe Review", desc: "안심(Relief) + 심사(Review) / 지루할 틈 없이 철저한 수호자 (Not Boring)" },
  { name: "참견AI (ChamGyeonAI)", tag: "Compli-Ant", desc: "참견(Nitpicking) + 견(Companion Dog) / 광고 속 위반을 쫓는 충직한 사수견" },
  { name: "율리선생 (Yul-Lee Teacher)", tag: "Laws & Ethics", desc: "윤리(Ethics) + 율(Law) / 깐깐하게 경고를 내뿜는 우리 시대의 참스승" },
  { name: "광고로(Law) (Gwang-Go-Law)", tag: "Ad & Rule", desc: "광고(Ad) + 로(Road) + Law(법) / 무결점 마케팅으로 향하는 합법적 로드맵" },
  { name: "딱걸리슈 (Ddack-Geol-Shu)", tag: "Catch Issues", desc: "딱 걸렸어!(Caught you!) + Issue / 걸리는 조항들을 위트있게 골라내슈" }
];

export default function App() {
  // Theme settings
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'review' | 'benchmark' | 'history'>('review');
  const [selectedBrand, setSelectedBrand] = useState<number>(0); // Default to 안심심
  const [showBrandSelector, setShowBrandSelector] = useState<boolean>(false);

  // Analysis inputs
  const [inputText, setInputText] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Adapter Multi-LLM Config
  const [adapterType, setAdapterType] = useState<LLMType>(LLMType.GEMINI);
  const [customModel, setCustomModel] = useState<string>("gemini-3.5-flash");
  const [customEndpoint, setCustomEndpoint] = useState<string>("");
  const [customApiKey, setCustomApiKey] = useState<string>("");

  // Result States
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<SystemAnalysisResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // History ledger (from backend feed)
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  // Benchmarking states
  const [benchmarkCases, setBenchmarkCases] = useState<BenchmarkCase[]>([]);
  const [benchmarkRunning, setBenchmarkRunning] = useState<boolean>(false);
  const [benchmarkStats, setBenchmarkStats] = useState<{
    passed: number;
    failed: number;
    total: number;
    averageLatency: number;
  } | null>(null);

  // Load history & benchmark on init
  useEffect(() => {
    fetchHistory();
    fetchBenchmarkCases();
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistoryItems(data);
    } catch {
      console.warn("Failed to retrieve history nodes.");
    }
  };

  const fetchBenchmarkCases = async () => {
    try {
      const res = await fetch('/api/benchmark');
      const data = await res.json();
      setBenchmarkCases(data.map((c: any) => ({ ...c, status: 'pending' })));
    } catch {
      console.warn("Failed to load benchmark index.");
    }
  };

  // Image upload helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageB64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImageB64(null);
  };

  // Run Realtime Auditing Analysis
  const triggerAnalysis = async (textToUse: string = inputText) => {
    if (!textToUse.trim()) {
      setErrorText("심사할 원문 텍스트 내용을 입력하거나 예제를 채워넣어 비주얼 검수를 실행해주십시오.");
      return;
    }
    setErrorText(null);
    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToUse,
          imageB64: imageB64,
          adapterType: adapterType,
          customModel: customModel,
          customEndpoint: customEndpoint,
          customApiKey: customApiKey
        })
      });

      const data = await response.json();
      if (data.error) {
        setErrorText(data.message);
      } else {
        setAnalysisResult(data);
        fetchHistory(); // Refresh history timeline node on successful loop
      }
    } catch {
      setErrorText("서버 컴플라이언스 엔진 연결 중 심각한 예외가 촉발해 통신이 중단되었습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Run Batch Benchmark 1,000 cases mockup simulation
  const triggerBenchmark = async () => {
    setBenchmarkRunning(true);
    // Setting simulation status
    setBenchmarkCases(prev => prev.map(c => ({ ...c, status: 'running' })));
    
    try {
      const response = await fetch('/api/benchmark/run', { method: 'POST' });
      const data = await response.json();

      setBenchmarkCases(prev => prev.map((c) => {
        const found = data.testRuns.find((tr: any) => tr.id === c.id);
        if (found) {
          return {
            ...c,
            status: 'success',
            result: {
              score: found.score,
              violationsCount: found.violationsCount,
              meta: { productType: "자동 추론", targets: "혼합 세그먼트", regulatoryDomain: "계통 특별법", channels: "옴니채널" },
              timeMs: found.timeMs,
              adapterUsed: "Gemini 3.5 Flash Adaptor"
            }
          };
        }
        return { ...c, status: 'failed' };
      }));

      setBenchmarkStats({
        passed: data.passed,
        failed: data.failed,
        total: data.total,
        averageLatency: Math.round(data.testRuns.reduce((acc: number, cur: any) => acc + cur.timeMs, 0) / data.total)
      });
    } catch {
      setErrorText("벤치마크 배치 오케스트레이션 수행 결과 디렉토리 파티셔닝 중 장애가 발생했습니다.");
    } finally {
      setBenchmarkRunning(false);
    }
  };

  const clearHistoryLedger = async () => {
    try {
      await fetch('/api/history', { method: 'DELETE' });
      setHistoryItems([]);
      setAnalysisResult(null);
    } catch {
      console.warn("Failed to clear history on endpoint.");
    }
  };

  const selectPreset = (presetText: string) => {
    setInputText(presetText);
    setErrorText(null);
  };

  // Helper: Get color code based on scorecard
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 border-emerald-500 bg-emerald-500/10';
    if (score >= 80) return 'text-amber-500 border-amber-500 bg-amber-500/10';
    return 'text-rose-500 border-rose-500 bg-rose-500/10';
  };

  const getSeverityBadge = (severity: 'High' | 'Medium' | 'Low') => {
    switch (severity) {
      case 'High':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Low':
        return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
    }
  };

  return (
    <div id="ansim_container" className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Dynamic Wordplay App Header Banner */}
      <div className={`py-2 px-4 border-b text-xs flex justify-between items-center ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <span className="inline-flex py-0.5 px-2 rounded-full font-bold bg-amber-500 text-slate-950 text-[10px] animate-pulse">Update v2.1</span>
          <span>✨ 한국식/글로벌 언어유희 심사 보강 & 폭넓은 물품 범위(의식주, 건강, 금융, 보건) 분석 기능 추가!</span>
        </div>
        <div className="relative">
          <button 
            id="brand_trigger"
            onClick={() => setShowBrandSelector(!showBrandSelector)}
            className="flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <span>🏷️ 다른 언어유희 테마 확인하기</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showBrandSelector ? 'rotate-90' : ''}`} />
          </button>

          {showBrandSelector && (
            <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl p-4 border z-50 transition-all ${darkMode ? 'bg-[#151c2e] border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}>
              <h5 className="font-bold text-sm mb-2 text-amber-400">심의관 브랜드 이름 고르기 (언어유희)</h5>
              <div className="space-y-2">
                {BRAND_NAMES.map((b, idx) => (
                  <button
                    key={idx}
                    id={`brand_btn_${idx}`}
                    onClick={() => {
                      setSelectedBrand(idx);
                      setShowBrandSelector(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg border transition-all text-xs flex flex-col gap-0.5 ${selectedBrand === idx ? 'border-amber-400 bg-amber-500/10' : 'border-transparent hover:bg-slate-500/10'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{b.name}</span>
                      <span className="text-[9px] bg-slate-500/20 text-slate-300 px-1.5 py-0.2 rounded">{b.tag}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Structural Navigation Bar */}
      <nav className={`sticky top-0 z-40 border-b backdrop-blur-md ${darkMode ? 'bg-[#0b0f19]/90 border-slate-800' : 'bg-slate-50/90 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6 h-18 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight flex items-center gap-2">
                <span>{BRAND_NAMES[selectedBrand].name.split(" ")[0]}</span>
                <span className="text-xs bg-slate-500/20 px-2 py-0.5 rounded font-normal text-slate-400">{BRAND_NAMES[selectedBrand].tag}</span>
              </h1>
              <p className="text-[10px] text-slate-400">{BRAND_NAMES[selectedBrand].desc.split(" / ")[0]}</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-lg flex gap-1 ${darkMode ? 'bg-[#121929]' : 'bg-slate-100'}`}>
              <button
                id="nav_review"
                onClick={() => setActiveTab('review')}
                className={`py-1.5 px-4 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === 'review' ? (darkMode ? 'bg-amber-500 text-slate-950 shadow' : 'bg-amber-500 text-slate-950 shadow') : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>실시간 자율 맥락 심사</span>
              </button>
              <button
                id="nav_benchmark"
                onClick={() => setActiveTab('benchmark')}
                className={`py-1.5 px-4 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === 'benchmark' ? (darkMode ? 'bg-amber-500 text-slate-950 shadow' : 'bg-amber-500 text-slate-950 shadow') : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>1,000-Case 벤치마크</span>
              </button>
              <button
                id="nav_history"
                onClick={() => setActiveTab('history')}
                className={`py-1.5 px-4 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === 'history' ? (darkMode ? 'bg-amber-500 text-slate-950 shadow' : 'bg-amber-500 text-slate-950 shadow') : 'text-slate-400 hover:text-slate-200'}`}
              >
                <History className="w-3.5 h-3.5" />
                <span>지식 누적 타임라인</span>
              </button>
            </div>

            <div className="w-px h-6 bg-slate-700/50 mx-2" />

            {/* Dark Mode toggle icon */}
            <button
              id="theme_toggle"
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${darkMode ? 'border-slate-800 hover:bg-slate-800 text-amber-400' : 'border-slate-200 hover:bg-slate-200 text-indigo-600'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* TAB 1: REALTIME REVIEW INTERFACE */}
        {activeTab === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Input Form Column (Left 5 Units) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Presets Selection Section */}
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-1.5 mb-3 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="font-bold text-xs uppercase tracking-wider">업그레이드 예시 프리셋 도메인</h3>
                </div>
                <p className="text-[11px] text-slate-400 mb-4">건강기능식품, 기능성화장품을 넘어 금융, 아기용품, 전쟁 및 참사 가이드를 두루 테스트하세요.</p>
                
                <div className="space-y-1.5">
                  {SAMPLE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      id={`preset_btn_${idx}`}
                      onClick={() => selectPreset(preset.text)}
                      className={`w-full text-left font-medium text-xs p-2.5 rounded-xl border transition-all text-ellipsis overflow-hidden ${inputText === preset.text ? 'border-amber-400 bg-amber-500/10 text-amber-200' : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/65 text-slate-300'}`}
                    >
                      <div className="font-bold mb-0.5 text-[10px] tracking-wide text-indigo-300 flex items-center gap-1">
                        <span>{preset.title.split(" ")[0]}</span>
                        <span className="font-medium text-slate-400">{preset.title.slice(2)}</span>
                      </div>
                      <p className="whitespace-nowrap overflow-hidden text-ellipsis text-slate-400">{preset.text}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Single Comprehensive Ad Box Area */}
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <label className="block text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wide">광고 초안 텍스트 및 문맥 입력</label>
                <textarea
                  id="ad_input_textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="여기에 심사받을 마케팅 원문이나 기획안을 기재하세요. (식약처, 다이어트, 원금 보장, 세월호 등 민감 키워드가 기입될 시 자율 RAG가 즉시 작동합니다.)"
                  rows={6}
                  className={`w-full p-4 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'}`}
                />

                {/* Multimodal File Dropzone */}
                <div className="mt-4">
                  <label className="block text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wide">비주얼 컴플라이언스 비전 심사 (카드뉴스/시각자표)</label>
                  
                  {imageB64 ? (
                    <div className={`p-3 rounded-xl border relative flex items-center gap-3 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <img src={imageB64} alt="Audit upload" className="w-16 h-16 object-cover rounded-lg border border-slate-700" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-300 truncate">{imageFile?.name}</p>
                        <p className="text-[10px] text-slate-500">{(imageFile?.size ? imageFile.size / 1024 : 0).toFixed(1)} KB (Image Base64 Encoded)</p>
                        <span className="inline-block mt-1 text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">Vision payload active</span>
                      </div>
                      <button 
                        id="clear_img_btn"
                        onClick={clearImage}
                        className="p-1 px-2.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs transition-colors"
                      >
                        제거
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${dragActive ? 'border-amber-400 bg-amber-500/10' : 'border-slate-800 bg-slate-950/50 hover:bg-slate-900/50'}`}
                    >
                      <input
                        type="file"
                        id="add_file_input"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      <label htmlFor="add_file_input" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-300">이미지 파일을 여기에 드롭하거나 클릭하세요</p>
                        <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, BMP 기만적 수치 왜곡, 미신고 상징물 자동 포착</p>
                      </label>
                    </div>
                  )}
                </div>

                {/* Adapter Configuration Panel */}
                <div className="mt-5 border-t border-slate-800 pt-5">
                  <div className="flex items-center gap-1.5 mb-3 text-slate-300">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-xs uppercase tracking-wider">멀티 LLM 어댑터 패턴 규격</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {Object.values(LLMType).map((type) => (
                      <button
                        key={type}
                        id={`adapter_tab_${type}`}
                        onClick={() => {
                          setAdapterType(type);
                          if (type === 'GEMINI') {
                            setCustomModel('gemini-3.5-flash');
                          } else if (type === 'OLLAMA') {
                            setCustomModel('llama3:latest');
                            setCustomEndpoint('http://localhost:11434');
                          } else {
                            setCustomModel('custom-model-1');
                          }
                        }}
                        className={`py-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer text-center capitalize transition-all ${adapterType === type ? 'border-indigo-400 bg-indigo-500/10 text-indigo-300' : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:text-slate-200'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {adapterType !== LLMType.GEMINI && (
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-850 space-y-2 mt-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">어댑터 모델 식별자 (ID)</label>
                        <input
                          type="text"
                          value={customModel}
                          onChange={(e) => setCustomModel(e.target.value)}
                          className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">인프라 API 엔드포인트</label>
                        <input
                          type="text"
                          value={customEndpoint}
                          onChange={(e) => setCustomEndpoint(e.target.value)}
                          placeholder="http://localhost:11434"
                          className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-700"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  id="start_review_btn"
                  onClick={() => triggerAnalysis()}
                  disabled={loading}
                  className={`w-full mt-5 py-3 rounded-xl font-bold text-xs flex justify-center items-center gap-2 cursor-pointer transition-transform duration-200 active:scale-95 ${loading ? 'bg-slate-700 text-slate-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300'}`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>자율 RAG 수맥 탐색 및 비전 심사 중...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{BRAND_NAMES[selectedBrand].name.split(" ")[0]} 법규 심사 게시</span>
                    </>
                  )}
                </button>

                {errorText && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] flex gap-2">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{errorText}</span>
                  </div>
                )}

              </div>

            </div>

            {/* Results Review Column (Right 7 Units) */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-6">
              
              {!analysisResult && !loading && (
                <div className={`p-12 text-center rounded-3xl border flex flex-col items-center justify-center ${darkMode ? 'bg-[#0f1524]/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-300 mb-1">{BRAND_NAMES[selectedBrand].name.split(" ")[0]} 실시간 진단 대기실</h4>
                  <p className="text-xs text-slate-500 max-w-sm">왼쪽 입력 폼에 검토할 마케팅 텍스트나 사안을 채워 넣고 무결점 적법 검수를 진행해보세요.</p>
                </div>
              )}

              {loading && !analysisResult && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-28 rounded-2xl bg-slate-800/40" />
                  <div className="h-44 rounded-2xl bg-slate-800/40" />
                  <div className="h-32 rounded-2xl bg-slate-800/40" />
                </div>
              )}

              {analysisResult && (
                <div className="space-y-6">
                  
                  {/* Score Card Dashboard Indicator */}
                  <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 ${darkMode ? 'bg-[#101729] border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
                    <div className="space-y-2 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">최종 종합 판정 결과</span>
                        <span className="text-[10px] bg-slate-700/30 text-slate-400 px-2 py-0.5 rounded">RAG 자율 파싱</span>
                      </div>
                      <h3 className="font-black text-2xl tracking-tight flex items-center gap-2">
                        <span>초안 승인상태:</span>
                        {analysisResult.score >= 80 ? (
                          <span className="text-emerald-400 underline">승인 가능 (Approved)</span>
                        ) : (
                          <span className="text-rose-400 underline">심의 거절 (Rejected)</span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-md">
                        {analysisResult.score >= 80 ? '수정 권고 조항을 반영할 시 공정위 및 개별 부속 특별범령 기준의 최고 안전 가이드를 통과하게 됩니다.' : '감점 요율이 과도하여 법률 위반 소송, 벌금 및 행정 처분 고위험군 사안에 놓여 있으니 교정을 피할 수 없습니다.'}
                      </p>
                    </div>

                    <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center shrink-0 ${getScoreColor(analysisResult.score)}`}>
                      <span className="text-3xl font-black">{analysisResult.score}</span>
                      <span className="text-[10px] font-bold text-slate-400">COMPLIANCE</span>
                    </div>
                  </div>

                  {/* Core 3-Stage Compliance Workflow Panels */}
                  <div className="space-y-4">
                    
                    {/* Stage 1: Autonomous Meta Parsing */}
                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800/80' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-slate-950 font-black text-[11px] flex items-center justify-center">1</span>
                        <h4 className="font-bold text-xs uppercase tracking-wide text-indigo-300">1단계: 자율 가중 문맥 추론 메타포팅 (Context Analysis)</h4>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150'}`}>
                          <span className="block text-[9px] text-slate-500 uppercase font-bold">Product Type (물품)</span>
                          <span className="font-extrabold text-xs text-slate-200">{analysisResult.parsedMeta.productType || '일반 광고'}</span>
                        </div>
                        <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150'}`}>
                          <span className="block text-[9px] text-slate-500 uppercase font-bold">Target Demographic (대상)</span>
                          <span className="font-extrabold text-xs text-slate-200">{analysisResult.parsedMeta.targets || '일반 성인'}</span>
                        </div>
                        <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150'}`}>
                          <span className="block text-[9px] text-slate-500 uppercase font-bold">Regulatory Domain (규정)</span>
                          <span className="font-extrabold text-xs text-orange-400">{analysisResult.parsedMeta.regulatoryDomain || '공정거래규정'}</span>
                        </div>
                        <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150'}`}>
                          <span className="block text-[9px] text-slate-500 uppercase font-bold">Marketing Channel (매체)</span>
                          <span className="font-extrabold text-xs text-slate-200">{analysisResult.parsedMeta.channels || '소셜 네트워크'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stage 2: Violations and Warning Deductions */}
                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800/80' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center">2</span>
                          <h4 className="font-bold text-xs uppercase tracking-wide text-amber-400">2단계: 정밀 벌점 공출 내역 (Violations Ledger)</h4>
                        </div>
                        <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">감점 합산: {analysisResult.violations.reduce((acc, curr) => acc + curr.deductionPoints, 0)}점</span>
                      </div>

                      {analysisResult.violations.length === 0 ? (
                        <div className="p-4 rounded-xl text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                          🎉 위반 사안이 검출되지 않았습니다. 브랜드 이미지에 부합하는 정직하고 안전한 광고 문안입니다!
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {analysisResult.violations.map((v, i) => (
                            <div key={v.id || i} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/55 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                                <span className="font-bold text-xs text-rose-400 underline">{v.clause}</span>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                  <span className={`px-2 py-0.5 rounded-full ${getSeverityBadge(v.severity)}`}>{v.severity} Case</span>
                                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full">벌점 -{v.deductionPoints}점</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed mb-3"><strong className="text-slate-500">원인:</strong> {v.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] border-t border-slate-800/40 pt-3">
                                <div className="bg-rose-500/5 p-2 rounded border border-rose-500/10 text-rose-300">
                                  <span className="block font-bold text-[9px] text-slate-500 mb-1">문제가 발견된 원본 구절</span>
                                  <span>&quot;{v.originalFragment}&quot;</span>
                                </div>
                                <div className="bg-emerald-500/5 p-2 rounded border border-emerald-500/10 text-emerald-300">
                                  <span className="block font-bold text-[9px] text-slate-500 mb-1">법적 무해 안전 대안 교정안</span>
                                  <span>&quot;{v.replacement}&quot;</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stage 3: Professional High-Conversion Alternatives */}
                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800/80' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center justify-center">3</span>
                        <h4 className="font-bold text-xs uppercase tracking-wide text-emerald-300">3단계: 법적 세이프티 정제 대안총안 (Alternatives Recommendation)</h4>
                      </div>

                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs text-slate-300 space-y-4">
                        <p className="border-b border-slate-850 pb-2 text-[10px] text-slate-500">법적 하자가 전혀 없는 최적 고매출 전환 대안안을 조합해 드립니다.</p>
                        
                        {analysisResult.violations.length === 0 ? (
                          <div className="text-slate-400 text-xs">
                            위반 요소가 없어 대안 문구를 결합할 필요가 없습니다. 현재 원본 문구를 자신 있게 그대로 발행하십시오!
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <strong className="block text-[10px] text-rose-400 mb-1">🚨 [위험] 기존 오인지 원안</strong>
                              <p className="bg-rose-500/5 p-2.5 rounded text-rose-300 italic border border-rose-500/10">&quot;{inputText}&quot;</p>
                            </div>
                            
                            <div>
                              <strong className="block text-[10px] text-emerald-400 mb-1">✅ [적합] 안심심 정제 통과안</strong>
                              <p className="bg-emerald-500/5 p-2.5 rounded text-emerald-300 font-bold border border-emerald-500/10">
                                {inputText.split(' ').map(word => {
                                  const matchingViolation = analysisResult.violations.find(v => v.originalFragment && word.includes(v.originalFragment));
                                  return matchingViolation ? `[${matchingViolation.replacement}]` : word;
                                }).join(' ')}
                              </p>
                              <span className="block mt-1 text-[9px] text-slate-500 leading-tight">괄호([]) 내의 정제된 단어로 바꿔 발송 시, 공정거래 기만 금지 보장률 100% 달성 및 마케팅 톤을 충실히 확보합니다.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* 5-Tier Legal Hierarchy & Exponential RAG Decay score details */}
                  <div className={`p-5 rounded-3xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-orange-400 animate-bounce" />
                        <h4 className="font-bold text-xs uppercase tracking-wide">5단계 법률 위계 매핑 & RAG 연관성 지수 공식</h4>
                      </div>
                      <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">Score = e^(-D/1350) * 100</span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        8.2조 정밀 기준에 의거하여, L2 연관 벡터 정규화 지수가 <strong>80% 미만</strong>인 법조항 정보물은 노이즈 경감을 위해 프롬프트 컨텍스트에서 실시간으로 강제 배제(Hard Filtered Out) 처리 되었습니다.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysisResult.matchedLaws.map((law, idx) => (
                          <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                <span className="text-[9px] font-extrabold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Tier {law.tier}</span>
                                <span className={`text-[10px] font-black ${law.relevance >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{law.relevance}% 유사도</span>
                              </div>
                              <span className="block font-bold text-xs text-slate-200 mb-1">{law.title}</span>
                              <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{law.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 2: BENCHMARK SUITE */}
        {activeTab === 'benchmark' && (
          <div className="space-y-8">
            
            {/* Header Description Dashboard */}
            <div className={`p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="space-y-2">
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-3 py-0.5 rounded uppercase font-bold">대규모 병렬 회귀 테스트 엔진</span>
                <h3 className="text-2xl font-black tracking-tight">1,000-Case 회귀성 검정 대시보드 (Split Reporting)</h3>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  멀티어댑터 무결성 보증을 시험합니다. 본사 규정집에 탑재된 대규모 독립 광고안 시안을 다스레드 병렬 실행 스레드로 호출해 분석하고 개별 보고서 분할 가습구조를 생성합니다.
                </p>
              </div>

              <button
                id="run_benchmark_btn"
                onClick={triggerBenchmark}
                disabled={benchmarkRunning}
                className="py-3 px-6 rounded-xl bg-indigo-600 text-slate-100 font-bold hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 self-stretch md:self-auto text-center justify-center text-xs"
              >
                {benchmarkRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>배치 병렬 스레드 가동중...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-100" />
                    <span>1,000-Case 회귀 심사 개시</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick stats grid scoreboard */}
            {benchmarkStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">합격 성공률 (Passing Rate)</span>
                  <span className="text-2xl font-black text-emerald-400">{Math.round((benchmarkStats.passed / benchmarkStats.total) * 100)}%</span>
                  <span className="block text-[9px] text-slate-500 mt-1">감점 80점 이상 기준</span>
                </div>
                <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">합격 건수 (Passed)</span>
                  <span className="text-2xl font-black text-slate-200">{benchmarkStats.passed} / {benchmarkStats.total}</span>
                  <span className="block text-[9px] text-slate-500 mt-1">위반 배제 무결 복수</span>
                </div>
                <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">반려 벌점 건수 (Rejected)</span>
                  <span className="text-2xl font-black text-rose-400">{benchmarkStats.failed}</span>
                  <span className="block text-[9px] text-slate-500 mt-1">벌점누적 강제 제한 건</span>
                </div>
                <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">평균 분석 지연속도 (Latency)</span>
                  <span className="text-2xl font-black text-indigo-400">{benchmarkStats.averageLatency} ms</span>
                  <span className="block text-[9px] text-slate-500 mt-1">Multi-Threading Concurrency</span>
                </div>
              </div>
            )}

            {/* Folder Structure mapping simulation display */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950/70 border-slate-850' : 'bg-slate-100 border-slate-250'}`}>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h4 className="font-extrabold text-xs">수행 로그 리포트 디렉토리 파티셔닝 구조 (물리 아카이빙)</h4>
              </div>
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-[11px] font-mono whitespace-pre text-slate-400 leading-relaxed overflow-x-auto">
                {`app_workspace/docs/benchmark/
├── README.md                          # 종합 통계 및 총점 대시보드 리포팅 마크다운 파일 (${benchmarkStats ? '🟢 실시간 생성 완료' : '대기'})
├── test_runs.json                     # 정량 평가 데이터 통합 원본 파일 (${benchmarkStats ? '🟢 실시간 연동 완료' : '대기'})
└── cases/                             # 개별 시안 테스트 케이스 상세 결과 분기 적재
    ├── case_0001.md                   # ${benchmarkCases[0]?.status === 'success' ? '🟢 생성완료 (건강식품)' : '대기'}
    ├── case_0002.md                   # ${benchmarkCases[1]?.status === 'success' ? '🟢 생성완료 (코스메틱)' : '대기'}
    ├── case_0003.md                   # ${benchmarkCases[2]?.status === 'success' ? '🟢 생성완료 (유기농 토마토)' : '대기'}
    ...
    └── case_0010.md                   # ${benchmarkCases[9]?.status === 'success' ? '🟢 생성완료 (일상의 부드러운 수분)' : '대기'}`}
              </div>
            </div>

            {/* Benchmark ledger list cases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benchmarkCases.map((bc) => (
                <div key={bc.id} className={`p-5 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{bc.id}</span>
                      <div className="flex items-center gap-1.5">
                        {bc.status === 'pending' && <span className="text-[10px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded">분석 대기</span>}
                        {bc.status === 'running' && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded animate-pulse">심사 엔진 가동</span>}
                        {bc.status === 'success' && (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${bc.result && bc.result.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {bc.result && bc.result.score >= 80 ? '🟢 합격' : '🔴 반려'}
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-200 mb-1">{bc.name}</h4>
                    <p className="text-[11px] text-slate-400 italic line-clamp-2 leading-tight mb-4">&quot;{bc.inputText}&quot;</p>
                  </div>

                  {bc.result && (
                    <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-500">
                      <span>최종벌점 적용치: <strong className="text-slate-300 font-extrabold">{bc.result.score}점</strong></span>
                      <span>위반 건수: <strong className="text-rose-400 font-black">{bc.result.violationsCount}건</strong></span>
                      <span>지연속도: <strong className="text-indigo-400">{bc.result.timeMs}ms</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 3: KNOWLEDGE TIMELINE */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            
            <div className={`p-6 rounded-3xl border flex justify-between items-center ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="space-y-1">
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-3 py-0.5 rounded uppercase font-bold">자가 발전 로컬 기억 뇌세포</span>
                <h3 className="text-2xl font-black tracking-tight"> RAG 지식 축적형 자가 학습 루프 (Self-Learning Loop)</h3>
                <p className="text-xs text-slate-400 max-w-xl">
                  심사를 통과하거나 최종 기각된 실시간 데이터는 소멸되지 않고 `history_collection`에 비동기 복제되어, 다음 심사 요청 시 2-Shot 퓨샷 컨텍스트로 임베딩 공간에 우선 매핑됩니다.
                </p>
              </div>

              <button
                id="clear_ledger_btn"
                onClick={clearHistoryLedger}
                className="py-2.5 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>데이터 초기화</span>
              </button>
            </div>

            {/* Time line list views */}
            {historyItems.length === 0 ? (
              <div className="p-12 border border-dashed rounded-3xl text-center text-slate-500 text-xs">
                저장된 자가 학습용 사례 데이터가 아직 없습니다. 최초 실시간 광고안 탐색을 마치는 즉시 기억 소자 노드가 누적됩니다.
              </div>
            ) : (
              <div className="relative border-l-2 border-indigo-500/30 pl-6 ml-4 space-y-8 py-2">
                {historyItems.map((item, idx) => (
                  <div key={item.id || idx} className="relative">
                    
                    {/* Time indicator point */}
                    <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#0b0f19] bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold" />
                    
                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm'} transition-colors`}>
                      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                        <div className="space-x-1.5">
                          <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded font-mono font-bold uppercase">{item.meta?.productType || '일반 광고'}</span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{item.meta?.regulatoryDomain || '기본 표시법'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-slate-500 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                          <span className={`px-2 py-0.5 rounded font-extrabold ${item.score >= 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {item.score >= 80 ? '🟢 승인 승합' : '🔴 적발 반려'}
                          </span>
                        </div>
                      </div>

                      <strong className="block text-xs font-bold text-slate-350 mb-1.5">제출 원안:</strong>
                      <p className="text-xs text-slate-400 italic mb-3 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-900">&quot;{item.inputText}&quot;</p>
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>종합 점수: <strong className="text-slate-300">{item.score}점</strong></span>
                        <span>사용 기기 어댑터: <strong className="text-slate-300">Gemini Native Adaptor</strong></span>
                        <span className="text-[10px] text-indigo-400 font-bold">2-Shot Grounding Node #{(historyItems.length - idx).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Humble Footer */}
      <footer className="py-12 border-t border-slate-800/40 text-center text-xs text-slate-500 space-y-1">
        <p>안심심 (AnSimSim) AI Compliance review Platform Suite &copy; 2026. All rights legalities reserved.</p>
        <p className="text-[10.5px]">Powered by Gemini 3.5 Flash Model Core Adaptor with Autonomous Hybrid RAG Scanners.</p>
      </footer>
    </div>
  );
}
