import { Printer } from 'lucide-react';
import type { SystemAnalysisResult } from '../../types';
import { getCsatGradeInfo, makeLawGoLink } from '../../utils/report';

interface PrintReportModalProps {
  readonly analysisResult: SystemAnalysisResult;
  readonly inputText: string;
  readonly websiteUrl: string;
  readonly additionalContext: string;
  readonly onOpenPrintTab: () => void;
  readonly onClose: () => void;
}

export function PrintReportModal({
  analysisResult,
  inputText,
  websiteUrl,
  additionalContext,
  onOpenPrintTab,
  onClose,
}: PrintReportModalProps) {
  const gradeInfo = getCsatGradeInfo(analysisResult.score);

  return (
    <div
      id="print-only-modal-container"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto p-4 sm:p-8 flex flex-col items-center"
    >
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
            onClick={onOpenPrintTab}
            className="py-2 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] rounded-lg hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>새 창에서 인쇄 및 PDF 저장</span>
          </button>
          <button
            onClick={onClose}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-extrabold text-[11px] rounded-lg transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>

      <div
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-950 p-6 sm:p-[15mm] shadow-2xl relative border border-slate-300 flex flex-col justify-between font-sans text-xs select-text antialiased leading-relaxed printable-report"
        style={{ pageBreakInside: 'avoid' }}
      >
        <div>
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

          <div className="space-y-4 flex-1">
            <div className="p-4 border border-slate-300 rounded-xl bg-slate-50 space-y-3">
              <div className="flex items-center justify-between gap-4 border-b border-slate-250 pb-2">
                <span className="text-[9.5px] font-black bg-slate-900 text-white px-2 py-0.5 rounded">1. 심의 성능 성적 명세</span>
                <span className="text-[9px] font-bold text-slate-500">감수 일자: {new Date().toLocaleDateString('ko-KR')}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="space-y-1 text-left flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11.5px] font-black text-slate-900">최종 심사 등급:</span>
                    <span className="text-[10.5px] font-black text-slate-900 underline decoration-2 decoration-amber-500">{gradeInfo.label}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${gradeInfo.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {gradeInfo.isPassed ? '합격 (PASSED)' : '심사탈락 (REJECTED)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-700 leading-normal font-medium">
                    {gradeInfo.desc} 본 평론 시안은 광고법 제9조 부당기만 배제 가이드와 개별 마케팅 특별 법률 감점 가중치 매트릭스에 기해 생성되었습니다.
                  </p>
                </div>

                <div className="flex items-center gap-2 md:col-span-4 shrink-0">
                  <div className="w-16 h-16 bg-slate-950 text-white rounded-xl flex flex-col items-center justify-center font-bold">
                    <span className="text-xl font-serif leading-none">{gradeInfo.grade}</span>
                    <span className="text-[7.5px] tracking-widest mt-0.5">등급</span>
                  </div>
                  <div className="w-14 h-14 rounded-full border-4 border-slate-950 flex flex-col items-center justify-center text-slate-950 font-bold shrink-0">
                    <span className="text-base leading-none font-black">{analysisResult.score}</span>
                    <span className="text-[7px] font-bold mt-0.5">SCORE</span>
                  </div>
                </div>
              </div>
            </div>

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
                    <p className="text-[10px] text-slate-800 italic leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto bg-white p-2 border border-slate-200 rounded mt-0.5 font-medium">&quot;{inputText}&quot;</p>
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

            <div className="space-y-1.5">
              <span className="text-[9.5px] font-black bg-slate-900 text-white px-2 py-0.5 rounded">3. 광고 제재 조항 검출 및 벌점 감점 내역 ({analysisResult.violations.length}건)</span>
              {analysisResult.violations.length === 0 ? (
                <div className="p-4 rounded-xl text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 dark:text-emerald-400 text-xs font-bold">
                  ✔ 축하합니다! 검출된 위반 조항이나 감점이 없어 1등급 무결성으로 통과를 수여합니다.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {analysisResult.violations.map((violation, index) => (
                    <div key={violation.id || index} className="p-2.5 border border-slate-200 rounded-lg bg-white space-y-1.5 page-break-avoid">
                      <div className="flex justify-between items-center bg-slate-50 p-1 rounded-md text-[9.5px]">
                        <span className="font-extrabold text-slate-900 flex items-center gap-1">
                          <span className="bg-slate-950 text-white text-[8.5px] w-4 h-4 rounded-full flex items-center justify-center font-bold shrink-0">{index + 1}</span>
                          <span className="underline decoration-indigo-400">{violation.clause}</span>
                        </span>
                        <span className="font-extrabold text-rose-600 font-mono">(적발 감점: -{violation.deductionPoints}점) | 위험도: {violation.severity}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px] text-left leading-normal">
                        <div className="space-y-0.5">
                          <span className="block text-[8px] text-rose-600 font-black">법위 위법 소견 (Risk Statement):</span>
                          <p className="text-slate-800 font-medium">{violation.description}</p>
                          <span className="block font-bold text-slate-605">위해구절: <span className="font-mono text-rose-600 font-extrabold">&quot;{violation.originalFragment}&quot;</span></span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="block text-[8px] text-emerald-600 font-black">대체 정정 필터 카피 (Compliance Suggestion):</span>
                          <p className="text-emerald-950 font-extrabold bg-emerald-100/30 p-1 rounded leading-normal border border-emerald-100">&quot;{violation.replacement}&quot;</p>
                        </div>
                      </div>
                      <div className="text-[8px] text-left text-slate-500">
                        ⚖️ 법률 조문 연계: <a href={makeLawGoLink(violation.clause)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-extrabold hover:text-indigo-800">{violation.clause} 국가법령정보시스템(Law.go.kr) 원문 보기 &rarr;</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                  <p className="text-slate-900 leading-normal italic bg-white p-2 border border-indigo-100 rounded text-[9.5px]">{analysisResult.imageAlternativeProposal.alternativeVisualDraft}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-300 mt-4 text-[9px] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="text-slate-500 max-w-lg leading-relaxed">
            본 미리보기는 PDF 저장용 A4 보고서 레이아웃입니다. 실제 보고서 인쇄는 새 창 뷰어에서 처리됩니다.
          </div>
          <div className="text-right font-black text-slate-900">aHaSys (인)</div>
        </div>
      </div>
    </div>
  );
}
