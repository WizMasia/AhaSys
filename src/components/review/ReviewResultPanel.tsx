import type { ReviewTabProps } from './ReviewTab.types';
import { ComplianceWorkflowPanels } from './ComplianceWorkflowPanels';
import { GradeSummaryCard } from './GradeSummaryCard';
import { LegalMappingPanel } from './LegalMappingPanel';
import { MarkdownReportPanel } from './MarkdownReportPanel';
import { OcrFallbackNotice } from './OcrFallbackNotice';
import { ResultActionsBar } from './ResultActionsBar';
import { ResultPlaceholder } from './ResultPlaceholder';
import { UsageAnalyticsCard } from './UsageAnalyticsCard';

interface ReviewResultPanelProps {
  readonly analysisResult: ReviewTabProps['analysisResult'];
  readonly loading: boolean;
  readonly copied: boolean;
  readonly handleCopyMarkdown: () => void;
  readonly setShowPrintModal: (show: boolean) => void;
  readonly getCsatGradeInfo: ReviewTabProps['getCsatGradeInfo'];
  readonly getScoreColor: ReviewTabProps['getScoreColor'];
  readonly getMarkdownReportString: () => string;
  readonly inputText: string;
  readonly makeLawGoLink: (clause: string) => string;
  readonly getSeverityBadge: ReviewTabProps['getSeverityBadge'];
}

export function ReviewResultPanel({
  analysisResult,
  loading,
  copied,
  handleCopyMarkdown,
  setShowPrintModal,
  getCsatGradeInfo,
  getScoreColor,
  getMarkdownReportString,
  inputText,
  makeLawGoLink,
  getSeverityBadge,
}: ReviewResultPanelProps) {
  if (!analysisResult) {
    return <ResultPlaceholder hasResult={false} loading={loading} />;
  }

  return (
    <div className="space-y-6">
      <ResultActionsBar
        copied={copied}
        handleCopyMarkdown={handleCopyMarkdown}
        setShowPrintModal={setShowPrintModal}
      />
      <GradeSummaryCard
        analysisResult={analysisResult}
        getCsatGradeInfo={getCsatGradeInfo}
        getScoreColor={getScoreColor}
      />
      <OcrFallbackNotice analysisResult={analysisResult} />
      <UsageAnalyticsCard analysisResult={analysisResult} />
      <MarkdownReportPanel getMarkdownReportString={getMarkdownReportString} />
      <ComplianceWorkflowPanels
        analysisResult={analysisResult}
        inputText={inputText}
        makeLawGoLink={makeLawGoLink}
        getSeverityBadge={getSeverityBadge}
      />
      <LegalMappingPanel analysisResult={analysisResult} makeLawGoLink={makeLawGoLink} />
    </div>
  );
}
