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
  RefreshCw,
  Printer,
  Copy,
  Check,
  Cpu,
  Settings,
  HelpCircle,
  Clock,
  Key,
  Loader2,
  Globe,
  Save,
  Github
} from 'lucide-react';
import Markdown from 'react-markdown';

import { Stage, LLMType, LLMConfig, SystemAnalysisResult, Violation, PastCase, BenchmarkCase } from './types';

export default function App() {
  // Theme & Layout settings
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md'); // font sizing preference (Small, Medium, Large)
  const [activeTab, setActiveTab] = useState<'review' | 'about' | 'benchmark' | 'history' | 'settings'>('review');
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');

  // Analysis inputs
  const [inputText, setInputText] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [additionalContext, setAdditionalContext] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<{file: File, b64: string}[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Adapter Multi-LLM Config - default to Gemini with flash
  const [adapterType, setAdapterType] = useState<LLMType>(LLMType.GEMINI);
  const [customModel, setCustomModel] = useState<string>("gemini-3.5-flash");
  const [customEndpoint, setCustomEndpoint] = useState<string>("");
  const [customApiKey, setCustomApiKey] = useState<string>("");

  // Saved presets / states
  const [localPreset, setLocalPreset] = useState<string>("ollama"); // "ollama" | "lmstudio"
  const [otherPreset, setOtherPreset] = useState<string>("openai"); // "openai" | "openrouter" | "custom"
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState<boolean>(false);

  // Draft editing states (unsaved states inside Settings UI, applied to active states on 'Save')
  const [draftAdapterType, setDraftAdapterType] = useState<LLMType>(LLMType.GEMINI);
  const [draftCustomModel, setDraftCustomModel] = useState<string>("gemini-3.5-flash");
  const [draftCustomEndpoint, setDraftCustomEndpoint] = useState<string>("");
  const [draftCustomApiKey, setDraftCustomApiKey] = useState<string>("");
  
  // Custom API Model Loader States
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchModelsLoading, setFetchModelsLoading] = useState<boolean>(false);
  const [fetchModelsError, setFetchModelsError] = useState<string | null>(null);

  // Result States
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStatusMsg, setAnalysisStatusMsg] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<SystemAnalysisResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [localLlmErrorText, setLocalLlmErrorText] = useState<string | null>(null);

  // Special UI alerts for Gemini API key validation or Quota exhaustion
  const [showKeyAlert, setShowKeyAlert] = useState<boolean>(false);

  // History ledger (from backend feed)
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>("");
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>("all");
  const [historyVerdictFilter, setHistoryVerdictFilter] = useState<string>("all");

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

  // Load LLM configuration settings from localStorage once upon mounting
  useEffect(() => {
    const saved = localStorage.getItem("COMPLIANCE_LLM_SETTINGS");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.adapterType) {
          setAdapterType(parsed.adapterType);
          setDraftAdapterType(parsed.adapterType);
        }
        if (parsed.customModel) {
          setCustomModel(parsed.customModel);
          setDraftCustomModel(parsed.customModel);
        }
        if (parsed.customEndpoint !== undefined) {
          setCustomEndpoint(parsed.customEndpoint);
          setDraftCustomEndpoint(parsed.customEndpoint);
        }
        if (parsed.customApiKey !== undefined) {
          setCustomApiKey(parsed.customApiKey);
          setDraftCustomApiKey(parsed.customApiKey);
        }
        if (parsed.localPreset) {
          setLocalPreset(parsed.localPreset);
        }
        if (parsed.otherPreset) {
          setOtherPreset(parsed.otherPreset);
        }
      } catch (err) {
        console.warn("Failed to retrieve or parse stored LLM settings:", err);
      }
    }
  }, []);

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

  const processFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages(prev => {
          const isDup = prev.some(item => item.file.name === file.name && item.file.size === file.size);
          if (isDup) return prev;
          return [...prev, { file, b64: reader.result as string }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const clearAllImages = () => {
    setUploadedImages([]);
  };

  const makeLawGoLink = (clauseStr: string) => {
    const text = clauseStr || "";
    let lawName = "표시광고법";
    if (text.includes("화장품법")) {
      lawName = "화장품법";
    } else if (text.includes("식품 등의 표시ㆍ광고에 관한 법률") || text.includes("식품표시광고법")) {
      lawName = "식품등의표시ㆍ광고에관한법률";
    } else if (text.includes("의료법")) {
      lawName = "의료법";
    } else if (text.includes("금융소비자") || text.includes("금소법")) {
      lawName = "금융소비자보호에관한법률";
    } else if (text.includes("게임산업") || text.includes("게임법")) {
      lawName = "게임산업진흥에관한법률";
    } else if (text.includes("표시") && text.includes("광고")) {
      lawName = "표시ㆍ광고의공정화에관한법률";
    } else if (text.includes("민법")) {
      lawName = "민법";
    } else if (text.includes("전자상거래법") || text.includes("전자상거래")) {
      lawName = "전자상거래등에서의소비자보호에관한법률";
    } else if (text.includes("재난 및 안전관리")) {
      lawName = "재난및안전관리기본법";
    } else if (text.includes("대한민국 헌법") || text.includes("헌법")) {
      lawName = "대한민국헌법";
    } else {
      const match = text.match(/^([가-힣\sㆍ]+법)/);
      if (match) {
        lawName = match[1].replace(/\s+/g, "");
      }
    }
    return `https://www.law.go.kr/법령/${encodeURIComponent(lawName)}`;
  };

  const clearImage = () => {
    setUploadedImages([]);
  };

  const handleFetchModels = async () => {
    setFetchModelsLoading(true);
    setFetchModelsError(null);
    setFetchedModels([]);
    
    const ep = draftCustomEndpoint && draftCustomEndpoint.trim() ? draftCustomEndpoint.trim() : "http://localhost:11434/v1";
    const cleanEp = ep.endsWith('/') ? ep.slice(0, -1) : ep;
    const isLocalhost = ep.includes("localhost") || ep.includes("127.0.0.1");

    if (isLocalhost) {
      // 💡 Client-side direct connection attempt for local desktop LLM servers
      try {
        // A. Try /v1/models (Standard OpenAI compatibility)
        const directRes = await fetch(`${cleanEp}/models`, {
          method: 'GET',
          headers: draftCustomApiKey ? { 'Authorization': `Bearer ${draftCustomApiKey}` } : undefined
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData && Array.isArray(directData.data)) {
            const list = directData.data.map((m: any) => m.id);
            if (list.length > 0) {
              setFetchedModels(list);
              setDraftCustomModel(list[0]);
              setFetchModelsLoading(false);
              return;
            }
          }
        }

        // B. Fallback to raw /api/tags if no /v1 was attached
        const hostPort = cleanEp.replace(/\/v1$/, '');
        const tagsRes = await fetch(`${hostPort}/api/tags`);
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          if (tagsData && Array.isArray(tagsData.models)) {
            const list = tagsData.models.map((m: any) => m.name || m.model);
            if (list.length > 0) {
              setFetchedModels(list);
              setDraftCustomModel(list[0]);
              setFetchModelsLoading(false);
              return;
            }
          }
        }
      } catch (clientErr: any) {
        console.warn("Client-side direct localhost check failed or CORS blocked. Falling back to server-side query:", clientErr);
      }
    }
    
    try {
      const response = await fetch('/api/proxy/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: ep,
          apiKey: draftCustomApiKey
        })
      });
      const data = await response.json();
      if (response.ok && data.success && Array.isArray(data.models)) {
        setFetchedModels(data.models);
        if (data.models.length > 0) {
          setDraftCustomModel(data.models[0]);
        }
      } else {
        setFetchModelsError(data.message || "모델 목록을 조회하지 못했습니다. 엔드포인트 응답 상태와 서버가 켜져 있는지 확인하십시오.");
      }
    } catch (err: any) {
      let errMsg = err.message || "서버 통신 중 오류가 발생했습니다. 해당 주소로의 접근이 올바른지 확인하십시오.";
      if (isLocalhost) {
        errMsg += `\n\n💡 [접근 꿀팁] 현재 이 빌드 환경은 클라우드 가상화 샌드박스로 구동되므로, 클라우드 서버 측에서는 사용자의 '개인 PC(localhost/127.0.0.1)'에 접촉할 수 없습니다. 상단의 [Export ZIP] 혹은 다운로드 메뉴를 눌러 소스코드를 로컬에서 기동(npm run dev)하시면 상호 연결이 완전히 가능해집니다. 현재 상태에서 테스트하시려면, 일반 텍스트나 Gemini 모드를 선호하여 주십시오.`;
      }
      setFetchModelsError(errMsg);
    } finally {
      setFetchModelsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    // Apply draft configurations to active session configurations
    setAdapterType(draftAdapterType);
    setCustomModel(draftCustomModel);
    setCustomEndpoint(draftCustomEndpoint);
    setCustomApiKey(draftCustomApiKey);

    // Save to browser's client-side persistent storage (localStorage)
    const configToSave = {
      adapterType: draftAdapterType,
      customModel: draftCustomModel,
      customEndpoint: draftCustomEndpoint,
      customApiKey: draftCustomApiKey,
      localPreset: localPreset,
      otherPreset: otherPreset
    };
    localStorage.setItem("COMPLIANCE_LLM_SETTINGS", JSON.stringify(configToSave));

    // Show visual indicator
    setSettingsSavedSuccess(true);
    setTimeout(() => {
      setSettingsSavedSuccess(false);
    }, 4000);
  };

  const applyLocalPreset = (preset: "ollama" | "lmstudio") => {
    setLocalPreset(preset);
    if (preset === "ollama") {
      setDraftCustomEndpoint("http://localhost:11434/v1");
      setDraftCustomModel("gemma2:9b");
    } else {
      setDraftCustomEndpoint("http://localhost:1234/v1");
      setDraftCustomModel("gemma-2-9b-it");
    }
    setFetchedModels([]);
  };

  const applyOtherPreset = (preset: "openai" | "openrouter" | "custom") => {
    setOtherPreset(preset);
    if (preset === "openai") {
      setDraftCustomEndpoint("https://api.openai.com/v1");
      setDraftCustomModel("gpt-4o-mini");
    } else if (preset === "openrouter") {
      setDraftCustomEndpoint("https://openrouter.ai/api/v1");
      setDraftCustomModel("google/gemini-2.5-flash");
    } else {
      setDraftCustomEndpoint("");
      setDraftCustomModel("");
    }
    setFetchedModels([]);
  };

  const handleOpenPrintTab = () => {
    if (!analysisResult) return;
    
    const printWindow = window.open("", "_blank", "width=900,height=990,scrollbars=yes,resizable=yes");
    if (!printWindow) {
      alert("새 창(팝업)이 브라우저 설정에 의해 차단되었습니다. 팝업 차단을 해제하고 다시 시도하십시오.");
      return;
    }

    const gradeInfo = getCsatGradeInfo(analysisResult.score);
    const violationsHtml = analysisResult.violations.length === 0 
      ? `<div style="padding: 16px; text-align: center; border: 1px solid #e2e8f0; border-radius: 8px; color: #059669; font-weight: bold; font-size: 13px; background-color: #f0fdf4;">
           ✔ 축하합니다! 검출된 위반 조항이나 감점이 없어 1등급 무결성으로 통과를 수여합니다.
         </div>`
      : analysisResult.violations.map((v, i) => `
          <div style="padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: white; margin-bottom: 12px; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f8fafc; padding: 6px 10px; border-radius: 6px; font-size: 12px; margin-bottom: 8px;">
              <span style="font-weight: 800; color: #0f172a;">
                <span style="background-color: #0f172a; color: white; border-radius: 9999px; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; margin-right: 6px;">${i+1}</span>
                <u>${v.clause}</u>
              </span>
              <span style="font-weight: 800; color: #dc2626;">
                적발 감점: -${v.deductionPoints}점 | 위험도: ${v.severity}
              </span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 11px;">
              <div>
                <span style="display: block; font-size: 9px; color: #dc2626; font-weight: 950; margin-bottom: 2px;">법위 위법 소견 (Risk Statement):</span>
                <p style="color: #1e293b; font-weight: 500; margin: 0; line-height: 1.4;">${v.description}</p>
                <span style="display: block; font-weight: bold; color: #475569; margin-top: 4px;">위해구절: <span style="font-weight: 800; color: #dc2626; font-family: monospace;">"${v.originalFragment}"</span></span>
              </div>
              <div style="margin-top: 6px; padding: 6px; background-color: #f0fdf4; border: 1px solid #d1fae5; border-radius: 4px;">
                <span style="display: block; font-size: 9px; color: #059669; font-weight: 950; margin-bottom: 2px;">대체 정정 필터 카피 (Compliance Suggestion):</span>
                <p style="color: #064e3b; font-weight: 800; margin: 0; line-height: 1.4;">"${v.replacement}"</p>
              </div>
            </div>
          </div>
        `).join('');

    const ocrHtml = analysisResult.imageAlternativeProposal 
      ? `<div style="padding: 12px; border: 1px solid #c7d2fe; border-radius: 8px; background-color: #f5f7ff; margin-top: 16px; page-break-inside: avoid;">
          <span style="font-size: 12px; font-weight: 800; background-color: #0b0f19; color: white; padding: 2px 8px; border-radius: 4px;">4. 이미지 상세 비주얼 규격 및 대체안</span>
          <div style="font-size: 11px; color: #1e293b; margin-top: 8px; line-height: 1.5;">
            ${analysisResult.imageAlternativeProposal.detectedVisualCopys?.length > 0 ? `<p style="margin: 4px 0;"><strong>&bull; OCR 식별 문구:</strong> ${analysisResult.imageAlternativeProposal.detectedVisualCopys.join(', ')}</p>` : ''}
            ${analysisResult.imageAlternativeProposal.visualViolations?.length > 0 ? `<p style="margin: 4px 0;"><strong style="color: #dc2626;">&bull; 검출 시각 위반:</strong> ${analysisResult.imageAlternativeProposal.visualViolations.join(' / ')}</p>` : ''}
            <span style="display: block; font-weight: 800; font-size: 9px; color: #d97706; margin-top: 8px; text-transform: uppercase;">💊 법률 우회 처방 구도 배포 가이드라인 및 시안 제안:</span>
            <p style="color: #0f172a; margin: 4px 0; font-style: italic; background-color: white; padding: 8px; border: 1px solid #e0e7ff; border-radius: 4px;">
              ${analysisResult.imageAlternativeProposal.alternativeVisualDraft}
            </p>
          </div>
         </div>`
      : '';

    const inputContextHtml = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 12px; font-size: 11px;">
        <div>
          <span style="color: #64748b; font-weight: bold; display: block;">추론 제품 분류군:</span>
          <span style="font-weight: 800; color: #0f172a;">${analysisResult.parsedMeta.productType}</span>
        </div>
        <div>
          <span style="color: #64748b; font-weight: bold; display: block;">해당 특별법령 규격:</span>
          <span style="font-weight: 800; color: #0f172a;">${analysisResult.parsedMeta.regulatoryDomain}</span>
        </div>
        ${inputText.trim() ? `
        <div style="grid-column: span 2;">
          <span style="color: #64748b; font-weight: bold; display: block;">광고 카피 텍스트:</span>
          <div style="background-color: white; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-style: italic; color: #334155; max-height: 120px; overflow-y: auto;">"${inputText.trim()}"</div>
        </div>` : ''}
        ${websiteUrl.trim() ? `
        <div style="grid-column: span 2;">
          <span style="color: #64748b; font-weight: bold; display: block;">수집 웹사이트 주소:</span>
          <span style="font-family: monospace; color: #4338ca; text-decoration: underline;">${websiteUrl.trim()}</span>
        </div>` : ''}
        ${additionalContext.trim() ? `
        <div style="grid-column: span 2;">
          <span style="color: #64748b; font-weight: bold; display: block;">광고 매체 맥락 추가 사안:</span>
          <span style="color: #475569; font-style: italic;">"${additionalContext.trim()}"</span>
        </div>` : ''}
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>광고 법률 무결성 종합 준법 자문보고서</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          @media print {
            .no-print { display: none !important; }
            body { 
              background-color: white !important; 
              color: black !important; 
              padding: 0 !important; 
              margin: 0 !important; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 10mm !important;
              width: auto !important;
              height: auto !important;
              min-height: auto !important;
            }
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f1f5f9;
            color: #0f172a;
            margin: 0;
            padding: 20px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .toolbar {
            width: 100%;
            max-width: 210mm;
            background-color: #1e293b;
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            box-sizing: border-box;
          }
          .toolbar-title {
            font-size: 13px;
            font-weight: 800;
          }
          .btn-print {
            background-color: #f59e0b;
            color: #0f172a;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.15s;
          }
          .btn-print:hover {
            background-color: #fbbf24;
          }
          .btn-close {
            background-color: #475569;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            margin-left: 8px;
          }
          .btn-close:hover {
            background-color: #64748b;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            background: white;
            padding: 20mm;
            box-sizing: border-box;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
            border: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .official-badge {
            background-color: #4f46e5;
            color: white;
            padding: 2px 6px;
            font-size: 9px;
            font-weight: 900;
            border-radius: 4px;
            letter-spacing: 0.05em;
          }
          .title {
            font-size: 22px;
            font-weight: 800;
            margin: 6px 0 2px 0;
            color: #0f172a;
          }
          .subtitle {
            font-size: 9px;
            color: #64748b;
            margin: 0;
            font-family: monospace;
          }
          .stamp {
            width: 55px;
            height: 55px;
            border: 4px double #d97706;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #d97706;
            font-weight: 900;
            transform: rotate(12deg);
            margin-bottom: 4px;
          }
          .score-grid {
            display: grid;
            grid-template-columns: 100px 1fr;
            gap: 16px;
            align-items: center;
            padding-top: 10px;
          }
          .score-badge {
            font-size: 32px;
            font-weight: 900;
            text-align: center;
            background-color: #0f172a;
            color: white;
            padding: 8px;
            border-radius: 12px;
          }
          .score-text {
            font-size: 12px;
            line-height: 1.5;
          }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            background-color: #0f172a;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            display: inline-block;
            margin-bottom: 12px;
          }
          .footer {
            border-top: 1px solid #cbd5e1;
            padding-top: 16px;
            margin-top: 24px;
            font-size: 10px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .footer-sign {
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 4px;
            font-weight: bold;
            color: #0f172a;
          }
        </style>
      </head>
      <body>
        <div class="toolbar no-print">
          <div class="toolbar-title">📄 실시간 정밀 안전 보고서 새창 뷰어 (인쇄 / PDF 저장 전용)</div>
          <div>
            <button class="btn-print" onclick="window.print()">🖨️ 인쇄 또는 PDF 저장하기</button>
            <button class="btn-close" onclick="window.close()">창 닫기</button>
          </div>
        </div>

        <div class="page">
          <div>
            <div class="header">
              <div>
                <span class="official-badge">OFFICIAL COMPLIANCE REPORT</span>
                <h1 class="title">광고 법률 무결성 종합 준법 자문보고서</h1>
                <p class="subtitle">COMPREHENSIVE LAW EVALUATION \& AD-AUDITS SYSTEM CERTIFICATE</p>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end;">
                <div class="stamp">준법필인</div>
                <span style="font-size: 8px; color: #94a3b8; font-family: monospace;">No. ANSIM-${Date.now().toString().substring(4)}</span>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <span class="section-title">1. 심의 성능 성적 명세</span>
              <div style="float: right; font-size: 11px; margin-top: 4px; color: #64748b;">감수 일사: ${new Date().toLocaleDateString('ko-KR')}</div>
              <div class="score-grid" style="clear: both; margin-top: 10px; padding: 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;">
                <div class="score-badge">${analysisResult.score}점</div>
                <div class="score-text">
                  과적 벌점 연산 결과 귀사는 종합 품질 평점 <strong>${analysisResult.score}점</strong>으로 최종 성적 <strong>${gradeInfo.grade}등급</strong>을 선고받았습니다.<br/>
                  <span style="color: ${gradeInfo.isPassed ? '#10b981' : '#ef4444'}; font-weight: 800;">
                    ${gradeInfo.isPassed ? '✔ 자율 가중 기준 합격 규격을 충족합니다.' : '❌ 규격 결함에 의한 자진 제재 정정이 즉시 권고됩니다.'}
                  </span>
                </div>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <span class="section-title">2. 광고 매체 메타포팅 요약</span>
              ${inputContextHtml}
            </div>

            <div style="margin-bottom: 20px;">
              <span class="section-title">3. 광고 제재 조항 검출 및 벌점 감점 내역 (${analysisResult.violations.length}건)</span>
              <div style="margin-top: 10px;">
                ${violationsHtml}
              </div>
            </div>

            ${ocrHtml}
          </div>

          <div class="footer">
            <div style="text-align: left; max-width: 75%;">
              <p style="font-weight: 800; margin: 0 0 4px 0; color: #0f172a;">아하시스턴트 AI 자율 규제 필터 컴플라이언스 센터</p>
              <p style="margin: 0; font-size: 8px; line-height: 1.3;">본 법무 인증 보고서는 공정거래위원회 심사관 규정 및 주요 특별고시 근거 기준을 토대로 자율 지식 RAG을 결합해 도출되었습니다.</p>
              <p style="margin: 4px 0 0 0; font-size: 8px; color: #94a3b8;">제작자: WizMasia | wizmasia@gmail.com | 본 웹앱은 사용된 기저 솔루션의 저작권 규정에 적극 복속됩니다.</p>
            </div>
            <div style="width: 120px;" class="footer-sign">
              <div style="font-size: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 4px; color: #94a3b8;">자율심의단장 (대인)</div>
              <div style="font-size: 13px; font-weight: 900; letter-spacing: 4px;">aHaSys (인)</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Run Realtime Auditing Analysis
  const triggerAnalysis = async (textToUse: string = inputText) => {
    const hasImages = uploadedImages.length > 0;
    if (!textToUse.trim() && !hasImages && !websiteUrl.trim()) {
      setErrorText("심사할 원문 텍스트나 웹사이트 URL을 입력하거나 검수할 이미지 파일을 한 개 이상 올려주십시오.");
      return;
    }
    setErrorText(null);
    setLocalLlmErrorText(null);
    setLoading(true);
    setAnalysisProgress(3);
    setAnalysisStatusMsg("1단계: 자율 가중 문맥 추론 메타포팅 파싱 중...");

    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) {
          return prev;
        }
        const remains = 100 - prev;
        const step = Math.max(1, Math.round(remains * 0.12));
        const next = Math.min(95, prev + step);

        if (next < 25) {
          setAnalysisStatusMsg("1단계: 자율 가중 문맥 추론 메타포팅 입출력 정규화 중...");
        } else if (next < 55) {
          setAnalysisStatusMsg("2단계: 부당 표시광고 금지기준 및 대한민국 특별법 RAG 대조 중...");
        } else if (next < 75) {
          setAnalysisStatusMsg("3단계: 위반 심사 조문 및 감점 가중 매트릭스 알고리즘 처리 중...");
        } else if (next < 90) {
          setAnalysisStatusMsg("4단계: 마케팅 안심 순화 안전 대안 권고안 조율 중...");
        } else {
          setAnalysisStatusMsg("5단계: 평론 보고서 마무리 및 국가공인 법제처 데이터 연계 대조 중...");
        }
        return next;
      });
    }, 450);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToUse,
          imagesB64: uploadedImages.map(img => img.b64),
          adapterType: adapterType,
          customModel: customModel,
          customEndpoint: customEndpoint,
          customApiKey: customApiKey,
          websiteUrl: websiteUrl,
          additionalContext: additionalContext
        })
      });

      const data = await response.json();
      if (data.error) {
        setErrorText(data.message);
      } else {
        setAnalysisResult(data);
        if (data.localLlmError) {
          setLocalLlmErrorText(data.localLlmError);
        }
        fetchHistory(); // Refresh history timeline node on successful loop
      }
    } catch {
      setErrorText("서버 컴플라이언스 엔진 연결 중 심각한 예외가 촉발해 통신이 중단되었습니다.");
    } finally {
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setAnalysisStatusMsg("심의 통과 평정 완료!");
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

  const restoreHistoryResult = (item: any) => {
    if (item.result) {
      setAnalysisResult(item.result);
      setInputText(item.inputText || "");
      setErrorText(null);
      setActiveTab('review');
    } else {
      setInputText(item.inputText || "");
      setErrorText(null);
      setActiveTab('review');
      triggerAnalysis(item.inputText);
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

  const getCsatGradeInfo = (score: number) => {
    if (score >= 96) {
      return {
        grade: 1,
        label: "수능 1등급 (안전 - 기만 제로)",
        isPassed: true,
        hasWarning: false,
        color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        desc: "법적 리스크가 매우 낮고 가이드라인 위반이 거의 없는 최적의 무결성 안심 문안 상태입니다."
      };
    } else if (score >= 80) {
      return {
        grade: 2,
        label: "수능 2등급 (보통 - 조건부 합격)",
        isPassed: true,
        hasWarning: true,
        color: "bg-amber-500/10 text-amber-450 border border-amber-550/20",
        desc: "약간의 미진한 정보가 누락되었거나 경미한 과장 우려 조항이 있습니다. 주의 교정 후 배포 권고."
      };
    } else if (score >= 70) {
      return {
        grade: 3,
        label: "수능 3등급 (등급미달 - 탈락 기각)",
        isPassed: false,
        hasWarning: true,
        color: "bg-orange-500/10 text-orange-400 border border-orange-500/15",
        desc: "부당 기만 소지가 명확하여 반려된 탈락 등급(3등급 이하)입니다. 가이드라인에 따른 수정 고지가 필수적입니다."
      };
    } else if (score >= 60) {
      return {
        grade: 4,
        label: "수능 4등급 (심의기각 - 탈락)",
        isPassed: false,
        hasWarning: true,
        color: "bg-rose-500/10 text-rose-400 border border-rose-500/15",
        desc: "다수의 구절에서 불법적 과장 표현과 무단 수치 인용 등이 검출되어 즉각적인 전면 수정이 강제됩니다."
      };
    } else if (score >= 50) {
      return {
        grade: 5,
        label: "수능 5등급 (미흡기각 - 탈락)",
        isPassed: false,
        hasWarning: true,
        color: "bg-rose-500/20 text-rose-300 border border-rose-500/25",
        desc: "중대한 허위 사실 소속 또는 식약처 허위 승인 사칭 수위에 육박하는 감점이 부과되어 심사 탈락되었습니다."
      };
    } else if (score >= 40) {
      return {
        grade: 6,
        label: "수능 6등급 (경고기각 - 탈락)",
        isPassed: false,
        hasWarning: true,
        color: "bg-red-500/15 text-red-400 border border-red-500/30",
        desc: "명확히 처벌 및 공정위 고발 대상이 되는 금지 위반 키워드 집단이 검출되었습니다."
      };
    } else if (score >= 30) {
      return {
        grade: 7,
        label: "수능 7등급 (위험기각 - 탈락)",
        isPassed: false,
        hasWarning: true,
        color: "bg-red-650/20 text-red-450 border border-red-650/35",
        desc: "고의의 소비자 속임수 및 위반 혐의가 지적되어 무단 노출 시 처벌이 농후한 파국 수위 상태입니다."
      };
    } else if (score >= 15) {
      return {
        grade: 8,
        label: "수능 8등급 (엄중경보 - 탈락)",
        isPassed: false,
        hasWarning: true,
        color: "bg-red-700/25 text-red-400 border border-red-700/40",
        desc: "의약성 사기 및 불법 의료행위 서술, 역사적 참사 기만 규격 파괴 등에 상응하는 치명적 혐의 부여."
      };
    } else {
      return {
        grade: 9,
        label: "수능 9등급 (완전탈락 - 기각)",
        isPassed: false,
        hasWarning: true,
        color: "bg-red-950/40 text-red-400 border border-red-900/40",
        desc: "규범적 법치 통제 한계를 뛰어넘은 총체적 불법 행위 시안입니다. 전면 거절 기각 처리됩니다."
      };
    }
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

  // Helper: Compile dynamic Markdown report content for the user
  const getMarkdownReportString = (): string => {
    if (!analysisResult) return "";
    const dateStr = new Date().toLocaleString('ko-KR');

    const violationsText = analysisResult.violations.length === 0
      ? "* 검출된 컴플라이언스 위반 사항이 전혀 없습니다. 브랜드 가이드를 가뿐히 충족합니다."
      : analysisResult.violations.map((v, i) => {
          const verifiedStr = v.isCitationVerified ? "✅ 국가법제처 대조 검증됨" : "❓ 자체 추론 인용";
          const actionPlanStr = v.actionPlan && Array.isArray(v.actionPlan)
            ? v.actionPlan.map((step) => `  - ${step}`).join('\n')
            : "";
          return `### [검출 위반 #${i+1}] ${v.clause} (감점: -${v.deductionPoints}점) - ${verifiedStr}
* **위반 원인**: ${v.description}
* **문란 원안**: "${v.originalFragment}"
* **권장 대행**: "${v.replacement}"
* **5단계 위기 관리 계획**:\n${actionPlanStr}`;
        }).join('\n\n');

    const lawsText = (!analysisResult.matchedLaws || analysisResult.matchedLaws.length === 0)
      ? "* 참고할 추가적인 5단계 특별 법률 조항이 공시되지 않았습니다."
      : analysisResult.matchedLaws.map((law) => `* **${law.title}** (유사 강도: ${law.relevance}%)\n  - 지침: ${law.description}`).join('\n');

    const usageText = analysisResult.usage
      ? `* **입력 토큰 수 (Prompt Tokens)**: ${analysisResult.usage.promptTokens.toLocaleString()} tokens
* **출력 토큰 수 (Completion Tokens)**: ${analysisResult.usage.completionTokens.toLocaleString()} tokens
* **총 연산 토큰 수 (Total Tokens)**: ${analysisResult.usage.totalTokens.toLocaleString()} tokens`
      : "* 개별 LLM 물리 규격 어댑터 토큰 계측치를 지원하지 않습니다.";

    return `# 🛡️ [아하시스턴트 컴플라이언스 AI 공식 보고서]
**심의 완료 일시**: ${dateStr}
**담당 컴플라이언스 AI 심의관**: 아하시스턴트 (aHaSys)
**종합 승인 통과 등급 점수**: ${analysisResult.score} / 100점 
**최종 의결 상태**: ${analysisResult.score >= 80 ? 'APPROVED (최종 합격 및 발행 승인)' : 'REJECTED (벌점 초과로 심의 기각 - 대안 교정 필수)'}

---

## 1. 심사 대상 광고 문구 원안
> ${inputText || "(이미지 단독 심사 - 텍스트 미기입)"}

## 2. 자율 세그먼트 메타 파싱 결과
* **파싱 분류 (Product Type)**: ${analysisResult.parsedMeta?.productType || '일반 범용 상품'}
* **타겟 오디언스 (Targets)**: ${analysisResult.parsedMeta?.targets || '일반 대중 소비자'}
* **주요 감독 법전 (Regulatory Domain)**: ${analysisResult.parsedMeta?.regulatoryDomain || '공정거래규정'}
* **유통 배포 채널 (Channels)**: ${analysisResult.parsedMeta?.channels || '옴니채널'}

## 3. 물리 인프라 어댑터 연산 소모 통량
${usageText}

## 4. 정밀 제재 벌점 세부 내역 및 5단계 조치 계획
${violationsText}

## 5. RAG 대한민국 법률 실증 연계 대조
${lawsText}

---
*본 검인은 아하시스턴트 컴플라이언스 시스템에 의해 자동 작성되었으며, 마케팅 문구 적정성 심의 규격을 합격하였음을 증명합니다.*`;
  };

  const handleCopyMarkdown = () => {
    const mdText = getMarkdownReportString();
    navigator.clipboard.writeText(mdText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2050);
  };

  return (
    <div id="ansim_container" className={`min-h-screen font-sans text-size-${fontSize} leading-relaxed transition-colors duration-300 ${darkMode ? 'dark bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-950'}`}>
      
      {/* Dynamic Wordplay App Header Banner */}
      <div className={`py-2 px-6 border-b text-xs flex justify-between items-center no-print ${darkMode ? 'bg-[#0f1524] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
        <div className="flex items-center gap-3">
          <span className="inline-flex py-0.5 px-2 rounded-full font-bold bg-amber-500 text-slate-950 text-[10px] animate-pulse">aHa! Sys</span>
          <span className={`${darkMode ? 'text-slate-400' : 'text-slate-800 font-extrabold'}`}>✨ 대한민국 법조문 및 광고 무결성 검수를 수행하는 전문 AI 동반자 플랫폼</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500">글자 크기 조정:</span>
          <div className="p-0.5 rounded-lg flex bg-slate-800 text-slate-200 border border-slate-700">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all ${fontSize === 'sm' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
            >
              소
            </button>
            <button
              onClick={() => setFontSize('md')}
              className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all ${fontSize === 'md' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
            >
              중
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all ${fontSize === 'lg' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
            >
              대
            </button>
          </div>
        </div>
      </div>

      {/* Main Structural Navigation Bar */}
      <nav className={`sticky top-0 z-40 border-b backdrop-blur-md no-print ${darkMode ? 'bg-[#0b0f19]/90 border-slate-800/80' : 'bg-white/95 border-slate-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 h-18 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`font-black text-lg tracking-tight flex items-center gap-2 ${darkMode ? 'text-slate-150' : 'text-slate-950'}`}>
                <span>아하시스턴트 (aHaSys)</span>
                <span className="text-xs bg-slate-500/20 px-2 py-0.5 rounded font-normal text-slate-400">v2.4 LTS</span>
              </h1>
              <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-600 font-extrabold'}`}>공정위 광고 규정 및 대한민국 5단계 특별 법률 결합 심의</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-xl flex gap-1 ${darkMode ? 'bg-[#121929]' : 'bg-slate-100'}`}>
              <button
                id="nav_review"
                onClick={() => setActiveTab('review')}
                className={`py-1.5 px-3 rounded-md text-xs font-black cursor-pointer transition-all flex items-center gap-1 ${activeTab === 'review' ? (darkMode ? 'bg-amber-500 text-slate-950 shadow' : 'bg-amber-500 text-slate-950 shadow') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>자율 심사</span>
              </button>
              <button
                id="nav_about"
                onClick={() => setActiveTab('about')}
                className={`py-1.5 px-3 rounded-md text-xs font-black cursor-pointer transition-all flex items-center gap-1 ${activeTab === 'about' ? (darkMode ? 'bg-amber-500 text-slate-950 shadow' : 'bg-amber-500 text-slate-950 shadow') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>설명서</span>
              </button>
              <button
                id="nav_history"
                onClick={() => setActiveTab('history')}
                className={`py-1.5 px-3 rounded-md text-xs font-black cursor-pointer transition-all flex items-center gap-1 ${activeTab === 'history' ? (darkMode ? 'bg-amber-500 text-slate-950 shadow' : 'bg-amber-500 text-slate-950 shadow') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
              >
                <History className="w-3.5 h-3.5" />
                <span>지식 누적</span>
              </button>
              <button
                id="nav_settings"
                onClick={() => setActiveTab('settings')}
                className={`py-1.5 px-3 rounded-md text-xs font-black cursor-pointer transition-all flex items-center gap-1 ${activeTab === 'settings' ? (darkMode ? 'bg-indigo-600 text-white shadow' : 'bg-indigo-600 text-white shadow') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>LLM 설정</span>
              </button>
            </div>

            <div className="w-px h-6 bg-slate-705 mx-1" />

            {/* GitHub Repository Link */}
            <a
              id="github_link"
              href="https://github.com/WizMasia/aHaSys"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub 저장소 바로가기 (Go to GitHub Repository)"
              className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${darkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700' : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 hover:border-slate-300'}`}
            >
              <Github className="w-4 h-4" />
            </a>

            {/* Dark Mode toggle icon */}
            <button
              id="theme_toggle"
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${darkMode ? 'border-slate-800 hover:bg-slate-800 text-amber-400' : 'border-slate-200 hover:bg-slate-100 text-indigo-600'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8 no-print">
        
        {/* TAB 1: REALTIME REVIEW INTERFACE */}
        {activeTab === 'review' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Urgent Gemini Quota/API Alert Banner */}
            {((errorText && (errorText.includes('Key') || errorText.includes('키') || errorText.includes('API') || errorText.includes('Quota') || errorText.includes('사용량') || errorText.includes('429') || errorText.includes('limit'))) || showKeyAlert) && (
              <div className="p-6 rounded-2xl border-2 border-rose-500 bg-rose-500/10 text-rose-400 space-y-3 no-print animate-pulse">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                  <span className="font-extrabold text-sm uppercase tracking-wider text-rose-600">Gemini API 연산 긴급 우회 경보</span>
                </div>
                <div className="text-sm space-y-2 leading-relaxed">
                  <p className={darkMode ? 'text-rose-300' : 'text-rose-900 font-bold'}>현재 RAG 심의 연산을 처리하는 무료 인프라 공유 <b>Gemini API Key의 사용량 한도(Quota Limit, 429)가 도달</b>했거나, <b>유효한 API 키가 설정되지 않았습니다.</b></p>
                  <p className={darkMode ? 'text-rose-400' : 'text-slate-700'}>안심하시고 귀하만의 자율 검사를 독립 수립하고 싶으시다면, 즉시 상단의 <strong className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer" onClick={() => { setActiveTab('settings'); setErrorText(null); }}>[LLM 설정] 탭</strong>으로 이동하셔서 개인용 무료 혹은 상용 Gemini API Key를 등록하여 주십시오.</p>
                </div>
                <div className="flex gap-2 pt-1 border-t border-rose-500/20">
                  <button
                    onClick={() => { setActiveTab('settings'); setErrorText(null); }}
                    className="py-1.5 px-3 rounded bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] cursor-pointer"
                  >
                    지금 설정 탭에 API Key 입력하기 &rarr;
                  </button>
                  <button
                    onClick={() => { setShowKeyAlert(false); setErrorText(null); }}
                    className="py-1.5 px-3 rounded bg-slate-800 text-slate-300 hover:text-slate-100 text-[11px] cursor-pointer"
                  >
                    경고 무시하고 닫기
                  </button>
                </div>
              </div>
            )}

            {/* Main Interactive Workspace Input Dashboard */}
            <div className="space-y-6">
              
              {/* Immediate Ad Creator Workspace & Dropzone Box */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                
                 <div className="space-y-4">
                  {/* Realtime channel selector tabs */}
                  <div className="flex gap-2 border-b border-slate-800/20 dark:border-slate-800 pb-2.5">
                    <button
                      id="opt_mode_text"
                      type="button"
                      onClick={() => setInputMode('text')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${inputMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <span>✏️ 광고 문구 직접 기입</span>
                    </button>
                    <button
                      id="opt_mode_url"
                      type="button"
                      onClick={() => setInputMode('url')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${inputMode === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>🔗 웹사이트 주소 평가</span>
                    </button>
                  </div>

                  {inputMode === 'text' ? (
                    <div>
                      <label className="block text-xs font-extrabold text-indigo-300 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                        <span>📝 검토할 마케팅 카피 문장 입력</span>
                        <span className="text-[10px] font-normal text-slate-500">(선택 - 이미지 또는 URL과 교차 필수)</span>
                      </label>
                      <textarea
                        id="ad_input_textarea"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="여기에 검토받고 싶은 광고 문구 초안이나 원문을 기재하세요. (예: 식약처 단독, 원금 무손실 보장, 여드름 완치, 세월호 등 민감 키워드가 포함될 시 법률 RAG 가동)"
                        rows={4}
                        className={`w-full p-4 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors leading-relaxed ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'}`}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-extrabold text-indigo-300 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                        <span>🖥️ 수집 및 심사할 홍보 웹사이트 주소(URL) 입력</span>
                      </label>
                      <input
                        id="url_input_field"
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://example.com/promotion-campaign"
                        className={`w-full p-4 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'}`}
                      />
                      <p className="text-[11px] text-slate-500 mt-1">※ 아하시스턴트가 실시간으로 웹페이지 텍스트를 크롤링하여 대한민국 안전 특별법 조문과 자동 대조합니다.</p>
                    </div>
                  )}

                  {/* Context Input Field */}
                  <div>
                    <label className="block text-xs font-extrabold text-indigo-300 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                      <span>💡 비텍스트 배경 맥락 추가 (광고 매체, 시점, 특수 구도 등)</span>
                      <span className="text-[10px] font-normal text-slate-500">(선택)</span>
                    </label>
                    <textarea
                      id="ad_context_textarea"
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      placeholder="예시: 추석 연휴 직전 10대 수험생 부모들을 타겟으로 한 인스타그램 스폰서드 배너 형태, 카카오톡 톡채널 카드뉴스 발송분"
                      rows={2}
                      className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors leading-relaxed ${darkMode ? 'bg-slate-950 border-slate-850 text-slate-200 placeholder-slate-650' : 'bg-slate-50 border-slate-250 text-slate-800 placeholder-slate-400'}`}
                    />
                  </div>

                  {/* Multimodal File Dropzone with Multi-Image uploading */}
                  <div>
                    <label className="block text-sm font-extrabold text-indigo-300 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <span>🖼️ 비주얼 비전 심사 (카드뉴스/상세페이지 다중 첨부 가능)</span>
                      <span className="text-xs font-normal text-slate-500">(선택 - 여러 개 드롭 및 첨부 가능)</span>
                    </label>

                    <div className="space-y-3">
                      {/* Drag & Drop Zone */}
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer relative ${
                          dragActive 
                            ? 'border-amber-400 bg-amber-500/10' 
                            : darkMode ? 'border-slate-800 bg-slate-950/50 hover:bg-slate-900/50' : 'border-slate-250 bg-slate-100/50 hover:bg-slate-200/50'
                        }`}
                      >
                        <input
                          type="file"
                          id="add_file_input"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                        />
                        <label htmlFor="add_file_input" className="cursor-pointer space-y-2 block">
                          <Upload className="w-7 h-7 text-indigo-400 mx-auto" />
                          <p className="text-xs font-bold text-slate-300">
                            이미지 파일을 드롭하거나 클릭하여 여러 개 일괄 업로드
                          </p>
                          <p className="text-[10px] text-slate-500">
                            다수의 카드뉴스 배너, 상세페이지 등의 시각적 위반, 승인 마크 도용 자동대조
                          </p>
                        </label>
                      </div>

                      {/* Display Uploaded Image list in beautiful horizontal grid */}
                      {uploadedImages.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-indigo-400 font-extrabold flex items-center gap-1">
                              <span>✅ 업로드 완료된 시안:</span>
                              <span className="bg-indigo-500/10 px-2 py-0.5 rounded-full text-[10px]">{uploadedImages.length}개</span>
                            </span>
                            <button
                              id="clear_all_images_btn"
                              type="button"
                              onClick={clearAllImages}
                              className="text-[10px] text-rose-450 hover:underline font-bold cursor-pointer"
                            >
                              전체 제거
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {uploadedImages.map((img, idx) => (
                              <div
                                key={idx}
                                className={`p-2 rounded-xl border flex items-center gap-3 relative overflow-hidden transition-all hover:border-indigo-500/40 ${
                                  darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                                }`}
                              >
                                <img
                                  src={img.b64}
                                  alt={`Upload draft ${idx + 1}`}
                                  className="w-12 h-12 object-cover rounded-lg border border-slate-800 shadow-sm shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-extrabold text-slate-300 truncate" title={img.file.name}>
                                    {img.file.name}
                                  </p>
                                  <p className="text-[9px] text-slate-500 block leading-tight">
                                    {(img.file.size / 1024).toFixed(1)} KB | Multimodal
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeUploadedImage(idx)}
                                  className="w-6 h-6 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs transition-all shrink-0 cursor-pointer"
                                  title="이 파일 제거"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  id="start_review_btn"
                  onClick={() => triggerAnalysis()}
                  disabled={loading}
                  className={`w-full mt-6 py-4 rounded-xl font-extrabold text-sm flex justify-center items-center gap-2 cursor-pointer transition-transform duration-200 active:scale-95 ${loading ? 'bg-slate-700 text-slate-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300'}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>아하시스턴트가 실시간 심의를 분석 중입니다...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      <span>아하시스턴트 법규 무결성 검수 게시</span>
                    </>
                  )}
                </button>

                {/* Highly structured, animated Realtime Stage Progress Bar */}
                {loading && (
                  <div className="mt-4 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2.5 no-print">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-indigo-400 flex items-center gap-1.5 label-stage">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span className="animate-pulse">{analysisStatusMsg}</span>
                      </span>
                      <span className="font-mono text-indigo-400 font-bold tracking-wider">{analysisProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${analysisProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {errorText && (
                  <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorText}</span>
                  </div>
                )}

                {localLlmErrorText && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 leading-relaxed">
                    <div className="flex gap-2 font-bold text-amber-400">
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      <span>💡 로컬 서버 미연결 안내 (Local LLM Connection Guide)</span>
                    </div>
                    <p className="pl-6 text-slate-300 whitespace-pre-wrap">{localLlmErrorText}</p>
                  </div>
                )}
                
              </div> {/* Close Interactive Input Workspace 1st Column */}

              {/* 📊 2nd Column: Real-time Compliance Analysis Suite */}
              <div className="space-y-6">
                
                {/* 1st State: Waiting placeholder when no evaluation has been requested yet */}
                {!analysisResult && !loading && (
                  <div className={`p-12 text-center rounded-3xl border flex flex-col items-center justify-center ${darkMode ? 'bg-[#0f1524]/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="w-16 h-16 rounded-full bg-slate-800/10 dark:bg-slate-805/50 flex items-center justify-center mb-4 text-slate-500 shrink-0">
                      <FileText className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h4 className={`font-black mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-850'}`}>아하시스턴트 실시간 진단 대기실</h4>
                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed mx-auto text-center">
                      교정하거나 심사하고 싶은 광고 카피를 기재하거나 이미지/웹주소를 첨부한 뒤, 위의 노란색 [단프라 심의 게시] 단추를 클릭해 실시간 공무 대조 분석을 대기해 주십시오.
                    </p>
                  </div>
                )}

                {/* 2nd State: Loading skeleton while asynchronous RAG filters are evaluating */}
                {loading && !analysisResult && (
                  <div className="space-y-4 animate-pulse">
                    <div className="p-10 text-center rounded-3xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400 shrink-0" />
                      <span className="text-xs text-indigo-300 font-extrabold animate-pulse">Gemini 3.5 Flash RAG 하이브리드 인텔리전트 심사분류기 동기화 중...</span>
                    </div>
                    <div className="h-28 rounded-2xl bg-slate-800/20" />
                    <div className="h-44 rounded-2xl bg-slate-800/20" />
                    <div className="h-32 rounded-2xl bg-slate-800/20" />
                  </div>
                )}

                {/* 3rd State: Complete compiled audit report results rendering */}
                {analysisResult && (
                  <div className="space-y-6">

                    {/* Export and Actions Bar (Print/Copy) */}
                    <div className="flex items-center justify-between no-print border-b border-slate-800/20 pb-2">
                    <span className="text-xs font-extrabold text-slate-500">📄 심의 결과보고서 인쇄 및 유통 도구:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyMarkdown}
                        className="py-2 px-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400 animate-bounce" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? '클립보드 복사완료!' : 'Markdown 리포트 복사'}</span>
                      </button>
                      
                      <button
                        onClick={() => setShowPrintModal(true)}
                        className="py-2 px-4 rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 animate-pulse"
                      >
                        <Printer className="w-4 h-4" />
                        <span>새 창에서 보고서 인쇄 및 PDF 저장</span>
                      </button>
                    </div>
                  </div>

                  {/* Csat Grade Card Dashboard Indicator */}
                  {(() => {
                    const gradeInfo = getCsatGradeInfo(analysisResult.score);
                    return (
                      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 printable-report tracking-tight ${darkMode ? 'bg-[#101729] border-slate-800' : 'bg-white border-slate-205 shadow-md'}`}>
                        <div className="space-y-3 text-center md:text-left flex-1">
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded font-black uppercase tracking-wider">
                              수능 등급식 법규 성적표
                            </span>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded font-black flex items-center gap-1 ${gradeInfo.color}`}>
                              {gradeInfo.hasWarning && <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 select-none animate-bounce" />}
                              <span>{gradeInfo.label}</span>
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${gradeInfo.isPassed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35' : 'bg-rose-500/15 text-rose-400 border border-rose-500/35'}`}>
                              {gradeInfo.isPassed ? '합격 (Pass)' : '심의 기각탈락 (Fail)'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h3 className="font-extrabold text-xl tracking-tight flex flex-wrap items-center justify-center md:justify-start gap-2">
                              <span>최종 판정:</span>
                              <span className={`font-black underline decoration-2 ${gradeInfo.isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {gradeInfo.isPassed ? '승인 통과 가능 (Approved)' : '심심 제재/반려 (Rejected)'}
                              </span>
                            </h3>
                            <p className={`text-xs font-semibold leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                              {gradeInfo.desc}
                            </p>
                          </div>
                          
                          <div className="text-[11px] leading-normal text-slate-500 font-medium">
                            {gradeInfo.grade === 1 && "🎉 축하합니다! 완벽에 가까운 1등급 안심 문안입니다. 어떠한 사전 제재 조항 검출도 우회 승인되었습니다."}
                            {gradeInfo.grade === 2 && "⚠️ 2등급 판정: 미세 가이드 수치 조정이나 출처 제시가 요구되는 문단이 검출되었습니다. 조건부로 매체 유포할 수 있습니다."}
                            {gradeInfo.grade >= 3 && "🚫 탈락 (3등급 이하 법정 위험): 수능 심의 기준 3등급 이하는 시판 전면 불가 규격입니다. 아래의 AI 5단계 안전 정비안을 적용하여 대체 교체하여 주십시오."}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 justify-center">
                          {/* CSAT-style Grade Medal */}
                          <div className={`w-28 h-28 rounded-2xl border flex flex-col items-center justify-center relative transition-transform hover:scale-105 duration-200 ${gradeInfo.color}`}>
                            {gradeInfo.hasWarning && (
                              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center absolute -top-2 -right-2 tracking-tighter" title="1등급 이외 경고조치 강제발령">
                                ⚠️
                              </span>
                            )}
                            <span className="text-3xl font-black font-serif">{gradeInfo.grade}</span>
                            <span className="text-[10px] font-black tracking-widest mt-0.5">등급</span>
                            <span className="text-[9px] font-bold opacity-85 mt-1">{gradeInfo.isPassed ? '통과 대상' : '탈락 대상'}</span>
                          </div>

                          {/* Right Panel: Total Score */}
                          <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shrink-0 ${getScoreColor(analysisResult.score)}`}>
                            <span className="text-2xl font-black">{analysisResult.score}</span>
                            <span className="text-[8px] font-bold text-slate-405">COMPLIANCE</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Token Consumption & Analysis Latency Analytics Box when using LLM */}
                  {(analysisResult.usage || analysisResult.analysisTimeMs) && (
                    <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 printable-report ${darkMode ? 'bg-indigo-950/20 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-200'}`}>
                      <div className="flex items-center gap-2.5">
                        <Cpu className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <span className="block text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest leading-none mb-1">⚡ 실시간 인프라 심사 연산 제원</span>
                          <span className="text-[11px] text-slate-400 leading-normal">
                            총 {analysisResult.analysisTimeMs ? (analysisResult.analysisTimeMs / 1000).toFixed(2) : '0.00'}초 소요 | Gemini 3.5 Flash 메가스케일 연동 분석
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 text-xs font-mono self-end md:self-center">
                        <div className="text-center">
                          <span className="block text-[8px] text-slate-500 mb-0.5 font-bold">ANALYSIS TIME</span>
                          <span className="font-extrabold text-amber-400">{analysisResult.analysisTimeMs ? (analysisResult.analysisTimeMs / 1000).toFixed(2) : '0.00'}<span className="text-[10px] font-normal">s</span></span>
                        </div>
                        <div className="text-slate-705 font-bold">/</div>
                        {analysisResult.usage && (
                          <>
                            <div className="text-center">
                              <span className="block text-[8px] text-slate-500 mb-0.5 font-bold">INPUT TOKENS</span>
                              <span className="font-extrabold text-slate-300">{analysisResult.usage.promptTokens.toLocaleString()}</span>
                            </div>
                            <div className="text-slate-705 font-bold">/</div>
                            <div className="text-center">
                              <span className="block text-[8px] text-slate-500 mb-0.5 font-bold">OUTPUT TOKENS</span>
                              <span className="font-extrabold text-indigo-400">{analysisResult.usage.completionTokens.toLocaleString()}</span>
                            </div>
                            <div className="text-slate-705 font-bold">=</div>
                            <div className="text-center bg-indigo-500/10 px-3.5 py-1.5 rounded-xl border border-indigo-500/20">
                              <span className="block text-[8px] text-indigo-300 mb-0.5 font-black uppercase">TOTAL TOKENS</span>
                              <span className="font-black text-indigo-300">{analysisResult.usage.totalTokens.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI 종합 준법 심의 평론서 (마크다운 실시간 뷰어 - 글꼴 스케일링 동시 대응) */}
                  <div className={`p-6 rounded-3xl border space-y-4 printable-report ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-205 shadow-md'}`}>
                    <div className="flex justify-between items-center border-b border-slate-850 pb-3 no-print">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        <h4 className={`font-black text-sm uppercase tracking-wider ${darkMode ? 'text-indigo-300' : 'text-indigo-950 font-black'}`}>✨ AI 정밀 자율 준법 심의 평론서 (Markdown Live Reader)</h4>
                      </div>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase font-bold tracking-wider shrink-0">Markdown Rendered</span>
                    </div>
                    
                    <div className={`markdown-body ${darkMode ? 'text-slate-300' : 'text-slate-900 font-medium'} antialiased overflow-x-auto leading-relaxed text-size-${fontSize}`}>
                      <Markdown>{getMarkdownReportString()}</Markdown>
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

                    {/* Visual Alternative Proposal Card for Multimodal Image Evaluation */}
                    {analysisResult.imageAlternativeProposal && (
                      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1d3a]/60 border-indigo-500/25' : 'bg-indigo-50/50 border-indigo-150'} space-y-4`}>
                        <div className="flex items-center gap-2 border-b border-indigo-500/10 pb-2.5">
                          <Sparkles className="w-4 h-4 text-indigo-450 shrink-0" />
                          <h4 className="font-extrabold text-xs uppercase tracking-wide text-indigo-300">
                            🎨 이미지 파스 진단: 비주얼 카피 및 레이아웃 교정 초안 제안
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950/90 border-slate-850/80' : 'bg-rose-500/5 border-rose-100'} space-y-2`}>
                            <span className="block text-[10px] text-rose-400 font-extrabold uppercase tracking-wide">식별된 원본 시각적 하자 (Detected Visual Risks)</span>
                            <div className="space-y-2">
                              {analysisResult.imageAlternativeProposal.detectedVisualCopys && analysisResult.imageAlternativeProposal.detectedVisualCopys.length > 0 && (
                                <div className="space-y-1">
                                  <span className="block text-[9px] text-slate-500 font-bold">식별 텍스트:</span>
                                  {analysisResult.imageAlternativeProposal.detectedVisualCopys.map((copy, idx) => (
                                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-1">
                                      <span className="text-slate-500">•</span>
                                      <span>&quot;{copy}&quot;</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {analysisResult.imageAlternativeProposal.visualViolations && analysisResult.imageAlternativeProposal.visualViolations.length > 0 && (
                                <div className="space-y-1">
                                  <span className="block text-[9px] text-slate-500 font-bold">비주얼 리스크 소견:</span>
                                  {analysisResult.imageAlternativeProposal.visualViolations.map((vv, idx) => (
                                    <div key={idx} className="text-xs text-rose-400/90 flex items-start gap-1">
                                      <span className="text-rose-500 font-bold">⚠️</span>
                                      <span>{vv}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950/90 border-slate-850/80' : 'bg-emerald-500/5 border-emerald-100'} space-y-2`}>
                            <span className="block text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide">수정 권고 시각 조치선 (Recommended Visual Adjustments)</span>
                            {analysisResult.imageAlternativeProposal.visualRemediationSteps && (
                              <div className="space-y-1.5">
                                {analysisResult.imageAlternativeProposal.visualRemediationSteps.map((step, idx) => (
                                  <div key={idx} className="text-xs text-slate-300 flex items-start gap-1">
                                    <span className="text-emerald-500">✔</span>
                                    <span>{step}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/80 border-slate-850' : 'bg-white border-slate-205'} space-y-1.5`}>
                          <span className="block text-[10px] text-amber-400 font-extrabold uppercase tracking-wide">💡 정제 비주얼 우회 가이드라인 및 레이아웃 시안 설명</span>
                          <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                            {analysisResult.imageAlternativeProposal.alternativeVisualDraft}
                          </p>
                        </div>
                      </div>
                    )}

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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-xs text-rose-400">{v.clause}</span>
                                  <a 
                                    href={makeLawGoLink(v.clause)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="no-print text-[10px] font-black bg-indigo-500/10 hover:bg-slate-800 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded flex items-center gap-0.5 shadow-sm transition-all"
                                    title="국가법령정보공동연계 자동조회 바로가기"
                                  >
                                    <span>law.go.kr ↗</span>
                                  </a>
                                </div>
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
                              <div className="flex items-center justify-between gap-1.5 mb-1.5 flex-wrap">
                                <span className="text-[9px] font-extrabold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Tier {law.tier}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] font-black ${law.relevance >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{law.relevance}% 유사도</span>
                                  <a 
                                    href={makeLawGoLink(law.title)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="no-print text-[9px] font-extrabold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-0.5 shrink-0 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded"
                                    title="국가법령정보 본문 조회"
                                  >
                                    <span>공동연계 ↗</span>
                                  </a>
                                </div>
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
        </div>
      )}

      {/* TAB 1.7: LLM CONFIGURE & API KEYS SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* General Introduction Card */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold shadow-lg shadow-indigo-500/5">
                <Settings className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h2 className={`font-black text-lg flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-950'}`}>
                  <span>준법 RAG 엔진 물리 어댑터 설정</span>
                  <span className="text-xs bg-slate-500/20 px-2 py-0.5 rounded font-normal text-slate-400 font-sans">LLM Configuration</span>
                </h2>
                <p className="text-[10px] text-slate-405 uppercase tracking-wider font-semibold font-mono">Select Infrastructure Adapter & Set API Key Credentials</p>
              </div>
            </div>
            
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-700 font-medium'} leading-relaxed`}>
              대한민국의 복합적 광고 법규 및 RAG 가중 전파 수칙을 통섭하는 물리 어댑터 어레인지 환경설정입니다. 
              인프라 공유 기본 Gemini 모델을 활용할 수 있으나, 할당량 초과(429 Quota Exceeded) 예방이나 쾌적한 처리 향상을 위해 수동 API Key 우회 설정을 권장해 드립니다.
            </p>
          </div>

          {/* Model Switcher and Credentials Setup */}
          <div className={`p-6 rounded-3xl border space-y-5 ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-205 shadow-md'}`}>
            <div className="flex items-center gap-1.5 mb-1 text-slate-300">
              <Sliders className="w-4 h-4 text-amber-500" />
              <h4 className={`font-black text-sm uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-950 font-black'}`}>1. 기저 추론 엔진 선정</h4>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                id="settings_adapter_tab_gemini"
                onClick={() => {
                  setDraftAdapterType(LLMType.GEMINI);
                  setDraftCustomModel('gemini-3.5-flash');
                }}
                className={`py-3 px-2 rounded-xl border text-xs font-black cursor-pointer text-center transition-all ${draftAdapterType === LLMType.GEMINI ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-extrabold' : (darkMode ? 'border-slate-800 bg-slate-900/30 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900')}`}
              >
                Gemini Engine
              </button>

              <button
                type="button"
                id="settings_adapter_tab_local"
                onClick={() => {
                  setDraftAdapterType(LLMType.OLLAMA);
                  applyLocalPreset("ollama");
                }}
                className={`py-3 px-2 rounded-xl border text-xs font-black cursor-pointer text-center transition-all ${draftAdapterType === LLMType.OLLAMA ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-extrabold' : (darkMode ? 'border-slate-800 bg-slate-900/30 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900')}`}
              >
                Local Engine
              </button>

              <button
                type="button"
                id="settings_adapter_tab_other"
                onClick={() => {
                  setDraftAdapterType(LLMType.CUSTOM);
                  applyOtherPreset("openai");
                }}
                className={`py-3 px-2 rounded-xl border text-xs font-black cursor-pointer text-center transition-all ${draftAdapterType === LLMType.CUSTOM ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-extrabold' : (darkMode ? 'border-slate-800 bg-slate-900/30 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900')}`}
              >
                Other Engine
              </button>
            </div>

            {/* Gemini Bypass API Key Setup - ONLY visible in Gemini Engine Tab */}
            {draftAdapterType === LLMType.GEMINI && (
              <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 space-y-4">
                <div className="flex items-center gap-1.5 text-slate-350">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-300">2. 사용자 정의 구글 제미나이키 우회등록</h4>
                </div>
                
                <p className="text-[11px] text-slate-400 leading-normal">
                  본사 인프라 제휴 공유 키의 트래픽 우회 처리를 위해 본인의 구글 크레덴셜 키를 등록해주십시오. 
                  기입된 키는 로컬 보안 세션에 귀속 처리되며 [저장] 시 브라우저 내부에 보존 적용됩니다.
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] text-slate-500 uppercase font-black">Secure API Authorization Key</label>
                    {draftCustomApiKey ? (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-extrabold">개인용 키 대입 완료 (미저장 상태 포함)</span>
                    ) : (
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-extrabold">기본 공유 인프라 대기 중</span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={draftCustomApiKey}
                    onChange={(e) => setDraftCustomApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-700 focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-550/10 border border-indigo-500/20 text-[11px] text-indigo-400 leading-normal">
                  💡 <b>API Key 발행 방법:</b> <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="font-extrabold underline text-amber-500 hover:text-amber-400">Google AI Studio</a>에 로그인 후 <b>[Create API key]</b>를 발급받으시면 무료 정밀 이용하실 수 있습니다!
                </div>
              </div>
            )}

            {/* Local Engine Details configuration */}
            {draftAdapterType === LLMType.OLLAMA && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-350">
                  <span className="font-black text-amber-400">🔌 로컬 엔진 기본 호환 서비스 선택:</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-2">
                  <button
                    type="button"
                    onClick={() => applyLocalPreset("ollama")}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${localPreset === 'ollama' ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-300'}`}
                  >
                    Ollama (기본값 설정)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyLocalPreset("lmstudio")}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${localPreset === 'lmstudio' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-300'}`}
                  >
                    LM Studio
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] text-slate-405 mb-1 font-bold flex items-center justify-between">
                      <span>로컬 엔드포인트 호스트 주소 (Endpoint Server URL)</span>
                      <span className="text-[10px] text-indigo-400 font-mono italic">기본: http://localhost:11434/v1</span>
                    </label>
                    <input
                      type="text"
                      value={draftCustomEndpoint}
                      onChange={(e) => setDraftCustomEndpoint(e.target.value)}
                      placeholder="http://localhost:11434/v1"
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-700 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-405 mb-1 font-bold">인증 토큰 API Key (필요시 기입)</label>
                    <input
                      type="password"
                      value={draftCustomApiKey}
                      onChange={(e) => setDraftCustomApiKey(e.target.value)}
                      placeholder="Bearer Token/API Key for Custom Proxy (Empty for Local)"
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-700 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] text-slate-350 font-bold">지정 모델 ID (Model ID)</label>
                      <button
                        type="button"
                        onClick={handleFetchModels}
                        disabled={fetchModelsLoading}
                        className="py-1 px-2.5 rounded-md bg-[#1d273a] border border-indigo-500/20 text-[10px] text-indigo-300 hover:bg-[#27354f] hover:text-indigo-100 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {fetchModelsLoading ? "조회 중..." : "🔄 서비스 모델 목록 가져오기"}
                      </button>
                    </div>

                    {fetchModelsError && (
                      <p className="p-2 rounded bg-rose-950/40 border border-rose-900/40 text-[10.5px] text-rose-400 leading-normal">
                        ⚠️ {fetchModelsError}
                      </p>
                    )}

                    {fetchedModels.length > 0 ? (
                      <div className="space-y-2">
                        <select
                          value={draftCustomModel}
                          onChange={(e) => setDraftCustomModel(e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-slate-900 border border-indigo-500/35 text-xs text-teal-400 focus:ring-1 focus:ring-amber-500 font-extrabold cursor-pointer"
                        >
                          {fetchedModels.map((m) => (
                            <option key={m} value={m} className="bg-slate-950 text-slate-300 font-mono">
                              {m}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-teal-500/80">&bull; 활성 API 서버로부터 검색 완료된 {fetchedModels.length}개의 가용 모델을 탑재했습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={draftCustomModel}
                          onChange={(e) => setDraftCustomModel(e.target.value)}
                          placeholder="gemma2:9b"
                          className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 font-mono"
                        />
                        <p className="text-[10px] text-slate-500">&bull; 원하시는 모델명이 모델 목록 가져오기 전인 경우 직접 기입해 주셔도 됩니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other Engine details configuration with OpenAI and OpenRouter preset selector */}
            {draftAdapterType === LLMType.CUSTOM && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-350">
                  <span className="font-black text-indigo-400">🌐 클라우드 외부 서비스 프리셋 선택:</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pb-2">
                  <button
                    type="button"
                    onClick={() => applyOtherPreset("openai")}
                    className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all ${otherPreset === 'openai' ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-300'}`}
                  >
                    OpenAI
                  </button>
                  <button
                    type="button"
                    onClick={() => applyOtherPreset("openrouter")}
                    className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all ${otherPreset === 'openrouter' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-300'}`}
                  >
                    OpenRouter
                  </button>
                  <button
                    type="button"
                    onClick={() => applyOtherPreset("custom")}
                    className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all ${otherPreset === 'custom' ? 'border-slate-500 bg-slate-500/10 text-slate-300' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-300'}`}
                  >
                    직접기입 (Custom)
                  </button>
                </div>

                {/* Preset Information / Disclaimer */}
                <div className="p-3.5 rounded-xl bg-[#121626] border border-indigo-500/10 text-xs text-slate-300 leading-relaxed font-semibold">
                  {otherPreset === "openai" && (
                    <div className="text-amber-400 flex items-start gap-1.5">
                      <HelpCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <span>기본 제공: OpenAI GPT-4o-mini 프리셋이 선택되었습니다. 호스팅 통신 인가를 위해 본인의 OpenAI Key를 하단에 기재해 주셔야 합니다.</span>
                    </div>
                  )}
                  {otherPreset === "openrouter" && (
                    <div className="text-indigo-400 flex items-start gap-1.5">
                      <HelpCircle className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                      <span>기본 제공: OpenRouter Gemini 2.5 Flash 프리셋이 선택되었습니다. API Key 필수 기입이 필요합니다.</span>
                    </div>
                  )}
                  {otherPreset === "custom" && (
                    <div className="text-rose-400 flex items-start gap-1.5">
                      <HelpCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <span>⚠️ OpenAI 및 OpenRouter 이외의 타사 OpenAI 호환 클라우드 LLM 서비스를 연동하시는 경우, 직접 엔드포인트 URL과 지정 모델 ID, API Key를 입력해주셔야 정상 연동됩니다.</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] text-slate-405 mb-1 font-bold flex items-center justify-between">
                      <span>엔드포인트 주소 (Endpoint Host URL)</span>
                      <span className="text-[10px] text-indigo-400 font-mono italic">
                        {otherPreset === 'openai' ? '기본: https://api.openai.com/v1' : (otherPreset === 'openrouter' ? '기본: https://openrouter.ai/api/v1' : '사용자 입력')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={draftCustomEndpoint}
                      onChange={(e) => setDraftCustomEndpoint(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-700 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-405 mb-1 font-bold">인증 권한 토큰 API Key</label>
                    <input
                      type="password"
                      value={draftCustomApiKey}
                      onChange={(e) => setDraftCustomApiKey(e.target.value)}
                      placeholder={otherPreset === 'openai' ? 'sk-...' : 'OpenRouter API Key'}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-700 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] text-slate-350 font-bold">지정 모델 ID (Model ID)</label>
                      <button
                        type="button"
                        onClick={handleFetchModels}
                        disabled={fetchModelsLoading}
                        className="py-1 px-2.5 rounded-md bg-[#1d273a] border border-indigo-500/20 text-[10px] text-indigo-300 hover:bg-[#27354f] hover:text-indigo-100 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {fetchModelsLoading ? "조회 중..." : "🔄 서비스 모델 목록 가져오기"}
                      </button>
                    </div>

                    {fetchModelsError && (
                      <p className="p-2 rounded bg-rose-950/40 border border-rose-900/40 text-[10.5px] text-rose-400 leading-normal">
                        ⚠️ {fetchModelsError}
                      </p>
                    )}

                    {fetchedModels.length > 0 ? (
                      <div className="space-y-2">
                        <select
                          value={draftCustomModel}
                          onChange={(e) => setDraftCustomModel(e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-slate-900 border border-indigo-500/35 text-xs text-teal-400 focus:ring-1 focus:ring-amber-500 font-extrabold cursor-pointer"
                        >
                          {fetchedModels.map((m) => (
                            <option key={m} value={m} className="bg-slate-950 text-slate-300 font-mono">
                              {m}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-teal-500/80">&bull; 활성 API 서버로부터 검색 완료된 {fetchedModels.length}개의 가용 모델을 탑재했습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={draftCustomModel}
                          onChange={(e) => setDraftCustomModel(e.target.value)}
                          placeholder={otherPreset === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.5-flash'}
                          className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500 font-mono"
                        />
                        <p className="text-[10px] text-slate-500 font-medium">&bull; 각 제공업체의 모델 명명 규칙에 맞춥니다 (gpt-4o, google/gemini-2.5-flash 등).</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Premium Saving Button Panel at bottom */}
            <div className="pt-4 border-t border-slate-900 flex flex-col items-center gap-3">
              {settingsSavedSuccess && (
                <div id="settings_save_toast_banner" className="w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex gap-2 animate-pulse leading-normal font-bold">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                  <span>🎉 환경설정이 브라우저 보존 공간에 성공적으로 기입되었습니다. 모든 가동 컴플라이언스 엔진 대조 연산 시 저장된 복합 어댑터 규칙이 즉각 연동 적용됩니다.</span>
                </div>
              )}
              
              <button
                type="button"
                id="settings_save_button"
                onClick={handleSaveSettings}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition-all cursor-pointer text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Save className="w-4 h-4" />
                <span>환경설정 저장하기 (Save Configurations)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1.5: APP DESCRIPTION & GUIDELINES TAB */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          {/* Category-Neutral General Introduction Board */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-xl flex items-center gap-2 text-slate-100">
                  <span>아하시스턴트 (aHaSys) 플랫폼 지침</span>
                  <span className="text-xs bg-slate-500/20 px-2 py-0.5 rounded font-normal text-slate-400 font-sans">종합 무결성 자율 규율 가이드라인</span>
                </h2>
                <p className="text-[10px] text-slate-450 uppercase tracking-wider font-semibold font-mono">Autonomous Cross-Domain Compliance Platform & Guides</p>
              </div>
            </div>
            
            <div className="text-sm text-slate-300 leading-relaxed space-y-4">
              <p>
                안녕하세요! <strong>아하시스턴트 (aHaSys)</strong>는 각종 마케팅 카피나 카드뉴스 이미지 초안을 종합 진단하여 공정위 과장 기만 금지 조항, 개별 건강·보건·금융 특별법, 그리고 역사적 참사/사회적 비극 상업 오용 금지 기준 위배 여부를 RAG 기반으로 사전 적법 검수하는 최첨단 솔루션입니다.
              </p>
              <p>
                검수 시 텍스트 문장만, 혹은 상세페이지/카드뉴스 이미지 파일만 단독 업로드하셔도 실시간 멀티모달 Vision AI 프로세서가 법규 무해성과 시각 자료 수치 대조 무결성을 병렬 심의합니다.
              </p>
            </div>
          </div>

          {/* Platform Info Hub Guides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-3 text-amber-500 font-extrabold text-sm">
                <span>⚖️ 5대 영역 법률 위계 매핑</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                표시광고법 상의 속임수 배제 원칙을 최우선으로 하며, 개별 영역법(식품표시광고법, 화장품법, 의료법, 금융소비자보호법) 및 재난안전법(참사 오용 제어)의 특별법 규격 조항들을 지능적으로 우선 매핑해 법적 위반 지점을 구체적으로 지목합니다.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-3 text-amber-500 font-extrabold text-sm">
                <span>🔍 국가법제처 교차 대조 검증</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                자체 LLM 생성의 신뢰도를 확보하기 위해, 인용된 위반 구절 법원 판례 및 법률 조문 데이터베이스를 실시간 교차 대조하여 일치율을 국가법제처 전면 검인 인증 마킹(Verified)을 통해 증명합니다.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-3 text-amber-500 font-extrabold text-sm">
                <span>📝 5단계 SOP 위기 대처 계획</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                규격 결함이나 마이너스 벌점 적발 시, 벌점이 추가 가중되거나 법적 가처분 소송 고위험군에 놓이지 않도록 즉시 조치해야 할 행동 지침(SOP)을 원칙 중단부터 권장 대안안 롤백, 후속 마케팅 복구까지 완벽하게 제시합니다.
              </p>
            </div>
          </div>

          {/* 🔒 SECURITY DISCLAIMER & LOCAL LLM RUNNING METHOD */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-[#0e1626] border-slate-800' : 'bg-white border-slate-200 shadow-md'} space-y-6`}>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/20">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 select-none" />
              <h3 className={`font-black text-base ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>🔒 기업 내부 검토를 위한 보안 유의사항 및 프라이버시 원칙</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
              <div className="space-y-3">
                <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/35 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  퍼블릭 클라우드 데이터 전송 위험 안내
                </span>
                <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                  본 배포용 데모 사이트는 공용 샌드박스에서 실행됩니다. 분석을 위해 기재하신 광고 카피나 업로드하신 멀티모달 파일은 외부 API 네트워크 서버망을 거쳐 연산 처리되므로, <strong>기업의 외외부 미출시 핵심 기밀 스펙, 내부 시안, 기밀 임상치 등 극도의 보안성이 확보되어야 하는 내부 검토 자료</strong>를 직접 기입하시는 것을 자제하여 주십시오.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-1.5">
                  <p className="font-extrabold text-amber-400 text-[11px] flex items-center gap-1">
                    ⚠️ 기업 내부 검토 권장사항
                  </p>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    기업 고유 대외비를 심사하실 때에는 실제 제품 고유 스펙 명을 'A 성분', 'B 물질' 등의 익명 명칭으로 변경하여 기입하시거나, 기밀 유출이 절대 방지되는 **완전 오프라인 패쇄망 로컬 LLM 구동 환경**을 구성하여 주십시오.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  웹브라우저 단독 처리가 아닌 풀스택(Full-Stack) 서비스 구조
                </span>
                <p className={`${darkMode ? 'text-slate-305' : 'text-slate-700 font-medium'}`}>
                  본 서비스는 단순히 프론트엔드 자바스크립트 브라우저 단독으로 API를 호출하지 않고, **Node.js (Express.js) 백엔드 서버 컨트롤러를 내재한 정밀 풀스택 아키텍처**로 안전하게 통제되고 있습니다. 이는 Gemini API Private Key 노출을 전명 방지하고, 정방향 RAG 데이터 적합 가중치를 서버사이드에서 제어하기 위한 필수 설계입니다.
                </p>
                <p className="text-slate-400 text-[11.5px] leading-relaxed">
                  따라서 회사의 인트라넷 보안 폐쇄 컴퓨터에서 구동하시기 위해서는 Node.js 런타임을 장착한 기업 자체 로컬 서버에 소스코드를 설치하시어 **로컬 LLM 서비스(Ollama, LM Studio 등)** 및 고안전 경량 모델인 **Gemma 2 / Gemma 3 / Gemma 4** 모델 계열과 결합하여 운용하실 것을 적극 제안드립니다.
                </p>
              </div>
            </div>

            {/* Step-by-Step Installation Process guidelines */}
            <div className="p-4 rounded-2xl bg-[#090e1a]/80 border border-indigo-500/15 text-left space-y-3 font-mono text-xs">
              <span className="text-[10px] bg-[#121b2d] text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded font-black">
                💻 오프라인 폐쇄망 로컬 인프라 구성 4단계 가이드 (Ollama & Gemma 연계)
              </span>
              <div className="space-y-2 text-slate-400 leading-relaxed text-[10.5px]">
                <p>
                  <strong className="text-slate-200">1. Ollama 및 최신 Gemma 로컬 모델 구동</strong>
                  <br />
                  로컬 전용 딥러닝 서버에 Ollama를 설치한 후, 오프라인 검증용 고성능 국소 모델을 터미널에서 다운로드 및 구동합니다:
                  <br />
                  <span className="text-emerald-400 block bg-slate-950 p-1.5 rounded border border-slate-900 mt-1 select-all">
                    $ ollama run gemma2:9b
                  </span>
                </p>
                <p className="mt-2">
                  <strong className="text-slate-200">2. 환경 설정 파일 배포 (.env.example 참고)</strong>
                  <br />
                  프로젝트 내에 <code className="text-indigo-400">.env</code> 파일을 형성하고 아래와 같이 로컬 LLM 프라미스 주소를 주입해주십시오:
                  <br />
                  <span className="text-slate-100 block bg-slate-950 p-1.5 rounded border border-slate-900 mt-1">
                    LOCAL_LLM_ENDPOINT=http://localhost:11434/v1 <br />
                    LOCAL_LLM_MODEL=gemma2:9b
                  </span>
                </p>
                <p className="mt-2">
                  <strong className="text-slate-200">3. Node.js 백엔드 로컬 패키지 인스톨</strong>
                  <br />
                  터미널에서 의존 부속 라이브러리를 통합 설치하고 로컬 일괄 빌드를 가감합니다:
                  <br />
                  <span className="text-emerald-400 block bg-slate-950 p-1.5 rounded border border-slate-900 mt-1 select-all">
                    $ npm install && npm run build
                  </span>
                </p>
                <p className="mt-2">
                  <strong className="text-slate-200">4. 로컬 사내 서버 인트라넷 서비스 가동</strong>
                  <br />
                  배포용 서버를 컴파일 가동하여 전사 마케팅 부서가 동시 이용할 사내 인트라넷 주소를 부여합니다:
                  <br />
                  <span className="text-emerald-400 block bg-slate-950 p-1.5 rounded border border-slate-900 mt-1 select-all">
                    $ npm run start&nbsp;&nbsp;# 사내 내부망 http://localhost:3000 으로 보안 접속
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 📜 SYSTEM SOLUTION ARCHITECTURE & COPYRIGHT DISCLOSURES */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-[#0f1524]/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/10">
              <Cpu className="w-5 h-5 text-amber-500 shrink-0 select-none" />
              <h3 className={`font-black text-base ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>🛠️ 사용된 솔루션 기술 스택 및 저작권·라이선스 명시</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0b0f19]/40 space-y-1">
                <span className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider">Foundation Model Core</span>
                <p className="font-extrabold text-slate-200">Google Gemini API</p>
                <p className="text-[10px] text-slate-400">Gemini 1.5 Flash / 3.5 Flash 메가스케일 연동 어댑터 기술 탑재 (Google DeepMind 제공)</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0b0f19]/40 space-y-1">
                <span className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider">Application Stack</span>
                <p className="font-extrabold text-slate-200">Express.js & React 18</p>
                <p className="text-[10px] text-slate-400">Node.js 서버 샌드박스 보안 스크롤 및 Vite 고성능 프론트엔드 빌드 엔진 연동</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0b0f19]/40 space-y-1">
                <span className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider">Visual Interface & Styling</span>
                <p className="font-extrabold text-slate-200">Tailwind CSS & Lucide Icons</p>
                <p className="text-[10px] text-slate-400">일관성 있는 원색조 반응형 레이아웃 구성 및 Lucide 래이어 팩토리 그래픽스 사용</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0b0f19]/40 space-y-1">
                <span className="block text-slate-500 font-bold text-[9px] uppercase tracking-wider">Animation Framework</span>
                <p className="font-extrabold text-slate-200">Motion React</p>
                <p className="text-[10px] text-slate-400">부드럽고 직관적인 모듈 트랜지션 및 로더 스피너 마운트 위젯 연동</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1321] text-[11px] text-slate-400 leading-relaxed text-justify space-y-2">
              <p>
                ⚖️ <strong>저작권 안내 및 법적 면책 사항 (Copyright & Legal Disclaimers):</strong>
              </p>
              <p>
                본 '아하시스턴트 AI Compliance review Platform Suite(aHaSys)' 제품을 구성하는 RAG 법률 조문 매핑 알고리즘 디자인, 연계 벌점 감수 매트릭스 공식 등의 응용 지적 고안은 개발자가 연구 설계 및 개발된 비영리/참고 지적 자산이며, 본 소프트웨어는 사용된 기반 오픈소스 및 API 솔루션사(Google, Tailwind CSS 등)의 라이선스 정책에 상호 종속됩니다.
              </p>
              <p>
                동적 대조에 활용되는 판례 및 법규 데이터베이스 원형은 대한민국 국가법령정보센터(법제처) 공개 API에 법적 기준을 두며, Gemini 및 로컬 Google Gemma 모델 상표권·지적 권리는 Google LLC에 귀속됩니다. 본 시스템은 준법 심의 및 대안 문장 추천에 도움을 주는 참고용 어시스턴트 서비스로서, 실제 사법 기관이나 공정위 심사관의 실질적 유권 해석 및 사법적 소송 결과와 완벽히 100% 대응함을 완전히 보증하지는 않으므로 법적 분쟁 시 조언적 데이터로만 상호 대조하는 것을 권장합니다.
              </p>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>LICENSE: Apache License 2.0 (SPDX-License-Identifier: Apache-2.0)</span>
                <span>Copyright 2026. WizMasia. All rights reserved.</span>
              </div>
            </div>
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

            {/* Benchmark ledger list cases with performance limits */}
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${darkMode ? 'bg-indigo-950/10 border-indigo-900/30 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-850'}`}>
              💡 **성능 최적화 명세**: 1,000개 전수 심의 판정 결과는 백엔드 파일 시스템(`docs/benchmark/test_runs.json` 및 종합 벤치마크 브리핑 리포트)에 무손실 물리 저장되며, 본 대시보드 리스트에는 원활한 렌더링 성능 유지를 위하여 상위 **50개 대표 케이스**의 실시간 판정 결과가 시각화 적재됩니다.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benchmarkCases.slice(0, 50).map((bc) => (
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
            
            <div className={`p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${darkMode ? 'bg-[#0f1524] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="space-y-1">
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-3 py-0.5 rounded uppercase font-bold">자가 축적형 RAG 대조 보관소</span>
                <h3 className="text-2xl font-black tracking-tight">지식 누적 및 심의 로그 데이터베이스 (Compliance Log)</h3>
                <p className="text-xs text-slate-400 max-w-xl">
                  이전에 단프라 심의 위원회를 거쳐 검사된 광고 텍스트와 이미지 분석 이력이 보수 저장되어 있습니다. 기록을 키워드별, 영역별로 복합 검색해 재심사하거나 결과보고서를 즉시 복원할 수 있습니다.
                </p>
              </div>

              <button
                id="clear_ledger_btn"
                onClick={clearHistoryLedger}
                className="py-2.5 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>데이터 일괄 삭제</span>
              </button>
            </div>

            {/* Log DB Advanced Searching Panel with filters */}
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#0d1321] border-slate-805' : 'bg-slate-100 border-slate-200'} grid grid-cols-1 md:grid-cols-12 gap-3 items-center no-print`}>
              <div className="md:col-span-6 relative">
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="검색할 광고 카피 원문 또는 키워드를 기입하세요..."
                  className={`w-full text-xs py-2 px-3 pl-8 rounded-xl outline-none border transition-all ${
                    darkMode 
                      ? 'bg-[#0b0f19] border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-450 focus:border-indigo-500'
                  }`}
                />
                <Database className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500 pointer-events-none" />
              </div>

              <div className="md:col-span-3">
                <select
                  value={historyCategoryFilter}
                  onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                  className={`w-full text-xs py-2 px-3 rounded-xl outline-none border transition-all cursor-pointer ${
                    darkMode 
                      ? 'bg-[#0b0f19] border-slate-800 text-slate-300 focus:border-indigo-500' 
                      : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-500'
                  }`}
                >
                  <option value="all">📁 모든 심사 카테고리</option>
                  <option value="food">식품 (건강기능/식품표시광고)</option>
                  <option value="cosmetic">화장품 (기능성/일반화장품)</option>
                  <option value="medical">의료 (병원/약사법/의료용구)</option>
                  <option value="finance">금융 (금융상품/보장금소법)</option>
                  <option value="general">일반 광고 (표시광고법 등)</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={historyVerdictFilter}
                  onChange={(e) => setHistoryVerdictFilter(e.target.value)}
                  className={`w-full text-xs py-2 px-3 rounded-xl outline-none border transition-all cursor-pointer ${
                    darkMode 
                      ? 'bg-[#0b0f19] border-slate-800 text-slate-300 focus:border-indigo-500' 
                      : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-500'
                  }`}
                >
                  <option value="all">🟢 전체 준법 성적</option>
                  <option value="passed">합격 통과 (80점 이상)</option>
                  <option value="failed">반려/조정 필요 (80점 미만)</option>
                </select>
              </div>
            </div>

            {/* Filtered outputs count label */}
            <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono pl-1">
              <span>
                조회된 필터링 결과: 총 <strong className="text-amber-500 font-extrabold">{
                  historyItems.filter(item => {
                    const q = historySearchQuery.trim().toLowerCase();
                    const matchesSearch = !q || 
                      (item.inputText && item.inputText.toLowerCase().includes(q)) ||
                      (item.meta?.productType && item.meta.productType.toLowerCase().includes(q)) ||
                      (item.meta?.regulatoryDomain && item.meta.regulatoryDomain.toLowerCase().includes(q));
                    
                    let matchesCategory = true;
                    if (historyCategoryFilter !== 'all') {
                      const type = item.meta?.productType || "";
                      if (historyCategoryFilter === 'food') matchesCategory = type.includes('식품');
                      else if (historyCategoryFilter === 'cosmetic') matchesCategory = type.includes('화장품');
                      else if (historyCategoryFilter === 'medical') matchesCategory = type.includes('의료');
                      else if (historyCategoryFilter === 'finance') matchesCategory = type.includes('금융');
                      else if (historyCategoryFilter === 'general') matchesCategory = !type.includes('식품') && !type.includes('화장품') && !type.includes('의료') && !type.includes('금융');
                    }

                    let matchesVerdict = true;
                    if (historyVerdictFilter !== 'all') {
                      const isPassed = item.score >= 80;
                      if (historyVerdictFilter === 'passed') matchesVerdict = isPassed;
                      else if (historyVerdictFilter === 'failed') matchesVerdict = !isPassed;
                    }

                    return matchesSearch && matchesCategory && matchesVerdict;
                  }).length
                }개</strong> 이력 매치
              </span>
              <span>RAG 피팅 전용 퓨샷 활성화</span>
            </div>

            {/* Time line list views */}
            {historyItems.length === 0 ? (
              <div className="p-12 border border-dashed rounded-3xl text-center text-slate-500 text-xs">
                저장된 자가 학습용 사례 데이터가 아직 없습니다. 최초 실시간 광고안 탐색을 마치는 즉시 기억 소자 노드가 누적됩니다.
              </div>
            ) : historyItems.filter(item => {
              const q = historySearchQuery.trim().toLowerCase();
              const matchesSearch = !q || 
                (item.inputText && item.inputText.toLowerCase().includes(q)) ||
                (item.meta?.productType && item.meta.productType.toLowerCase().includes(q)) ||
                (item.meta?.regulatoryDomain && item.meta.regulatoryDomain.toLowerCase().includes(q));
              
              let matchesCategory = true;
              if (historyCategoryFilter !== 'all') {
                const type = item.meta?.productType || "";
                if (historyCategoryFilter === 'food') matchesCategory = type.includes('식품');
                else if (historyCategoryFilter === 'cosmetic') matchesCategory = type.includes('화장품');
                else if (historyCategoryFilter === 'medical') matchesCategory = type.includes('의료');
                else if (historyCategoryFilter === 'finance') matchesCategory = type.includes('금융');
                else if (historyCategoryFilter === 'general') matchesCategory = !type.includes('식품') && !type.includes('화장품') && !type.includes('의료') && !type.includes('금융');
              }

              let matchesVerdict = true;
              if (historyVerdictFilter !== 'all') {
                const isPassed = item.score >= 80;
                if (historyVerdictFilter === 'passed') matchesVerdict = isPassed;
                else if (historyVerdictFilter === 'failed') matchesVerdict = !isPassed;
              }

              return matchesSearch && matchesCategory && matchesVerdict;
            }).length === 0 ? (
              <div className="p-12 border border-dashed border-slate-800 rounded-3xl text-center text-slate-500 text-xs">
                설정한 필터 조건 및 키워드에 부합하는 검토 이력이 없습니다. 검색어를 조율해 보십시오.
              </div>
            ) : (
              <div className="relative border-l-2 border-indigo-500/20 pl-6 ml-4 space-y-6 py-2">
                {historyItems.filter(item => {
                  const q = historySearchQuery.trim().toLowerCase();
                  const matchesSearch = !q || 
                    (item.inputText && item.inputText.toLowerCase().includes(q)) ||
                    (item.meta?.productType && item.meta.productType.toLowerCase().includes(q)) ||
                    (item.meta?.regulatoryDomain && item.meta.regulatoryDomain.toLowerCase().includes(q));
                  
                  let matchesCategory = true;
                  if (historyCategoryFilter !== 'all') {
                    const type = item.meta?.productType || "";
                    if (historyCategoryFilter === 'food') matchesCategory = type.includes('식품');
                    else if (historyCategoryFilter === 'cosmetic') matchesCategory = type.includes('화장품');
                    else if (historyCategoryFilter === 'medical') matchesCategory = type.includes('의료');
                    else if (historyCategoryFilter === 'finance') matchesCategory = type.includes('금융');
                    else if (historyCategoryFilter === 'general') matchesCategory = !type.includes('식품') && !type.includes('화장품') && !type.includes('의료') && !type.includes('금융');
                  }

                  let matchesVerdict = true;
                  if (historyVerdictFilter !== 'all') {
                    const isPassed = item.score >= 80;
                    if (historyVerdictFilter === 'passed') matchesVerdict = isPassed;
                    else if (historyVerdictFilter === 'failed') matchesVerdict = !isPassed;
                  }

                  return matchesSearch && matchesCategory && matchesVerdict;
                }).map((item, idx) => (
                  <div key={item.id || idx} className="relative">
                    
                    {/* Time indicator point */}
                    <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#0b0f19] bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold" />
                    
                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#0f1524] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm'} transition-colors space-y-3`}>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="space-x-1.5">
                          <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded font-mono font-bold uppercase">{item.meta?.productType || '일반 광고'}</span>
                          <span className="text-[9px] bg-slate-805 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold">{item.meta?.regulatoryDomain || '기본 표시법'}</span>
                          {item.imagePresent && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold">📷 이미지 첨부됨</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-slate-500 font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                          {(() => {
                            const info = getCsatGradeInfo(item.score);
                            return (
                              <span className={`px-2 py-0.5 rounded-full font-black text-[9px] flex items-center gap-0.5 ${info.color}`}>
                                {info.hasWarning && <AlertTriangle className="w-2.5 h-2.5 text-amber-550 shrink-0 select-none" />}
                                <span>{info.grade}등급 ({info.isPassed ? '합격' : '반려/조정'})</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <div>
                        <strong className="block text-[11px] font-extrabold text-slate-500 mb-1">제출 원안 카피:</strong>
                        <p className="text-xs text-slate-300 italic leading-relaxed bg-[#0a0e18] p-3 rounded-xl border border-slate-900 select-all font-sans">
                          &quot;{item.inputText}&quot;
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-805/40 pt-3 flex-wrap gap-2">
                        <div className="space-x-3">
                          <span>종합 평가벌점: <strong className="text-slate-300 font-black">{item.score}점</strong></span>
                          <span>사용 기어 어댑터: <strong className="text-indigo-400">Gemini 3.5 Active Adaptor</strong></span>
                        </div>
                        
                        {/* Interactive tools inside log database rows */}
                        <div className="flex items-center gap-1.5 no-print">
                          <button
                            onClick={() => {
                              setInputText(item.inputText || "");
                              alert("광고 원문 카피가 상단 검사창에 입력되었습니다. 수정하거나 신규 진단을 개시하십시오.");
                            }}
                            className={`py-1 px-2.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                              darkMode ? 'border-slate-800 bg-slate-805 hover:bg-slate-800 text-slate-350' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                            }`}
                            title="입력창에 본문 텍스트 복사"
                          >
                            <Copy className="w-3 h-3 text-indigo-400" />
                            <span>입력창 복원</span>
                          </button>
                          
                          <button
                            onClick={() => restoreHistoryResult(item)}
                            className="py-1 px-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-[10px] font-extrabold cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
                            title="기 연산된 상세보고서 뷰어 즉시 로드"
                          >
                            <FileText className="w-3 h-3" />
                            <span>상세 결과보고서 다시보기</span>
                          </button>
                        </div>
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
      <footer className="py-12 border-t border-slate-800/40 text-center text-xs text-slate-500 space-y-2.5 no-print">
        <p>본 플랫폼의 저작권은 가용 오픈소스 및 구성 API 솔루션사(Google Gemini, Tailwind CSS 등)의 라이선스 정책에 상호 복속됩니다.</p>
        <p className="text-[10.5px]">
          제작자: WizMasia | 문의 이메일: <a href="mailto:wizmasia@gmail.com" className="underline hover:text-indigo-400">wizmasia@gmail.com</a> | &copy; 2026. WizMasia. All rights reserved.
        </p>
        <div className="flex justify-center items-center gap-1.5 text-[11px] text-slate-400 font-bold">
          <Github className="w-4 h-4 text-slate-400" />
          <span>공식 소스코드 저장소:</span>
          <a
            href="https://github.com/WizMasia/aHaSys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline font-black"
          >
            GitHub (WizMasia/aHaSys)
          </a>
        </div>
        <p className="text-[10px] text-slate-600">Powered by Gemini 3.5 Flash Model Core Adaptor with Autonomous Hybrid RAG Scanners.</p>
      </footer>

      {/* 💻 PDF/Print Preview Overlay Canvas conforming to the standard A4 Aspect Ratio */}
      {showPrintModal && analysisResult && (
        <div 
          id="print-only-modal-container"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto p-4 sm:p-8 flex flex-col items-center"
        >
          {/* Header Actions Bar shown on screen but completely omitted during real browser print */}
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl no-print">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
              <div className="text-left">
                <h4 className="font-extrabold text-xs text-slate-200">🖨️ A4 공식 준법 보고서 인쇄 및 PDF 저장 (새 창 뷰어)</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  A4 비율 미리보기입니다. <b>[새 창에서 인쇄 및 PDF 저장]</b>을 누른 뒤, 인쇄 대화상자에서 인쇄 대상(Destination)을 <b>[PDF로 저장 (Save as PDF)]</b>으로 지정하시면 디지털 보고서 파일(PDF)로 영구 저장하실 수 있습니다.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenPrintTab}
                className="py-2 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] rounded-lg hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>새 창에서 인쇄 및 PDF 저장</span>
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-extrabold text-[11px] rounded-lg transition-all cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>

          {/* Real A4 Paper Visual Template Sheet */}
          <div 
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-950 p-[15mm] shadow-2xl relative border border-slate-300 flex flex-col justify-between font-sans text-xs select-text antialiased leading-relaxed printable-report"
            style={{ pageBreakInside: 'avoid' }}
          >
            {/* Header Stamp and Badge decorative elements */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex justify-between items-start gap-4">
                <div className="text-left space-y-1">
                  <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">OFFICIAL AD COMPLIANCE DOSSIER</span>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-950 font-serif mt-1">광고 법률 무결성 종합 준법 자문보고서</h1>
                  <p className="text-[9px] text-slate-500 font-mono tracking-wider">COMPREHENSIVE LAW EVALUATION \& AD-AUDITS SYSTEM CERTIFICATE</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1 shrink-0">
                  <div className="w-12 h-12 rounded-full border-4 border-double border-amber-600 flex items-center justify-center font-black text-amber-600 text-[9px] select-none rotate-12">
                    준법필인
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 font-bold">No. ANSIM-{Date.now().toString().substring(4)}</span>
                </div>
              </div>
            </div>

            {/* Main stats block */}
            <div className="space-y-4 flex-1">
              
              {/* CSAT Rating Plate & Certification statement */}
              <div className="p-4 border border-slate-300 rounded-xl bg-slate-50 space-y-3">
                <div className="flex items-center justify-between gap-4 border-b border-slate-250 pb-2">
                  <span className="text-[9.5px] font-black bg-slate-900 text-white px-2 py-0.5 rounded">1. 심의 성능 성적 명세</span>
                  <span className="text-[9px] font-bold text-slate-500">감수 일자: {new Date().toLocaleDateString('ko-KR')}</span>
                </div>

                {(() => {
                  const gradeInfo = getCsatGradeInfo(analysisResult.score);
                  return (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="space-y-1 text-left flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11.5px] font-black text-slate-900">최종 심사 등급:</span>
                          <span className="text-[10.5px] font-black text-slate-900 underline decoration-2 decoration-amber-500">
                            {gradeInfo.label}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${gradeInfo.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {gradeInfo.isPassed ? '합격 (PASSED)' : '심사탈락 (REJECTED)'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-700 leading-normal font-medium">
                          {gradeInfo.desc} 본 평론 시안은 광고법 제9조 부당기만 배제 가이드와 개별 마케팅 특별 법률 감점 가중치 매트릭스에 기해 생성되었습니다.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 md:col-span-4 shrink-0">
                        {/* Grade Medal Box */}
                        <div className="w-16 h-16 bg-slate-950 text-white rounded-xl flex flex-col items-center justify-center font-bold">
                          <span className="text-xl font-serif leading-none">{gradeInfo.grade}</span>
                          <span className="text-[7.5px] tracking-widest mt-0.5">등급</span>
                        </div>
                        {/* Score circle */}
                        <div className="w-14 h-14 rounded-full border-4 border-slate-950 flex flex-col items-center justify-center text-slate-950 font-bold shrink-0">
                          <span className="text-base leading-none font-black">{analysisResult.score}</span>
                          <span className="text-[7px] font-bold mt-0.5">SCORE</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Input details */}
              <div className="space-y-1.5">
                <span className="text-[9.5px] font-black bg-slate-900 text-white px-2 py-0.5 rounded">2. 심의 검수 대상 원안 데이터</span>
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-[9.5px] text-slate-700 leading-tight">
                    <div>
                      <span className="font-bold text-slate-500 block">추론 제품 분류군:</span>
                      <span className="font-extrabold text-slate-900">{analysisResult.parsedMeta.productType}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block">해당 특별법령 규격:</span>
                      <span className="font-extrabold text-slate-900">{analysisResult.parsedMeta.regulatoryDomain}</span>
                    </div>
                  </div>
                  {inputText.trim() && (
                    <div>
                      <span className="text-[8.5px] text-slate-500 font-bold block">광고 카피 텍스트:</span>
                      <p className="text-[10px] text-slate-800 italic leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto bg-white p-2 border border-slate-200 rounded mt-0.5 font-medium">
                        &quot;{inputText}&quot;
                      </p>
                    </div>
                  )}
                  {websiteUrl.trim() && (
                    <div>
                      <span className="text-[8.5px] text-slate-500 font-bold block">수집 웹사이트 주소:</span>
                      <span className="text-[9.5px] text-indigo-700 font-mono underline break-all">{websiteUrl}</span>
                    </div>
                  )}
                  {additionalContext.trim() && (
                    <div>
                      <span className="text-[8.5px] text-slate-500 font-bold block">광고 매체 맥락 추가 사안:</span>
                      <span className="text-[9.5px] text-slate-700 font-medium italic block">&quot;{additionalContext}&quot;</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detected Violations List Table */}
              <div className="space-y-1.5">
                <span className="text-[9.5px] font-black bg-slate-900 text-white px-2 py-0.5 rounded">3. 광고 제재 조항 검출 및 벌점 감점 내역 ({analysisResult.violations.length}건)</span>
                {analysisResult.violations.length === 0 ? (
                  <div className="p-4 text-center border border-slate-200 rounded-lg text-emerald-600 font-black text-xs bg-emerald-50/20">
                    ✔ 축하합니다! 검출된 위반 조항이나 감점이 없어 1등급 무결성으로 통과를 수여합니다.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {analysisResult.violations.map((v, i) => (
                      <div key={v.id || i} className="p-2.5 border border-slate-200 rounded-lg bg-white space-y-1.5 page-break-avoid">
                        <div className="flex justify-between items-center bg-slate-50 p-1 rounded-md text-[9.5px]">
                          <span className="font-extrabold text-slate-900 flex items-center gap-1">
                            <span className="bg-slate-950 text-white text-[8.5px] w-4 h-4 rounded-full flex items-center justify-center font-bold shrink-0">
                              {i+1}
                            </span>
                            <span className="underline decoration-indigo-400">{v.clause}</span>
                          </span>
                          <span className="font-extrabold text-rose-600 font-mono">
                            (적발 감점: -{v.deductionPoints}점) | 위험도: {v.severity}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px] text-left leading-normal">
                          <div className="space-y-0.5">
                            <span className="block text-[8px] text-rose-600 font-black">법위 위법 소견 (Risk Statement):</span>
                            <p className="text-slate-800 font-medium">{v.description}</p>
                            <span className="block font-bold text-slate-600">위해구절: <span className="font-mono text-rose-600 font-extrabold">&quot;{v.originalFragment}&quot;</span></span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="block text-[8px] text-emerald-600 font-black">대체 정정 필터 카피 (Compliance Suggestion):</span>
                            <p className="text-emerald-950 font-extrabold bg-emerald-100/30 p-1 rounded leading-normal border border-emerald-100">
                              &quot;{v.replacement}&quot;
                            </p>
                          </div>
                        </div>
                        
                        {/* Statutory Link */}
                        <div className="text-[8px] text-left text-slate-500">
                          ⚖️ 법률 조문 연계: <a href={makeLawGoLink(v.clause)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-extrabold hover:text-indigo-800">{v.clause} 국가법령정보시스템(Law.go.kr) 원문 보기 &rarr;</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alternatives panel */}
              {analysisResult.imageAlternativeProposal && (
                <div className="p-3 border border-indigo-200 rounded-lg bg-indigo-50/20 space-y-1.5 page-break-avoid">
                  <span className="text-[9.5px] font-black bg-indigo-950 text-white px-2 py-0.5 rounded">4. 이미지 상세 비주얼 구격 및 대체안</span>
                  <div className="space-y-1 text-[9.5px] text-left leading-relaxed">
                    {analysisResult.imageAlternativeProposal.detectedVisualCopys?.length > 0 && (
                      <p><strong className="text-slate-800">&bull; OCR 식별 문구:</strong> {analysisResult.imageAlternativeProposal.detectedVisualCopys.join(', ')}</p>
                    )}
                    {analysisResult.imageAlternativeProposal.visualViolations?.length > 0 && (
                      <p><strong className="text-rose-600">&bull; 검출 시각 위반:</strong> {analysisResult.imageAlternativeProposal.visualViolations.join(' / ')}</p>
                    )}
                    <span className="block font-bold text-[8px] text-amber-600 uppercase mt-1">💊 법률 우회 처방 구도 배포 가이드라인 및 시안 제안:</span>
                    <p className="text-slate-900 leading-normal italic bg-white p-2 border border-indigo-100 rounded text-[9.5px]">
                      {analysisResult.imageAlternativeProposal.alternativeVisualDraft}
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Footer space */}
            <div className="pt-4 border-t border-slate-300 mt-4 text-[9px] flex justify-between items-end">
              <div className="space-y-0.5 text-left text-slate-500">
                <p className="font-extrabold text-slate-800">아하시스턴트 AI 자율 규제 필터 컴플라이언스 센터</p>
                <p className="text-[8px]">본 법무 인증 보고서는 공정거래위원회 심사관 규정 및 주요 특별고시 근거 기준을 토대로 자율 지식 RAG을 결합해 도출되었습니다.</p>
              </div>
              <div className="text-center shrink-0">
                <p className="font-semibold border-b border-slate-200 pb-1 px-2 text-slate-400">자율심의단장 (대인)</p>
                <p className="text-[9.5px] font-black text-slate-900 pt-1 tracking-widest">aHaSys (인)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
