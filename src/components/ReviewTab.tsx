/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useApp } from '../contexts/AppContext';
import { AnalysisModePanel } from './review/AnalysisModePanel';
import { AnalysisProgressPanel } from './review/AnalysisProgressPanel';
import { ReviewAlerts } from './review/ReviewAlerts';
import { ReviewDraftWorkspace } from './review/ReviewDraftWorkspace';
import { ReviewFeedback } from './review/ReviewFeedback';
import { ReviewResultPanel } from './review/ReviewResultPanel';
import { StartAnalysisButton } from './review/StartAnalysisButton';
import type { ReviewTabProps } from './review/ReviewTab.types';

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
  getSeverityBadge,
}: ReviewTabProps) {
  const { customApiKey } = useApp();
  const hasCustomKey = Boolean(customApiKey?.trim());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ReviewAlerts
        errorText={errorText}
        setErrorText={setErrorText}
        showKeyAlert={showKeyAlert}
        setShowKeyAlert={setShowKeyAlert}
      />

      <div className="space-y-6">
        <ReviewDraftWorkspace
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
        />
        <AnalysisModePanel
          analysisMode={analysisMode}
          setAnalysisMode={setAnalysisMode}
          hasCustomKey={hasCustomKey}
        />
        <StartAnalysisButton loading={loading} triggerAnalysis={triggerAnalysis} />
        {loading && (
          <AnalysisProgressPanel
            analysisProgress={analysisProgress}
            analysisStatusMsg={analysisStatusMsg}
            inputText={inputText}
            websiteUrl={websiteUrl}
            uploadedImages={uploadedImages}
          />
        )}
        <ReviewFeedback errorText={errorText} localLlmErrorText={localLlmErrorText} />
      </div>

      <div className="space-y-6">
        <ReviewResultPanel
          analysisResult={analysisResult}
          loading={loading}
          copied={copied}
          handleCopyMarkdown={handleCopyMarkdown}
          setShowPrintModal={setShowPrintModal}
          getCsatGradeInfo={getCsatGradeInfo}
          getScoreColor={getScoreColor}
          getMarkdownReportString={getMarkdownReportString}
          inputText={inputText}
          makeLawGoLink={makeLawGoLink}
          getSeverityBadge={getSeverityBadge}
        />
      </div>
    </div>
  );
}
