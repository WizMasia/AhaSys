import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SystemAnalysisResult } from '../types';
import type { UploadedImage } from './useImageUploads';
import { apiClient } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { shouldProbeVisionCapability } from '../../shared/modelCapabilities';

export type AnalysisMode = 'optimized' | 'full';

interface UseAnalysisRunnerParams {
  readonly inputText: string;
  readonly websiteUrl: string;
  readonly additionalContext: string;
  readonly uploadedImages: readonly UploadedImage[];
  readonly adapterType: string;
  readonly customModel: string;
  readonly customEndpoint: string;
  readonly customApiKey: string;
  readonly analysisMode: AnalysisMode;
  readonly refreshHistory: () => Promise<void>;
}

const updateAnalysisProgress = (
  setStatus: Dispatch<SetStateAction<string>>,
  setProgress: Dispatch<SetStateAction<number>>,
  visionProbeExpected: boolean
): void => {
  setProgress((prev) => {
    if (prev >= 95) return prev;
    const remains = 100 - prev;
    const step = Math.max(1, Math.round(remains * 0.12));
    const next = Math.min(95, prev + step);
    if (visionProbeExpected && next < 35) {
      setStatus("1단계: 검증된 비전 모델 카탈로그 대조 및 이미지 처리 가능 여부 probe 중...");
    } else if (visionProbeExpected && next < 55) {
      setStatus("2단계: 이미지 직접 처리 불가 시 서버 OCR 문구 추출 및 텍스트 심사 입력 전환 중...");
    } else if (next < 20) {
      setStatus("1단계: 오케스트레이터 에이전트 기동 및 메타 정보 추출 중...");
    } else if (next < 40) {
      setStatus("2단계: 하이브리드 RAG 엔진 가동 및 대한민국 법규/판례 키워드 대조 중...");
    } else if (next < 65) {
      setStatus("3단계: 오케스트레이터 에이전트 분석 및 다중 도메인 에이전트 라우팅 연산 중...");
    } else if (next < 85) {
      setStatus("4단계: 다중 전문 에이전트 병렬 협동 검정 구동 중 (법률/사회/ESG/개인정보/청소년)...");
    } else {
      setStatus("5단계: 검출 조항 가중치 집계 및 마케팅 안심 순화 대체 텍스트 카피 도출 중...");
    }
    return next;
  });
};

export const useAnalysisRunner = ({
  inputText,
  websiteUrl,
  additionalContext,
  uploadedImages,
  adapterType,
  customModel,
  customEndpoint,
  customApiKey,
  analysisMode,
  refreshHistory,
}: UseAnalysisRunnerParams) => {
  const [loading, setLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatusMsg, setAnalysisStatusMsg] = useState("");
  const [analysisResult, setAnalysisResult] = useState<SystemAnalysisResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [localLlmErrorText, setLocalLlmErrorText] = useState<string | null>(null);
  const [activeAnalysisMode, setAnalysisMode] = useState<AnalysisMode>(analysisMode);

  const triggerAnalysis = async (textToUse: string = inputText): Promise<void> => {
    const hasImages = uploadedImages.length > 0;
    if (!textToUse.trim() && !hasImages && !websiteUrl.trim()) {
      setErrorText("심사할 원문 텍스트나 웹사이트 URL을 입력하거나 검수할 이미지 파일을 한 개 이상 올려주십시오.");
      return;
    }
    setErrorText(null);
    setLocalLlmErrorText(null);
    setLoading(true);
    setAnalysisProgress(3);
    const visionProbeExpected = shouldProbeVisionCapability({
      adapterType,
      modelName: customModel,
      hasImages,
    });
    setAnalysisStatusMsg(visionProbeExpected
      ? "선택한 OpenAI-compatible/로컬 모델의 이미지 처리 가능 여부를 먼저 확인합니다. 지원되지 않으면 서버 OCR로 이미지 문구를 추출해 텍스트 심사로 전환합니다."
      : "오케스트레이터 에이전트 기동 및 광고 원안/이미지 파싱 중...");

    const progressInterval = setInterval(() => {
      updateAnalysisProgress(setAnalysisStatusMsg, setAnalysisProgress, visionProbeExpected);
    }, 450);

    try {
      const hasCustomKey = typeof customApiKey === 'string' && customApiKey.trim();
      const finalMode = hasCustomKey ? activeAnalysisMode : 'optimized';
      const data = await apiClient.analyzeCompliance({
        text: textToUse,
        url: websiteUrl,
        context: additionalContext,
        imagePresent: uploadedImages.length > 0,
        images: uploadedImages.map((img) => img.b64),
        adapter: adapterType,
        modelName: customModel,
        endpoint: customEndpoint,
        apiKey: customApiKey,
        analysisMode: finalMode,
      });

      if (data.error) {
        setErrorText(data.message || "심의 과정 도중 에러가 보고되었습니다.");
      } else {
        setAnalysisResult(data);
        if (data.localLlmError) {
          setLocalLlmErrorText(data.localLlmError);
        }
        await refreshHistory();
      }
    } catch (err) {
      setErrorText(getErrorMessage(err, "서버 컴플라이언스 엔진 연결 중 심각한 예외가 촉발해 통신이 중단되었습니다."));
    } finally {
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setAnalysisStatusMsg("심의 통과 평정 완료!");
      setLoading(false);
    }
  };

  return {
    loading,
    analysisProgress,
    analysisStatusMsg,
    analysisResult,
    setAnalysisResult,
    errorText,
    setErrorText,
    localLlmErrorText,
    analysisMode: activeAnalysisMode,
    setAnalysisMode,
    triggerAnalysis,
  };
};
