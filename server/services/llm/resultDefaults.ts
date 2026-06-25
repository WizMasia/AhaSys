export const BASE_SCORE = 100;
export const DEFAULT_PRODUCT_TYPE = "일반광고";
export const DEFAULT_TARGETS = "일반 대중";
export const DEFAULT_REGULATORY_DOMAIN = "표시광고법";
export const DEFAULT_CHANNELS = "모든 채널";

export function generateDefaultActionPlan(originalFragment: string, replacement: string, lawDomain: string): string[] {
  const fragmentName = originalFragment || '논란구절';
  const replacementName = replacement || '대안문구';
  const domainName = lawDomain || '관련법';

  return [
    `1단계: [즉각 중단] 즉시 해당 광고 카피 내용의 게재 및 인쇄 배포를 일시중단하여 불법 유통 노출을 선제적으로 완전히 차단합니다.`,
    `2단계: [일대일 변경] 지목된 과장 표현 부위인 '${fragmentName}'을 세련되고 합법적인 안전 대안 문장인 '${replacementName}'(으)로 1:1 전면 교정 패치 처리합니다.`,
    `3단계: [인증 및 실증 확보] ${domainName} 규정에 근거하여, 해당 성분이나 효능에 대한 정량적 연구 논문 및 시험성적 검증 문서를 서면 대조 확보하여 보관소에 정리 보관합니다.`,
    `4단계: [시뮬레이션 재심의] 변경 완료된 조감 광고 시안을 '아하시스턴트(aHaSys)' 무결성 심사창에 재전송하여 2차 자율 심의 점수 80점 이상 안정 합격 여부를 최종 확인하는 모니터링 연쇄 장치를 적용합니다.`,
    `5단계: [캠페인 복구 및 준법 교육] 최종 안전 통과된 광고를 매체에 정상 신규 릴리즈 조치하며, 연관 기획팀 전원에게 동일 규정 미준수가 재발되지 않고 예방되도록 5단계 대처 표준 교육을 실행합니다.`
  ];
}
