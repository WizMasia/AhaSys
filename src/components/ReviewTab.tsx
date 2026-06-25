/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  AlertTriangle, 
  Globe, 
  Upload, 
  FileText, 
  Loader2, 
  Copy, 
  Check, 
  Printer, 
  Cpu, 
  Sparkles, 
  Layers, 
  Info, 
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import Markdown from 'react-markdown';
import { SystemAnalysisResult } from '../types';
import { useApp } from '../contexts/AppContext';

const GEMINI_TESTED_NOTICE = '현재 광고 검토 품질 테스트는 Gemini 어댑터 기준으로만 진행했습니다. 다른 모델에서는 위반 검출과 보고서 품질이 안정적이지 않을 수 있습니다.';

const getPredictedAgents = (text: string, hasImages: boolean) => {
  const agents = ["LEGAL_PRODUCT (식의약/보건)"];
  const t = (text || "").toLowerCase();
  
  if (t.includes("수익") || t.includes("원금") || t.includes("금리") || t.includes("투자") || t.includes("대출") || t.includes("게임") || t.includes("확률") || t.includes("뽑기")) {
    agents.push("LEGAL_FINANCE (금융/게임)");
  }
  if (t.includes("광고") || t.includes("1위") || t.includes("최초") || t.includes("소비자") || t.includes("환불") || t.includes("취소") || t.includes("계약") || t.includes("간판") || t.includes("현수막")) {
    agents.push("LEGAL_COMMERCE (공정거래/계약)");
  }
  if (t.includes("이메일") || t.includes("개인정보") || t.includes("보안") || t.includes("아동") || t.includes("청소년") || t.includes("학대") || t.includes("스팸") || t.includes("명예훼손")) {
    agents.push("LEGAL_NET (정보망/아동복지)");
  }
  if (t.includes("리본") || t.includes("홀로코스트") || t.includes("우크라이나") || t.includes("비극") || t.includes("이태원") || t.includes("전쟁") || t.includes("탱크") || t.includes("단테") || t.includes("나수") || t.includes("5/18") || t.includes("4/16") || t.includes("10/29") || t.includes("6/25") || t.includes("4/3")) {
    agents.push("SOCIAL (사회적 논란/재난)");
  }
  if (t.includes("친환경") || t.includes("무독성") || t.includes("그린") || t.includes("esg") || t.includes("탄소") || t.includes("오염")) {
    agents.push("ESG (그린워싱)");
  }
  if (t.includes("비밀번호") || t.includes("주민번호") || t.includes("해킹") || t.includes("도용")) {
    agents.push("PRIVACY (개인정보)");
  }
  if (t.includes("자해") || t.includes("가출") || t.includes("주류") || t.includes("담배")) {
    agents.push("YOUTH (청소년)");
  }
  if (t.includes("특허") || t.includes("상표") || t.includes("카피") || t.includes("라이선스") || t.includes("저작권") || hasImages) {
    agents.push("COPYRIGHT (지식재산권)");
  }
  return agents;
};

