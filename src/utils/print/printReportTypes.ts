import type { SystemAnalysisResult } from '../../types';

export interface PrintReportPayload {
  readonly analysisResult: SystemAnalysisResult;
  readonly inputText: string;
  readonly websiteUrl: string;
  readonly additionalContext: string;
}

export interface PrintReportAdapter {
  readonly label: string;
  readonly open: (payload: PrintReportPayload) => void;
}
