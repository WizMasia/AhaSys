import { buildPrintImageProposalHtml, buildPrintInputContextHtml, buildPrintScoreHtml, buildPrintViolationsHtml } from './printReportSections';
import type { PrintReportAdapter, PrintReportPayload } from './printReportTypes';

const buildPrintableReportHtml = (payload: PrintReportPayload): string => {
  const reportNumber = Date.now().toString();

  return `<!DOCTYPE html>
<html>
<head>
  <title>광고 법률 자율 무결성 종합 준법 자문보고서 (No. ANSIM-${reportNumber.substring(6)})</title>
  <meta charset="utf-8">
  <style>
    @media print { .no-print { display: none !important; } body { background: white !important; padding: 0 !important; } .page { border: none !important; box-shadow: none !important; max-width: none !important; } }
    body { background: #f1f5f9; color: #0f172a; font-family: 'Apple SD Gothic Neo','Malgun Gothic',sans-serif; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
    .toolbar { width: 100%; max-width: 210mm; background: #1e293b; color: white; padding: 12px 20px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; }
    .toolbar button { border: 0; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 800; cursor: pointer; }
    .btn-print { background: #fbbf24; color: #0f172a; margin-right: 8px; }
    .btn-close { background: #475569; color: white; }
    .page { background: white; width: 100%; max-width: 210mm; min-height: 297mm; box-sizing: border-box; padding: 20mm; border: 1px solid #cbd5e1; box-shadow: 0 10px 15px -3px rgba(0,0,0,.1); }
    .header { border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .official-badge, .section h2, .section-title { font-size: 8px; background: #0f172a; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 800; display: inline-block; }
    .official-badge { background: #4f46e5; letter-spacing: 1px; }
    h1 { font-size: 18px; font-weight: 900; color: #0f172a; margin: 6px 0 2px; font-family: serif; }
    .subtitle { font-size: 8px; color: #64748b; margin: 0; font-family: monospace; letter-spacing: .5px; }
    .stamp { border: 3px double #d97706; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #d97706; font-weight: 900; transform: rotate(12deg); }
    .section { margin-bottom: 20px; }
    .score-grid { display: grid; grid-template-columns: 100px 1fr; gap: 16px; align-items: center; padding: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px; line-height: 1.5; }
    .score-badge { font-size: 32px; font-weight: 900; text-align: center; background: #0f172a; color: white; padding: 8px; border-radius: 12px; }
    .passed { color: #10b981; font-weight: 800; } .rejected { color: #ef4444; font-weight: 800; }
    .context-table { width: 100%; border-collapse: collapse; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 10px; display: table; }
    .context-table th { width: 25%; text-align: left; color: #64748b; padding: 4px 0; } .context-table td { font-weight: 700; color: #0f172a; padding: 4px 0; }
    .context-table .accent { color: #ea580c; } .context-table .mono { color: #4f46e5; font-family: monospace; } .quote { font-style: italic; font-weight: 500; }
    .empty-pass { padding: 16px; text-align: center; border: 1px solid #e2e8f0; border-radius: 8px; color: #059669; font-weight: 800; font-size: 13px; background: #f0fdf4; }
    .violation { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: white; margin-bottom: 12px; page-break-inside: avoid; }
    .violation header { display: flex; justify-content: space-between; gap: 8px; align-items: center; background: #f8fafc; padding: 6px 10px; border-radius: 6px; font-size: 12px; margin-bottom: 8px; }
    .violation header span { background: #0f172a; color: white; border-radius: 9999px; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; margin-right: 6px; }
    .violation header b { color: #dc2626; } .violation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; }
    .violation small, .image-grid small, .visual-draft small { display: block; font-size: 9px; color: #64748b; font-weight: 900; margin-bottom: 2px; }
    .violation p { margin: 0; line-height: 1.4; } .replacement { padding: 6px; background: #f0fdf4; border: 1px solid #d1fae5; border-radius: 4px; color: #064e3b; font-weight: 800; }
    .violation footer { font-size: 8.5px; color: #64748b; margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 6px; }
    .image-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 10.5px; margin: 10px 0 8px; } .image-grid div, .visual-draft { padding: 8px; background: #fcfcfd; border: 1px solid #cbd5e1; border-radius: 6px; }
    .footer { border-top: 1px solid #cbd5e1; padding-top: 16px; margin-top: 24px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; }
  </style>
</head>
<body>
  <div class="toolbar no-print"><strong>📄 실시간 정밀 안전 보고서 새창 뷰어</strong><div><button class="btn-print" onclick="window.print()">🖨️ 인쇄 또는 PDF 저장하기</button><button class="btn-close" onclick="window.close()">창 닫기</button></div></div>
  <div class="page">
    <div class="header"><div><span class="official-badge">OFFICIAL COMPLIANCE REPORT</span><h1>광고 법률 무결성 종합 준법 자문보고서</h1><p class="subtitle">COMPREHENSIVE LAW EVALUATION & AD-AUDITS SYSTEM CERTIFICATE</p></div><div class="stamp">준법필인</div></div>
    <section class="section"><span class="section-title">1. 심의 성능 성적 명세</span>${buildPrintScoreHtml(payload)}</section>
    <section class="section"><span class="section-title">2. 광고 매체 메타포팅 요약</span>${buildPrintInputContextHtml(payload)}</section>
    <section class="section"><span class="section-title">3. 광고 제재 조항 검출 및 벌점 감점 내역 (${payload.analysisResult.violations.length}건)</span>${buildPrintViolationsHtml(payload)}</section>
    ${buildPrintImageProposalHtml(payload)}
    <div class="footer"><div><strong>아하시스턴트 AI 자율 규제 필터 컴플라이언스 센터</strong><p>본 법무 인증 보고서는 대한민국 표시광고 관련 법령 및 고시 기준을 토대로 자율 지식 RAG을 결합해 도출되었습니다.</p></div><div> aHaSys (인)</div></div>
  </div>
</body>
</html>`;
};

export const browserPrintAdapter: PrintReportAdapter = {
  label: '새 창에서 인쇄 및 PDF 저장',
  open(payload) {
    const printWindow = window.open('', '_blank', 'width=900,height=990,scrollbars=yes,resizable=yes');
    if (!printWindow) {
      alert('새 창(팝업)이 브라우저 설정에 의해 차단되었습니다. 팝업 차단을 해제하고 다시 시도하십시오.');
      return;
    }

    printWindow.document.write(buildPrintableReportHtml(payload));
    printWindow.document.close();
  },
};