interface ReviewTabProps {
  errorText: string | null;
  setErrorText: (err: string | null) => void;
  showKeyAlert: boolean;
  setShowKeyAlert: (show: boolean) => void;
  inputMode: 'text' | 'url';
  setInputMode: (mode: 'text' | 'url') => void;
  inputText: string;
  setInputText: (text: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  additionalContext: string;
  setAdditionalContext: (text: string) => void;
  uploadedImages: {file: File, b64: string}[];
  dragActive: boolean;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearAllImages: () => void;
  removeUploadedImage: (index: number) => void;
  triggerAnalysis: () => Promise<void>;
  loading: boolean;
  analysisProgress: number;
  analysisStatusMsg: string;
  analysisResult: SystemAnalysisResult | null;
  localLlmErrorText: string | null;
  handleCopyMarkdown: () => void;
  copied: boolean;
  setShowPrintModal: (show: boolean) => void;
  analysisMode: 'optimized' | 'full';
  setAnalysisMode: (mode: 'optimized' | 'full') => void;
  getCsatGradeInfo: (score: number) => {
    grade: number;
    label: string;
    isPassed: boolean;
    color: string;
    hasWarning: boolean;
    desc: string;
  };
  getScoreColor: (score: number) => string;
  getMarkdownReportString: () => string;
  makeLawGoLink: (clause: string) => string;
  getSeverityBadge: (severity: 'High' | 'Medium' | 'Low') => string;
}

export function ReviewTab({
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
  getSeverityBadge
}: ReviewTabProps) {
  const { darkMode, fontSize, activeTab, setActiveTab, adapterType, customModel, customApiKey } = useApp();
  const hasCustomKey = !!(customApiKey && customApiKey.trim());
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className={`rounded-2xl border p-4 text-xs leading-relaxed no-print ${
        darkMode ? 'border-amber-500/20 bg-amber-500/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-900'
      }`}>
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-2">
            <p className="font-bold">{GEMINI_TESTED_NOTICE}</p>
            {adapterType !== 'GEMINI' && (
              <button
                type="button"
                onClick={() => { setActiveTab('settings'); setErrorText(null); }}
                className="rounded-md border border-amber-500/30 px-2.5 py-1 text-[11px] font-black text-amber-300 transition-colors hover:bg-amber-500/10"
              >
                Gemini 설정으로 이동
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Urgent Gemini Quota/API Alert Banner */}
      {((errorText && (errorText.includes('Key') || errorText.includes('키') || errorText.includes('API') || errorText.includes('Quota') || errorText.includes('사용량') || errorText.includes('429') || errorText.includes('limit'))) || showKeyAlert) && (
        <div className="p-6 rounded-2xl border-2 border-rose-500 bg-rose-500/10 text-rose-400 space-y-3 no-print animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="font-extrabold text-sm uppercase tracking-wider text-rose-600">Gemini API 연산 긴급 우회 경보</span>
          </div>
          <div className="text-sm space-y-2 leading-relaxed">
            <p className={darkMode ? 'text-rose-300' : 'text-rose-900 font-bold'}>현재 RAG 심의 연산을 처리하는 무료 인프라 공유 <b>Gemini API Key의 사용량 한도(Quota Limit, 429)가 도달</b>했거나, <b>유효한 API 키가 설정되지 않았습니다.</b></p>
            <p className={darkMode ? 'text-rose-400' : 'text-slate-700'}>보안성 및 연산 성능을 온전히 유지하여 독립적인 심의 환경을 수립하고자 하시는 경우, 상단의 <strong className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer" onClick={() => { setActiveTab('settings'); setErrorText(null); }}>[LLM 설정] 탭</strong>으로 이동하셔서 개인용 Gemini API Key를 등록하여 주십시오.</p>
          </div>
          <div className="flex gap-2 pt-1 border-t border-rose-500/20">
            <button
              onClick={() => { setActiveTab('settings'); setErrorText(null); }}
              className="py-1.5 px-3 rounded bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] cursor-pointer"
            >
              설정 탭으로 이동하여 API Key 입력하기 &rarr;
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
                  <span className="text-[10px] font-normal text-slate-505">(선택 - 이미지 또는 URL과 교차 필수)</span>
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
                <span className="text-[10px] font-normal text-slate-505">(선택)</span>
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
                <span className="text-xs font-normal text-slate-505">(선택 - 여러 개 드롭 및 첨부 가능)</span>
              </label>

              <div className="space-y-3">
                {/* Drag & Drop Zone */}
                <label
                  htmlFor="add_file_input"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer block relative ${
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
                  <div className="space-y-2 block">
                    <Upload className="w-7 h-7 text-indigo-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">
                      이미지 파일을 드롭하거나 클릭하여 여러 개 일괄 업로드
                    </p>
                    <p className="text-[10px] text-slate-505">
                      다수의 카드뉴스 배너, 상세페이지 등의 시각적 위반, 승인 마크 도용 자동대조
                    </p>
                  </div>
                </label>

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
                            <p className="text-[11px] font-extrabold text-slate-305 truncate" title={img.file.name}>
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
        </div>

        <div className={`p-4 rounded-xl border mt-4 ${darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
          <span className="block text-xs font-extrabold text-indigo-300 mb-2.5 uppercase tracking-wide">
            ⚙️ 심사 분석 옵션 모드 (Auditing Mode Options)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAnalysisMode('optimized')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                analysisMode === 'optimized'
                  ? 'border-indigo-500 bg-indigo-500/10 text-slate-100 font-extrabold'
                  : darkMode ? 'border-slate-850 bg-slate-950/40 text-slate-400 hover:text-slate-205' : 'border-slate-200 bg-white text-slate-650 hover:text-slate-900'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black">⚡ 토큰 절약 최적화 모드</span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold">권장</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                메인 AI가 문맥을 1차 진단한 뒤, 리스크가 식별된 관련 서브 에이전트만 선택 기동하여 토큰 소모를 최소화합니다.
              </p>
            </button>

            <button
              type="button"
              disabled={!hasCustomKey}
              onClick={() => setAnalysisMode('full')}
              className={`p-3 rounded-xl border text-left transition-all ${
                !hasCustomKey 
                  ? 'opacity-40 cursor-not-allowed border-slate-850 bg-slate-950/20 text-slate-500'
                  : analysisMode === 'full'
                  ? 'border-indigo-500 bg-indigo-500/10 text-slate-100 font-extrabold cursor-pointer'
                  : darkMode ? 'border-slate-850 bg-slate-950/40 text-slate-400 hover:text-slate-205 cursor-pointer' : 'border-slate-200 bg-white text-slate-650 hover:text-slate-900 cursor-pointer'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black">🛡️ 전체 정밀 전수 검사 모드</span>
                {!hasCustomKey && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">개인 Key 필요</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                6개의 전문 에이전트를 생략 없이 일제히 기동하여 모든 법률/사회적 리스크를 빈틈없이 전면 교차 심의합니다.
              </p>
            </button>
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
              <span>준법 감시 위스크 분석이 진행 중입니다...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>초엄격 준법성 자율 규율 검수 시작</span>
            </>
          )}
        </button>

        {loading && (
          <div className={`mt-6 p-6 rounded-2xl border space-y-5 no-print transition-all duration-300 ${darkMode ? 'bg-[#0f1524]/80 border-indigo-500/20' : 'bg-white border-slate-205 shadow-md'}`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-800/10 dark:border-slate-800/50">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>AI 실시간 준법 감시 파이프라인 심사 중</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">{analysisStatusMsg}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-lg font-black text-indigo-400 tracking-tight">{analysisProgress}%</span>
              </div>
            </div>

            <div className="space-y-3.5">
              {[
                {
                  id: 1,
                  title: "1단계: 오케스트레이터 에이전트 기동 및 광고 파싱",
                  desc: "제출된 텍스트 및 이미지 자원 분해 및 메타정보 파싱",
                  completed: analysisProgress >= 20,
                  running: analysisProgress < 20
                },
                {
                  id: 2,
                  title: "2단계: 하이브리드 RAG 엔진 가동 및 법규/판례 키워드 대조",
                  desc: "국가법령 및 위반 사례 데이터베이스 대조 연계 지수 도출",
                  completed: analysisProgress >= 40,
                  running: analysisProgress >= 20 && analysisProgress < 40
                },
                {
                  id: 3,
                  title: "3단계: 오케스트레이터 분석 및 다중 에이전트 라우팅 연산",
                  desc: "부문별 심사 적합성 감별 및 활성 타겟 서브 에이전트 경로 결정",
                  completed: analysisProgress >= 65,
                  running: analysisProgress >= 40 && analysisProgress < 65
                },
                {
                  id: 4,
                  title: "4단계: 다중 전문 에이전트 병렬 협동 검정 구동",
                  desc: "LEGAL(식의약/금융/공정거래/정보망), SOCIAL, ESG, PRIVACY, YOUTH, COPYRIGHT 병렬 심의",
                  completed: analysisProgress >= 85,
                  running: analysisProgress >= 65 && analysisProgress < 85,
                  extraInfo: (analysisProgress >= 65) ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {getPredictedAgents(inputText || websiteUrl, uploadedImages.length > 0).map((ag, idx) => (
                        <span key={idx} className="text-[9px] bg-slate-900 border border-slate-800/80 text-indigo-300 px-2 py-0.5 rounded-md font-mono font-bold">
                          • {ag}
                        </span>
                      ))}
                    </div>
                  ) : null
                },
                {
                  id: 5,
                  title: "5단계: 검출 조항 가중치 집계 및 마케팅 안심 순화안 도출",
                  desc: "최종 벌점 연산, 합격/반려 판정 및 1:1 세이프티 대체 카피 처방",
                  completed: analysisProgress >= 100,
                  running: analysisProgress >= 85 && analysisProgress < 100
                }
              ].map((step) => {
                const isPending = !step.completed && !step.running;
                const hasExtraInfo = 'extraInfo' in step && step.extraInfo;
                return (
                  <div 
                    key={step.id} 
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      step.completed 
                        ? (darkMode ? 'bg-emerald-950/10 border-emerald-900/20 text-slate-300' : 'bg-emerald-550/5 border-emerald-100 text-slate-700')
                        : step.running
                        ? (darkMode ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-200 animate-pulse' : 'bg-indigo-50/50 border-indigo-200 text-indigo-900')
                        : (darkMode ? 'bg-slate-950/30 border-slate-900/60 text-slate-600' : 'bg-slate-50 border-slate-150 text-slate-400')
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {step.completed ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                          <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                        </div>
                      ) : step.running ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                          <Loader2 className="w-3 h-3 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700 dark:border-slate-805 flex items-center justify-center text-[10px] font-bold">
                          {step.id}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <h5 className="font-extrabold text-xs leading-none">{step.title}</h5>
                      <p className="text-[10px] text-slate-500 leading-tight">{step.desc}</p>
                      {hasExtraInfo && (step as any).extraInfo}
                    </div>
                    <div className="shrink-0 text-[10px] font-black uppercase tracking-wider">
                      {step.completed ? (
                        <span className="text-emerald-500 font-bold">완료</span>
                      ) : step.running ? (
                        <span className="text-indigo-400 font-bold animate-pulse">분석 중</span>
                      ) : (
                        <span className="text-slate-505 font-bold">대기</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/85">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 h-1.5 rounded-full transition-all duration-300 ease-out"
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
              <span>분석 처리 안내</span>
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
            <div className="w-16 h-16 rounded-full bg-slate-800/10 dark:bg-slate-805/50 flex items-center justify-center mb-4 text-slate-505 shrink-0">
              <FileText className="w-8 h-8 text-indigo-400" />
            </div>
            <h4 className={`font-black mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-850'}`}>준법 심의 대기 상태</h4>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed mx-auto text-center">
              검증 대상 광고 카피 혹은 웹주소를 입력하고, 상단의 [초엄격 준법성 자율 규율 검수 시작] 버튼을 누르면 RAG 분석에 근거한 준법 보고서가 생성됩니다.
            </p>
          </div>
        )}

        {/* 2nd State: Loading skeleton while asynchronous RAG filters are evaluating */}
        {loading && !analysisResult && (
          <div className="space-y-4 animate-pulse">
            <div className="p-10 text-center rounded-3xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-405 shrink-0" />
              <span className="text-xs text-indigo-305 font-extrabold animate-pulse">{adapterType === 'GEMINI' ? 'Gemini API' : 'OpenAI-Compatible'} ({customModel}) RAG 하이브리드 인텔리전트 심사분류기 동기화 중...</span>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between no-print border-b border-slate-800/20 pb-4 md:pb-2 gap-3">
              <span className="text-xs font-extrabold text-slate-500">📄 심의 결과보고서 인쇄 및 유통 도구:</span>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <button
                  onClick={handleCopyMarkdown}
                  className="w-full sm:w-auto py-2 px-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/25 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400 animate-bounce" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '클립보드 복사완료!' : 'Markdown 리포트 복사'}</span>
                </button>
                
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="w-full sm:w-auto py-2 px-4 rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 animate-pulse"
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

            {analysisResult.ocrFallbackUsed && (
              <div className={`p-5 rounded-2xl border space-y-3 printable-report ${
                darkMode ? 'bg-amber-500/10 border-amber-500/25 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-start gap-2.5">
                  <FileText className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black">OCR 텍스트 기반 이미지 검토로 전환됨</h4>
                    <p className="text-xs leading-relaxed">
                      {analysisResult.ocrNotice || '선택한 모델이 이미지 입력을 직접 처리하지 못하는 것으로 확인되어, 서버 OCR로 추출한 문구만 광고 심사에 반영했습니다.'}
                    </p>
                  </div>
                </div>
                {analysisResult.ocrExtractedText && (
                  <pre className={`max-h-36 overflow-auto whitespace-pre-wrap rounded-xl border p-3 text-[11px] leading-relaxed ${
                    darkMode ? 'bg-slate-950/50 border-amber-500/15 text-slate-200' : 'bg-white/70 border-amber-200 text-slate-800'
                  }`}>
                    {analysisResult.ocrExtractedText}
                  </pre>
                )}
              </div>
            )}

            {/* Token Consumption & Analysis Latency Analytics Box when using LLM */}
            {(analysisResult.usage || analysisResult.analysisTimeMs) && (
              <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 printable-report ${darkMode ? 'bg-indigo-950/20 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-200'}`}>
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-indigo-405 font-extrabold uppercase tracking-widest leading-none mb-1">⚡ 실시간 인프라 심사 연산 제원</span>
                    <span className="text-[11px] text-slate-400 leading-normal">
                      총 {analysisResult.analysisTimeMs ? (analysisResult.analysisTimeMs / 1000).toFixed(2) : '0.00'}초 소요 | {adapterType === 'GEMINI' ? 'Gemini API' : 'OpenAI-Compatible'} ({customModel}) 연동 분석
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-xs font-mono self-end md:self-center">
                  <div className="text-center">
                    <span className="block text-[8px] text-slate-505 mb-0.5 font-bold">ANALYSIS TIME</span>
                    <span className="font-extrabold text-amber-400">{analysisResult.analysisTimeMs ? (analysisResult.analysisTimeMs / 1000).toFixed(2) : '0.00'}<span className="text-[10px] font-normal">s</span></span>
                  </div>
                  <div className="text-slate-705 font-bold">/</div>
                  {analysisResult.usage && (
                    <>
                      <div className="text-center">
                        <span className="block text-[8px] text-slate-505 mb-0.5 font-bold">INPUT TOKENS</span>
                        <span className="font-extrabold text-slate-300">{analysisResult.usage.promptTokens.toLocaleString()}</span>
                      </div>
                      <div className="text-slate-705 font-bold">/</div>
                      <div className="text-center">
                        <span className="block text-[8px] text-slate-505 mb-0.5 font-bold">OUTPUT TOKENS</span>
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
                  <h4 className={`font-black text-sm uppercase tracking-wider ${darkMode ? 'text-indigo-305' : 'text-indigo-950 font-black'}`}>✨ AI 정밀 자율 준법 심의 평론서 (Markdown Live Reader)</h4>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Product Type (물품)", value: analysisResult.parsedMeta.productType || '일반 광고' },
                    { label: "Target Demographic (대상)", value: analysisResult.parsedMeta.targets || '일반 성인' },
                    { label: "Regulatory Domain (규정)", value: analysisResult.parsedMeta.regulatoryDomain || '공정거래규정', colorClass: "text-orange-400" },
                    { label: "Marketing Channel (매체)", value: analysisResult.parsedMeta.channels || '소셜 네트워크' }
                  ].map((card, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150'}`}>
                      <span className="block text-[9px] text-slate-500 uppercase font-bold">{card.label}</span>
                      <span className={`font-extrabold text-xs ${card.colorClass || 'text-slate-200'}`}>{card.value}</span>
                    </div>
                  ))}
                </div>

                {analysisResult.agentsActivated && analysisResult.agentsActivated.length > 0 && (
                  <div className="mt-3 p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                    <span className="block text-[9px] text-indigo-400 font-extrabold uppercase tracking-wide mb-1.5">🛡️ 평가 참여 에이전트 브리핑 (Agent Audit Briefing)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.agentsActivated.map((agent, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-900 border border-slate-800/80 text-indigo-300 px-2.5 py-0.5 rounded-lg font-bold">
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
                            <span className="block text-[9px] text-slate-505 font-bold">식별 텍스트:</span>
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
                            <span className="block text-[9px] text-slate-505 font-bold">비주얼 리스크 소견:</span>
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
                        <p className="text-xs text-slate-300 leading-relaxed mb-3"><strong className="text-slate-505">원인:</strong> {v.description}</p>
                        
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
                  <p className="border-b border-slate-850 pb-2 text-[10px] text-slate-505">법적 하자가 전혀 없는 최적 고매출 전환 대안안을 조합해 드립니다.</p>
                  
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
                        <span className="block font-bold text-xs text-slate-202 mb-1">{law.title}</span>
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
  );
}
