/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  Trash2, 
  Database, 
  AlertTriangle, 
  Copy, 
  FileText 
} from 'lucide-react';

interface HistoryTabProps {
  darkMode: boolean;
  historyItems: any[];
  historySearchQuery: string;
  setHistorySearchQuery: (query: string) => void;
  historyCategoryFilter: string;
  setHistoryCategoryFilter: (filter: string) => void;
  historyVerdictFilter: string;
  setHistoryVerdictFilter: (filter: string) => void;
  clearHistoryLedger: () => Promise<void>;
  setInputText: (text: string) => void;
  restoreHistoryResult: (item: any) => void;
  getCsatGradeInfo: (score: number) => {
    grade: number;
    isPassed: boolean;
    color: string;
    hasWarning: boolean;
  };
}

export function HistoryTab({
  darkMode,
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
  const filteredItems = useMemo(() => {
    return historyItems.filter(item => {
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
    });
  }, [historyItems, historySearchQuery, historyCategoryFilter, historyVerdictFilter]);

  return (
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
          <Database className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-505 pointer-events-none" />
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
            filteredItems.length
          }개</strong> 이력 매치
        </span>
        <span>RAG 피팅 전용 퓨샷 활성화</span>
      </div>

      {/* Time line list views */}
      {historyItems.length === 0 ? (
        <div className="p-12 border border-dashed rounded-3xl text-center text-slate-500 text-xs">
          저장된 자가 학습용 사례 데이터가 아직 없습니다. 최초 실시간 광고안 탐색을 마치는 즉시 기억 소자 노드가 누적됩니다.
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-800 rounded-3xl text-center text-slate-500 text-xs">
          설정한 필터 조건 및 키워드에 부합하는 검토 이력이 없습니다. 검색어를 조율해 보십시오.
        </div>
      ) : (
        <div className="relative border-l-2 border-indigo-500/20 pl-6 ml-4 space-y-6 py-2">
          {filteredItems.map((item, idx) => (
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
                
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-850/40 pt-3 flex-wrap gap-2">
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
                      className={`py-1 px-2.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                        darkMode ? 'border-slate-800 bg-slate-805 hover:bg-slate-800 text-slate-350' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                      title="기 연산된 상세보고서 뷰어 즉시 로드"
                    >
                      <FileText className="w-3 h-3 text-indigo-400" />
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
  );
}
