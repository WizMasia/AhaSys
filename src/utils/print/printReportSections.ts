import { getCsatGradeInfo, makeLawGoLink } from '../report';
import type { PrintReportPayload } from './printReportTypes';

export const buildPrintInputContextHtml = ({
  analysisResult,
  inputText,
  websiteUrl,
  additionalContext,
}: PrintReportPayload): string => `
  <table class="context-table">
    <tr><th>제품 대분류</th><td>${analysisResult.parsedMeta.productType || '일반 표시광고'}</td></tr>
    <tr><th>조사 특별법령</th><td class="accent">${analysisResult.parsedMeta.regulatoryDomain || '기본 표시광고법'}</td></tr>
    ${inputText.trim() ? `<tr><th>제출 광고 원안</th><td class="quote">"${inputText}"</td></tr>` : ''}
    ${websiteUrl.trim() ? `<tr><th>심사 웹페이지 URL</th><td class="mono">${websiteUrl}</td></tr>` : ''}
    ${additionalContext.trim() ? `<tr><th>추가 맥락</th><td class="quote">"${additionalContext}"</td></tr>` : ''}
    ${analysisResult.agentsActivated?.length ? `<tr><th>참여 에이전트</th><td>${analysisResult.agentsActivated.join(', ')}</td></tr>` : ''}
  </table>
`;

export const buildPrintViolationsHtml = ({ analysisResult }: PrintReportPayload): string => {
  if (analysisResult.violations.length === 0) {
    return '<div class="empty-pass">✔ 축하합니다! 검출된 위반 조항이나 감점이 없어 1등급 무결성으로 통과를 수여합니다.</div>';
  }

  return analysisResult.violations.map((violation, index) => `
    <article class="violation">
      <header>
        <strong><span>${index + 1}</span><u>${violation.clause}</u></strong>
        <b>적발 감점: -${violation.deductionPoints}점 | 위험도: ${violation.severity}</b>
      </header>
      <div class="violation-grid">
        <section>
          <small>법위 위법 소견 (Risk Statement):</small>
          <p>${violation.description}</p>
          <em>위해구절: "${violation.originalFragment}"</em>
        </section>
        <section class="replacement">
          <small>대체 정정 필터 카피 (Compliance Suggestion):</small>
          <p>"${violation.replacement}"</p>
        </section>
      </div>
      <footer>⚖ 법률 조문 연계: <a href="${makeLawGoLink(violation.clause)}" target="_blank">${violation.clause} 국가법령정보시스템 바로가기</a></footer>
    </article>
  `).join('');
};

export const buildPrintImageProposalHtml = ({ analysisResult }: PrintReportPayload): string => {
  const proposal = analysisResult.imageAlternativeProposal;
  if (!proposal) return '';

  return `
    <section class="section">
      <h2>4. 이미지 비주얼 멀티모달 Vision 정밀 교정 보고</h2>
      <div class="image-grid">
        <div><small>원안 시각적 부적합 카피 (OCR)</small><p>${proposal.detectedVisualCopys?.join(', ') || '없음'}</p></div>
        <div><small>수정 시각적 조치 권고사항</small><p>${proposal.visualRemediationSteps?.join(' / ') || '없음'}</p></div>
      </div>
      <div class="visual-draft"><small>법률 우회 처방 레이아웃 시안 및 지침</small><p>${proposal.alternativeVisualDraft}</p></div>
    </section>
  `;
};

export const buildPrintScoreHtml = ({ analysisResult }: PrintReportPayload): string => {
  const gradeInfo = getCsatGradeInfo(analysisResult.score);

  return `
    <div class="score-grid">
      <div class="score-badge">${analysisResult.score}점</div>
      <div>
        과적 벌점 연산 결과 귀사는 종합 품질 평점 <strong>${analysisResult.score}점</strong>으로 최종 성적 <strong>${gradeInfo.grade}등급</strong>을 선고받았습니다.<br/>
        <span class="${gradeInfo.isPassed ? 'passed' : 'rejected'}">${gradeInfo.isPassed ? '✔ 자율 가중 기준 합격 규격을 충족합니다.' : '❌ 규격 결함에 의한 자진 제재 정정이 즉시 권고됩니다.'}</span>
      </div>
    </div>
  `;
};
