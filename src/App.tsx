/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Moon, 
  Sun, 
  History, 
  Gauge, 
  FileText, 
  Printer, 
  Cpu, 
  Settings, 
  Loader2, 
  Github
} from 'lucide-react';

import { Stage, LLMType, LLMConfig, SystemAnalysisResult, Violation, PastCase, BenchmarkCase } from './types';
import { useApp } from './contexts/AppContext';
import { apiClient } from './services/api';
import { SettingsTab } from './components/SettingsTab';
import { AboutTab } from './components/AboutTab';
import { BenchmarkTab } from './components/BenchmarkTab';
import { HistoryTab } from './components/HistoryTab';
import { ReviewTab } from './components/ReviewTab';

export const SCORE_THRESHOLD_EXCELLENT = 95;
export const SCORE_THRESHOLD_GOOD = 80;
export const SCORE_THRESHOLD_NORMAL = 60;
export const SCORE_THRESHOLD_WARNING = 40;

export default function App() {
  const llm = useApp();
  const { darkMode, setDarkMode, fontSize, setFontSize, activeTab, setActiveTab } = llm;

  const [copied, setCopied] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');

  // Analysis inputs
  const [inputText, setInputText] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [additionalContext, setAdditionalContext] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<{file: File, b64: string}[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

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
  const [showBenchmarkTab, setShowBenchmarkTab] = useState<boolean>(false);
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
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('benchmark') === 'true' || localStorage.getItem('SHOW_BENCHMARK') === 'true') {
      setShowBenchmarkTab(true);
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const data = await apiClient.getHistory();
      setHistoryItems(data);
    } catch {
      console.warn("Failed to retrieve history nodes.");
    }
  };

  const fetchBenchmarkCases = async () => {
    try {
      const data = await apiClient.getBenchmarkCases();
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

  const handleCopyMarkdown = () => {
    if (!analysisResult) return;
    const reportStr = getMarkdownReportString();
    navigator.clipboard.writeText(reportStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getCsatGradeInfo = (score: number) => {
    if (score >= SCORE_THRESHOLD_EXCELLENT) {
      return { 
        grade: 1, 
        label: "🥇 1등급 (최우수)", 
        isPassed: true, 
        color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-450 dark:text-emerald-400", 
        hasWarning: false,
        desc: "대한민국 광고 위법 자율성 최상위 등급입니다. 특정한 가처분이나 과장 표현 위반 조사 지점이 발견되지 않았습니다."
      };
    } else if (score >= SCORE_THRESHOLD_GOOD) {
      return { 
        grade: 2, 
        label: "🥈 2등급 (우수 - 조건부 승인)", 
        isPassed: true, 
        color: "bg-teal-500/10 border-teal-500/30 text-teal-450 dark:text-teal-400", 
        hasWarning: false,
        desc: "일부 조항 대조 시 경미한 위반 가능 영역이나 근거 자료 출처 증명서 배포가 보류 권장되는 지점이 검출되었으나, 준법 권장사항을 수용 조율할 시 충분히 안전하게 통과 가능합니다."
      };
    } else if (score >= SCORE_THRESHOLD_NORMAL) {
      return { 
        grade: 3, 
        label: "🥉 3등급 (보통 - 전면 재검토 요망)", 
        isPassed: false, 
        color: "bg-amber-500/10 border-amber-500/30 text-amber-450 dark:text-amber-400", 
        hasWarning: true,
        desc: "허위 기만광고의 소지가 있어 공정거래법 저촉 위험이 현저히 농후합니다. 벌점 감쇄에 따른 법정 분쟁 및 행정 처분 가능성이 존재하므로, 즉시 안전한 교정 대안안으로 전면 순화하여 배포하십시오."
      };
    } else if (score >= SCORE_THRESHOLD_WARNING) {
      return { 
        grade: 4, 
        label: "⚠️ 4등급 (경고 - 제재 위험군)", 
        isPassed: false, 
        color: "bg-orange-500/10 border-orange-500/30 text-orange-450 dark:text-orange-400", 
        hasWarning: true,
        desc: "소비자 오인 야기 소지가 극히 다분한 다수의 특별법 저촉이 탐색되었습니다. 관계 당국의 직권 조사와 정정 광고 게재 명령이 촉발될 수 있는 수준이오니 사안을 즉각 폐기하고 리디렉션하십시오."
      };
    } else {
      return { 
        grade: 5, 
        label: "🚨 5등급 (위험 - 즉각 수정 의무)", 
        isPassed: false, 
        color: "bg-rose-500/10 border-rose-500/30 text-rose-450 dark:text-rose-400", 
        hasWarning: true,
        desc: "참사/비극 오용 및 특별법 규정 위배가 극심하여 행정 고발 및 형사 제재 사유에 해당할 소지가 100% 농후합니다. 대외 유포를 당장 전면 중지하십시오."
      };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= SCORE_THRESHOLD_EXCELLENT) return 'border-emerald-500 text-emerald-400';
    if (score >= SCORE_THRESHOLD_GOOD) return 'border-teal-500 text-teal-400';
    if (score >= SCORE_THRESHOLD_NORMAL) return 'border-amber-500 text-amber-400';
    if (score >= SCORE_THRESHOLD_WARNING) return 'border-orange-500 text-orange-400';
    return 'border-rose-500 text-rose-450 dark:text-rose-400';
  };

  const getSeverityBadge = (severity: 'High' | 'Medium' | 'Low') => {
    if (severity === 'High') return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
    if (severity === 'Medium') return 'bg-orange-500/10 text-orange-405 border border-orange-500/30';
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
  };

  const getMarkdownReportString = (): string => {
    if (!analysisResult) return "";
    let str = `# 🛡️ 광고 법률 자율 무결성 종합 준법 자문보고서\n\n`;
    const gradeInfo = getCsatGradeInfo(analysisResult.score);
    str += `## 1. 종합 심의 판정 요약\n`;
    str += `* **종합 안전 벌점**: **${analysisResult.score}점** / 100점 만점\n`;
    str += `* **최종 준법 성적**: **${gradeInfo.label}** (${gradeInfo.isPassed ? "합격 - 통과 대상" : "기각 - 반려 대상"})\n`;
    str += `* **기저 인프라 엔진**: \`${llm.adapterType === 'GEMINI' ? 'Gemini API' : 'OpenAI-Compatible'} (${llm.customModel || 'Gemini'})\`\n\n`;
    str += `> 💡 **심의 요지**: ${gradeInfo.desc}\n\n`;

    str += `## 2. 심의 검수 대상 원안 메타 정보\n`;
    str += `* **추론 제품 분류군**: \`${analysisResult.parsedMeta.productType}\`\n`;
    str += `* **조사 특별 법령 영역**: \`${analysisResult.parsedMeta.regulatoryDomain}\`\n`;
    str += `* **유통 예정 마케팅 매체**: \`${analysisResult.parsedMeta.channels}\`\n`;
    str += `* **주요 타겟 세그먼트**: \`${analysisResult.parsedMeta.targets}\`\n\n`;

    str += `## 3. 세부 위법 제재 조항 검출 및 감점 내역 (${analysisResult.violations.length}건)\n`;
    if (analysisResult.violations.length === 0) {
      str += `> ✔ **축하합니다! 위반 검출 사안이 없어 100% 무해성으로 통과 승인되었습니다.**\n\n`;
    } else {
      analysisResult.violations.forEach((v, index) => {
        str += `### [위반 ${index + 1}] ${v.clause}\n`;
        str += `* **감점**: **-${v.deductionPoints}점** | **위험도**: \`${v.severity}\`\n`;
        str += `* **위법 위험 소견**: ${v.description}\n`;
        str += `* **문제 발견 원안 구절**: \`"${v.originalFragment}"\`\n`;
        str += `* **법적 무해 정정 대안안**: **\`"${v.replacement}"\`**\n\n`;
      });
    }

    if (analysisResult.imageAlternativeProposal) {
      str += `## 4. 이미지 비주얼 멀티모달 Vision 정밀 교정 보고\n`;
      str += `* **Detected Visual Copys (OCR 검출 텍스트)**: ${analysisResult.imageAlternativeProposal.detectedVisualCopys?.join(', ') || '없음'}\n`;
      str += `* **Visual Violations (시각적 리스크 소견)**: ${analysisResult.imageAlternativeProposal.visualViolations?.join(' / ') || '없음'}\n\n`;
      str += `### 🎨 이미지 우회 대안 처방 시안 가이드라인\n`;
      str += `> ${analysisResult.imageAlternativeProposal.alternativeVisualDraft}\n\n`;
    }

    str += `---\n*본 보고서의 유권 해석 최종 권리는 규제 당국의 심사위원에 귀속되므로 법률 자문 대조용으로 활용해 주십시오.*`;
    return str;
  };

  const makeLawGoLink = (clause: string) => {
    let lawName = "표시광고의공정화에관한법률";
    if (clause) {
      const match = clause.match(/^([가-힣\s]+법)/);
      if (match) {
        lawName = match[1].replace(/\s+/g, "");
      }
    }
    return `https://www.law.go.kr/법령/${encodeURIComponent(lawName)}`;
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
            <div style="font-size: 8.5px; color: #64748b; margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 6px;">
              ⚖ 법률 조문 연계: <a href="${makeLawGoLink(v.clause)}" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: bold;">${v.clause} 국가법령정보시스템(Law.go.kr) 바로가기 &rarr;</a>
            </div>
          </div>
        `).join("");

    const inputContextHtml = `
      <div style="padding: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 10px; color: #334155; line-height: 1.5;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 25%; font-weight: bold; color: #64748b; padding: 2px 0;">제품 대분류:</td>
            <td style="font-weight: bold; color: #0f172a; padding: 2px 0;">${analysisResult.parsedMeta.productType || '일반 표시광고'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #64748b; padding: 2px 0;">조사 특별법령:</td>
            <td style="font-weight: bold; color: #ea580c; padding: 2px 0;">${analysisResult.parsedMeta.regulatoryDomain || '기본 표시광고법'}</td>
          </tr>
          ${inputText.trim() ? `
            <tr>
              <td style="vertical-align: top; font-weight: bold; color: #64748b; padding: 4px 0;">제출 광고 원안:</td>
              <td style="background-color: white; border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px; font-style: italic; color: #0f172a; font-family: sans-serif; font-size: 10.5px; padding: 4px 0;">"${inputText}"</td>
            </tr>
          ` : ''}
          ${websiteUrl.trim() ? `
            <tr>
              <td style="font-weight: bold; color: #64748b; padding: 2px 0;">심사 웹페이지 URL:</td>
              <td style="color: #4f46e5; font-family: monospace; font-weight: bold; padding: 2px 0;">${websiteUrl}</td>
            </tr>
          ` : ''}
          ${additionalContext.trim() ? `
            <tr>
              <td style="font-weight: bold; color: #64748b; padding: 2px 0;">추가 맥락:</td>
              <td style="color: #334155; font-style: italic; padding: 2px 0;">"${additionalContext}"</td>
            </tr>
          ` : ''}
        </table>
      </div>
    `;

    const ocrHtml = analysisResult.imageAlternativeProposal 
      ? `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <span class="section-title">4. 이미지 비주얼 멀티모달 Vision 정밀 교정 보고</span>
          <div style="margin-top: 10px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #fcfcfd;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 10.5px; margin-bottom: 8px;">
              <div style="padding: 8px; background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 6px;">
                <span style="font-size: 8.5px; color: #be123c; font-weight: 800; display: block; margin-bottom: 4px;">원안 시각적 부적합 카피 (OCR):</span>
                <span style="color: #4c0519; font-weight: 500;">${analysisResult.imageAlternativeProposal.detectedVisualCopys?.join(', ') || '없음'}</span>
              </div>
              <div style="padding: 8px; background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 6px;">
                <span style="font-size: 8.5px; color: #047857; font-weight: 800; display: block; margin-bottom: 4px;">수정 시각적 조치 권고사항:</span>
                <span style="color: #064e3b; font-weight: 500;">${analysisResult.imageAlternativeProposal.visualRemediationSteps?.join(' / ') || '없음'}</span>
              </div>
            </div>
            <div style="margin-top: 8px; padding: 8px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px;">
              <span style="font-size: 8.5px; color: #b45309; font-weight: 800; display: block; margin-bottom: 4px;">🎨 법률 우회 처방 레이아웃 시안 및 지침:</span>
              <p style="color: #78350f; font-weight: bold; margin: 0; line-height: 1.4; font-size: 10px;">${analysisResult.imageAlternativeProposal.alternativeVisualDraft}</p>
            </div>
          </div>
        </div>
      `
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>광고 법률 자율 무결성 종합 준법 자문보고서 (No. ANSIM-${Date.now().toString().substring(6)})</title>
        <meta charset="utf-8">
        <style>
          @media print {
            .no-print { display: none !important; }
            body { background-color: white !important; color: black !important; padding: 0 !important; }
            .page { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
          }
          body {
            background-color: #f1f5f9;
            color: #0f172a;
            font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .toolbar {
            width: 100%;
            max-width: 210mm;
            background-color: #1e293b;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-sizing: border-box;
          }
          .toolbar-title {
            font-size: 12px;
            font-weight: bold;
          }
          .btn-print {
            background-color: #fbbf24;
            color: #0f172a;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            margin-right: 8px;
          }
          .btn-close {
            background-color: #475569;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
          }
          .page {
            background-color: white;
            width: 100%;
            max-width: 210mm;
            min-h-[297mm];
            box-sizing: border-box;
            padding: 20mm;
            border: 1px solid #cbd5e1;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .header {
            border-bottom: 3px double #0f172a;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .official-badge {
            font-size: 8px;
            background-color: #4f46e5;
            color: white;
            padding: 2px 6px;
            border-radius: 2px;
            font-weight: bold;
            letter-spacing: 1px;
            display: inline-block;
          }
          .title {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            margin: 6px 0 2px 0;
            font-family: serif;
          }
          .subtitle {
            font-size: 8px;
            color: #64748b;
            margin: 0;
            font-family: monospace;
            letter-spacing: 0.5px;
          }
          .stamp {
            border: 3px double #d97706;
            border-radius: 50%;
            width: 44px;
            height: 44px;
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
      const data = await apiClient.analyzeCompliance({
        text: textToUse,
        url: websiteUrl,
        context: additionalContext,
        imagePresent: uploadedImages.length > 0,
        images: uploadedImages.map(img => img.b64 as string),
        adapter: llm.adapterType,
        modelName: llm.customModel,
        endpoint: llm.customEndpoint,
        apiKey: llm.customApiKey
      });

      if (data.error) {
        setErrorText(data.message || "심의 과정 도중 에러가 보고되었습니다.");
      } else {
        setAnalysisResult(data);
        if (data.localLlmError) {
          setLocalLlmErrorText(data.localLlmError);
        }
        fetchHistory(); // Refresh history timeline node on successful loop
      }
    } catch (err: any) {
      setErrorText(err.message || "서버 컴플라이언스 엔진 연결 중 심각한 예외가 촉발해 통신이 중단되었습니다.");
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
      const data = await apiClient.runBenchmark();

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
              adapterUsed: `${llm.adapterType} (${llm.customModel})`
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
      await apiClient.clearHistory();
      setHistoryItems([]);
      setAnalysisResult(null);
    } catch {
      console.warn("Failed to clear history on endpoint.");
    }
  };

  const restoreHistoryResult = (item: any) => {
    setAnalysisResult(item.result || null);
    setInputText(item.inputText || "");
    setErrorText(null);
    setActiveTab('review');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans tracking-tight ${darkMode ? 'bg-[#060913] text-slate-100 dark' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 🔮 Superb Futuristic Glowing Top Nav bar */}
      <nav className={`no-print border-b sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex items-center justify-between transition-colors ${darkMode ? 'bg-[#060913]/85 border-slate-900/60' : 'bg-white/90 border-slate-200'}`}>
        <div 
          onClick={() => { setActiveTab('review'); setErrorText(null); }}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-200">
            🛡️
          </div>
          <div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-black tracking-widest uppercase group-hover:text-indigo-300 transition-colors">KFTC RAG Platform Suite</span>
            <h1 className={`text-base font-black flex items-center gap-1.5 leading-none mt-1 ${darkMode ? 'text-slate-100' : 'text-slate-950'}`}>
              <span>아하시스턴트 AI (aHaSys)</span>
              <span className="text-[11px] text-slate-500 font-normal">v3.5.2 Pro</span>
            </h1>
          </div>
        </div>

        <div className={`hidden lg:flex items-center gap-2 p-1.5 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-800/40' : 'bg-slate-100 border-slate-200'}`}>
          <button
            onClick={() => { setActiveTab('review'); setErrorText(null); }}
            className={`py-2 px-4 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'review' ? (darkMode ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-md font-extrabold' : 'bg-indigo-600/10 text-indigo-700 border border-indigo-500/20 shadow-sm font-extrabold') : (darkMode ? 'text-slate-400 hover:text-slate-250 border border-transparent' : 'text-slate-600 hover:text-slate-900 border border-transparent')}`}
          >
            <span>✏️ 실시간 심의</span>
          </button>
          
          {showBenchmarkTab && (
            <button
              onClick={() => { setActiveTab('benchmark'); setErrorText(null); }}
              className={`py-2 px-4 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'benchmark' ? (darkMode ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-md font-extrabold' : 'bg-indigo-600/10 text-indigo-700 border border-indigo-500/20 shadow-sm font-extrabold') : (darkMode ? 'text-slate-400 hover:text-slate-250 border border-transparent' : 'text-slate-600 hover:text-slate-900 border border-transparent')}`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>📊 무작위 벤치마크 대시보드</span>
            </button>
          )}
          
          <button
            onClick={() => { setActiveTab('history'); setErrorText(null); }}
            className={`py-2 px-4 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'history' ? (darkMode ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-md font-extrabold' : 'bg-indigo-600/10 text-indigo-700 border border-indigo-500/20 shadow-sm font-extrabold') : (darkMode ? 'text-slate-400 hover:text-slate-250 border border-transparent' : 'text-slate-600 hover:text-slate-900 border border-transparent')}`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Timeline 저장소</span>
          </button>

          <button
            onClick={() => { setActiveTab('about'); setErrorText(null); }}
            className={`py-2 px-4 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'about' ? (darkMode ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-md font-extrabold' : 'bg-indigo-600/10 text-indigo-700 border border-indigo-500/20 shadow-sm font-extrabold') : (darkMode ? 'text-slate-400 hover:text-slate-250 border border-transparent' : 'text-slate-600 hover:text-slate-900 border border-transparent')}`}
          >
            <span>📜 플랫폼 지침</span>
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setErrorText(null); }}
            className={`py-2 px-4 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'settings' ? (darkMode ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-md font-extrabold' : 'bg-indigo-600/10 text-indigo-700 border border-indigo-500/20 shadow-sm font-extrabold') : (darkMode ? 'text-slate-400 hover:text-slate-250 border border-transparent' : 'text-slate-600 hover:text-slate-900 border border-transparent')}`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>LLM 설정</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex rounded-lg p-0.5 no-print border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-250'}`}>
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 rounded text-[10px] font-black cursor-pointer transition-colors ${fontSize === 'sm' ? 'bg-indigo-600 text-white shadow-sm' : (darkMode ? 'text-slate-500 hover:text-slate-350' : 'text-slate-600 hover:text-slate-900')}`}
              title="글꼴 작게"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('md')}
              className={`px-2 py-1 rounded text-[10px] font-black cursor-pointer transition-colors ${fontSize === 'md' ? 'bg-indigo-600 text-white shadow-sm' : (darkMode ? 'text-slate-500 hover:text-slate-350' : 'text-slate-600 hover:text-slate-900')}`}
              title="글꼴 표준"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 rounded text-[10px] font-black cursor-pointer transition-colors ${fontSize === 'lg' ? 'bg-indigo-600 text-white shadow-sm' : (darkMode ? 'text-slate-500 hover:text-slate-350' : 'text-slate-600 hover:text-slate-900')}`}
              title="글꼴 크게"
            >
              A+
            </button>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300' : 'bg-slate-100 border-slate-200 text-indigo-600 hover:text-indigo-800'}`}
            title={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Main Container Layout */}
      <main className={`max-w-7xl mx-auto px-6 py-8 no-print ${fontSize === 'sm' ? 'text-size-sm' : fontSize === 'lg' ? 'text-size-lg' : 'text-size-md'}`}>
        
        {/* TAB 1: REALTIME REVIEW INTERFACE */}
        {activeTab === 'review' && (
          <ReviewTab
            errorText={errorText}
            setErrorText={setErrorText}
            showKeyAlert={showKeyAlert}
            setShowKeyAlert={setShowKeyAlert}
            inputMode={inputMode}
            setInputMode={setInputMode}
            inputText={inputText}
            setInputText={setInputText}
            websiteUrl={websiteUrl}
            setWebsiteUrl={setWebsiteUrl}
            additionalContext={additionalContext}
            setAdditionalContext={setAdditionalContext}
            uploadedImages={uploadedImages}
            dragActive={dragActive}
            handleDrag={handleDrag}
            handleDrop={handleDrop}
            handleImageChange={handleImageChange}
            clearAllImages={clearAllImages}
            removeUploadedImage={removeUploadedImage}
            triggerAnalysis={triggerAnalysis}
            loading={loading}
            analysisProgress={analysisProgress}
            analysisStatusMsg={analysisStatusMsg}
            analysisResult={analysisResult}
            localLlmErrorText={localLlmErrorText}
            handleCopyMarkdown={handleCopyMarkdown}
            copied={copied}
            setShowPrintModal={setShowPrintModal}
            getCsatGradeInfo={getCsatGradeInfo}
            getScoreColor={getScoreColor}
            getMarkdownReportString={getMarkdownReportString}
            makeLawGoLink={makeLawGoLink}
            getSeverityBadge={getSeverityBadge}
          />
        )}

        {/* TAB 1.7: LLM CONFIGURE & API KEYS SETTINGS TAB */}
        {activeTab === 'settings' && (
          <SettingsTab />
        )}

        {/* TAB 1.5: APP DESCRIPTION & GUIDELINES TAB */}
        {activeTab === 'about' && (
          <AboutTab />
        )}

        {/* TAB 2: BENCHMARK SUITE */}
        {activeTab === 'benchmark' && showBenchmarkTab && (
          <BenchmarkTab
            benchmarkRunning={benchmarkRunning}
            benchmarkStats={benchmarkStats}
            benchmarkCases={benchmarkCases}
            triggerBenchmark={triggerBenchmark}
          />
        )}

        {/* TAB 3: KNOWLEDGE TIMELINE */}
        {activeTab === 'history' && (
          <HistoryTab
            historyItems={historyItems}
            historySearchQuery={historySearchQuery}
            setHistorySearchQuery={setHistorySearchQuery}
            historyCategoryFilter={historyCategoryFilter}
            setHistoryCategoryFilter={setHistoryCategoryFilter}
            historyVerdictFilter={historyVerdictFilter}
            setHistoryVerdictFilter={setHistoryVerdictFilter}
            clearHistoryLedger={clearHistoryLedger}
            setInputText={setInputText}
            restoreHistoryResult={restoreHistoryResult}
            getCsatGradeInfo={getCsatGradeInfo}
          />
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
        <p className="text-[10px] text-slate-600">Powered by {llm.adapterType === 'GEMINI' ? 'Gemini API' : 'OpenAI-Compatible'} ({llm.customModel}) Core Adaptor with Autonomous Hybrid RAG Scanners.</p>
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
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-950 p-6 sm:p-[15mm] shadow-2xl relative border border-slate-300 flex flex-col justify-between font-sans text-xs select-text antialiased leading-relaxed printable-report"
            style={{ pageBreakInside: 'avoid' }}
          >
            {/* Header Stamp and Badge decorative elements */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px] text-slate-700 leading-tight">
                    <div>
                      <span className="font-bold text-slate-505 block">추론 제품 분류군:</span>
                      <span className="font-extrabold text-slate-900">{analysisResult.parsedMeta.productType}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-505 block">해당 특별법령 규격:</span>
                      <span className="font-extrabold text-slate-900">{analysisResult.parsedMeta.regulatoryDomain}</span>
                    </div>
                  </div>
                  {inputText.trim() && (
                    <div>
                      <span className="text-[8.5px] text-slate-505 font-bold block">광고 카피 텍스트:</span>
                      <p className="text-[10px] text-slate-800 italic leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto bg-white p-2 border border-slate-200 rounded mt-0.5 font-medium">
                        &quot;{inputText}&quot;
                      </p>
                    </div>
                  )}
                  {websiteUrl.trim() && (
                    <div>
                      <span className="text-[8.5px] text-slate-505 font-bold block">수집 웹사이트 주소:</span>
                      <span className="text-[9.5px] text-indigo-700 font-mono underline break-all">{websiteUrl}</span>
                    </div>
                  )}
                  {additionalContext.trim() && (
                    <div>
                      <span className="text-[8.5px] text-slate-505 font-bold block">광고 매체 맥락 추가 사안:</span>
                      <span className="text-[9.5px] text-slate-700 font-medium italic block">&quot;{additionalContext}&quot;</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detected Violations List Table */}
              <div className="space-y-1.5">
                <span className="text-[9.5px] font-black bg-slate-900 text-white px-2 py-0.5 rounded">3. 광고 제재 조항 검출 및 벌점 감점 내역 ({analysisResult.violations.length}건)</span>
                {analysisResult.violations.length === 0 ? (
                  <div className="p-4 rounded-xl text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 dark:text-emerald-400 text-xs font-bold">
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
                            <span className="block font-bold text-slate-605">위해구절: <span className="font-mono text-rose-600 font-extrabold">&quot;{v.originalFragment}&quot;</span></span>
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
            <div className="pt-4 border-t border-slate-300 mt-4 text-[9px] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
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
