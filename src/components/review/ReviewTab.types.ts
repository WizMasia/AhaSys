import type { ChangeEvent, DragEvent } from 'react';
import type { SystemAnalysisResult } from '../../types';

export type ReviewInputMode = 'text' | 'url';
export type AnalysisMode = 'optimized' | 'full';
export type Severity = 'High' | 'Medium' | 'Low';

export interface UploadedImage {
  readonly file: File;
  readonly b64: string;
}

export interface CsatGradeInfo {
  readonly grade: number;
  readonly label: string;
  readonly isPassed: boolean;
  readonly color: string;
  readonly hasWarning: boolean;
  readonly desc: string;
}

export interface ReviewTabProps {
  readonly errorText: string | null;
  readonly setErrorText: (err: string | null) => void;
  readonly showKeyAlert: boolean;
  readonly setShowKeyAlert: (show: boolean) => void;
  readonly inputMode: ReviewInputMode;
  readonly setInputMode: (mode: ReviewInputMode) => void;
  readonly inputText: string;
  readonly setInputText: (text: string) => void;
  readonly websiteUrl: string;
  readonly setWebsiteUrl: (url: string) => void;
  readonly additionalContext: string;
  readonly setAdditionalContext: (text: string) => void;
  readonly uploadedImages: readonly UploadedImage[];
  readonly dragActive: boolean;
  readonly handleDrag: (e: DragEvent) => void;
  readonly handleDrop: (e: DragEvent) => void;
  readonly handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly clearAllImages: () => void;
  readonly removeUploadedImage: (index: number) => void;
  readonly triggerAnalysis: () => Promise<void>;
  readonly loading: boolean;
  readonly analysisProgress: number;
  readonly analysisStatusMsg: string;
  readonly analysisResult: SystemAnalysisResult | null;
  readonly localLlmErrorText: string | null;
  readonly handleCopyMarkdown: () => void;
  readonly copied: boolean;
  readonly setShowPrintModal: (show: boolean) => void;
  readonly analysisMode: AnalysisMode;
  readonly setAnalysisMode: (mode: AnalysisMode) => void;
  readonly getCsatGradeInfo: (score: number) => CsatGradeInfo;
  readonly getScoreColor: (score: number) => string;
  readonly getMarkdownReportString: () => string;
  readonly makeLawGoLink: (clause: string) => string;
  readonly getSeverityBadge: (severity: Severity) => string;
}
