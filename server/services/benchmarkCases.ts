interface BenchmarkTemplate {
  readonly category: string;
  readonly name: string;
  readonly inputText: string;
  readonly expectedViolations: number;
}

export interface GeneratedBenchmarkCase {
  readonly id: string;
  readonly category: string;
  readonly name: string;
  readonly inputText: string;
  readonly expectedViolations: number;
}

export const BENCHMARK_TEMPLATES: readonly BenchmarkTemplate[] = [
  {
    category: "Modern Web / SNS Ads",
    name: "[기만] 인공지능 주름 지우개 미백 화장품",
    inputText: "SNS 대유행! 인공지능이 세포를 찾아가 아토피를 완치하는 획기적인 주름 미백 지우개 크림 복합 세트 런칭.",
    expectedViolations: 1
  },
  {
    category: "Modern Web / SNS Ads",
    name: "[과장] 즉각 연소 하루 완치 다이어트 쉐이크",
    inputText: "이 쉐이크만 하루 3번 마시면 체지방이 100% 즉시 분해 연소되고 요요 현상이 평생 차단되는 기적의 임상 완료!",
    expectedViolations: 1
  },
  {
    category: "Modern Web / SNS Ads",
    name: "[금융] 고수익 확정 및 원금 보장 기만 사모펀드",
    inputText: "원금 100% 무손실 보장! 매달 25% 확정 금리 배당을 지급하는 무위험 고수익 재테크 사모 펀드 선착순 마감 공지.",
    expectedViolations: 1
  },
  {
    category: "Modern Web / SNS Ads",
    name: "[보건] 무증빙 당뇨 치료 한방 만약",
    inputText: "말기 고혈압 및 각종 대형 암 세포를 억제하고 면역을 완전 치료해 주는 신비의 무독성 한방 안심 면역 수소수.",
    expectedViolations: 1
  },
  {
    category: "Modern Web / SNS Ads",
    name: "[사행] 확률형 아이템 100% 획득 조작 팩",
    inputText: "즉시 100% 최강의 레전드 뽑기 획득 보장! 친구들의 게임 계정을 박살내는 확률형 울트라 상자 한정 패키지.",
    expectedViolations: 1
  },
  {
    category: "Historical Ads (1920-2000)",
    name: "1920년대 라듐 방사능 만병통치 천연 미백 미용수",
    inputText: "빛나는 젊음의 특권! 진짜 라듐 성분이 함유되어 피부 세포를 활성화하고 기미와 아토피를 영구 완치하는 만병통치형 라듐 토닉.",
    expectedViolations: 1
  },
  {
    category: "Historical Ads (1920-2000)",
    name: "1950년대 의사 추천 건강 치료 필터 담배",
    inputText: "폐를 완벽히 보호하고 목 질환을 즉시 치료해서 전 세계 의사들이 적극 강력 권장하는 마법의 천연 필터 건강 담배 특판.",
    expectedViolations: 1
  },
  {
    category: "Historical Ads (1920-2000)",
    name: "1970년대 세포 자생 완치 우황 인삼 오일",
    inputText: "만병의 근원인 피로를 즉시 완치하고 소아 발육 및 체지방을 억제해 주는 동양 신비의 천연 우황 인삼 활력 영양 앰플.",
    expectedViolations: 1
  },
  {
    category: "Historical Ads (1920-2000)",
    name: "1990년대 원금 500% 초고속 벤처 펀드",
    inputText: "확정 이율 연 45% 최저 보증! 파격적인 정부 주도 닷컴 벤처 특별 사모 펀드로 원금 손실 걱칙 없이 초고수익 보증.",
    expectedViolations: 1
  },
  {
    category: "Historical Ads (1920-2000)",
    name: "2000년대 미니홈피 도토리 자동 무한 복사기",
    inputText: "클릭 한 번으로 도토리 매일 1000개 영구 자동 복사 보장! 소유권 획득 즉시 무제한 발행 불법 차단 우회 안심 프로그램.",
    expectedViolations: 1
  },
  {
    category: "Historical Tragedy Abuse (Tier 4 Violation)",
    name: "세월호 리본 상업적 오용 목걸이 특가",
    inputText: "기억해야 할 세월호 참사를 추모하며 기획한 노란 리본 목걸이 펜던트 할인 특가전! 수익금의 극히 일부를 유족 도울 수전으로 기증합니다.",
    expectedViolations: 1
  },
  {
    category: "Historical Tragedy Abuse (Tier 4 Violation)",
    name: "우크라이나 폭격 참사 아토피 피부 재생 크림",
    inputText: "전쟁의 아픔과 상흔처럼 붉게 얼룩진 청소년 등 여드름 자국 아토피! 참화 속에서도 맑게 피어나는 우크라이나 완치 크림.",
    expectedViolations: 1
  },
  {
    category: "Historical Tragedy Abuse (Tier 4 Violation)",
    name: "이태원 비극 핼러윈 호러 체리 시럽 패키지",
    inputText: "이태원 비극의 골목을 붉게 장식하는 할로윈 비명 패키지 판매! 피를 상징하는 붉은 피 시럽 제공으로 공포 분위기 연출.",
    expectedViolations: 1
  },
  {
    category: "Historical Tragedy Abuse (Tier 4 Violation)",
    name: "홀로코스트 추모 한정판 프리미엄 골드 초콜릿",
    inputText: "진중한 역사적 비극 홀로코스트 추모 기획! 깊고 씁쓸한 카카오의 원액을 전면에 배합하여 만든 극강의 참상 조문 초코 바.",
    expectedViolations: 1
  },
  {
    category: "Compliant / Safe Ads",
    name: "친환경 리얼 참나무 미니멀 가구 리빙 거울 (안전)",
    inputText: "오래 쓰는 견고한 리얼 참나무 가구 시리즈입니다. 공간 미학을 높이고 눈의 편안함을 선사하는 미니멀 디자인 경대.",
    expectedViolations: 0
  },
  {
    category: "Compliant / Safe Ads",
    name: "자연재배 완숙 토마토 산지직송 포장 (안전)",
    inputText: "자연 친화적 농법으로 정성껏 키운 완숙 토마토입니다. 아침 주스나 일상의 영양 섭취에 유용하도록 풍부한 수분을 머금고 있습니다.",
    expectedViolations: 0
  },
  {
    category: "Compliant / Safe Ads",
    name: "저소음 아날로그 침실 디자인 벽시계 (안전)",
    inputText: "한밤중에도 평온한 수면을 방해하지 않는 아날로그 무소음 벽시계입니다. 모던한 주방 벽 연출에 잘 어울립니다.",
    expectedViolations: 0
  },
  {
    category: "Compliant / Safe Ads",
    name: "고풍량 하이브리드 무선 서큘레이터형 팬 (안전)",
    inputText: "실내 공기 순환을 자연스럽고 쾌적하게 돕는 하이브리드 입방 바람 순환 기기입니다. 3단계 제어를 실증 테스트 완료했습니다.",
    expectedViolations: 0
  },
  {
    category: "Compliant / Safe Ads",
    name: "순면 100% 저자극 흡수 유아용 가공패드 (안전)",
    inputText: "지친 아기 피부를 보드랍고 포근하게 감싸주는 친환경 순면 기저귀입니다. 일상의 쾌적함과 고유의 안전 규격을 모두 합격했습니다.",
    expectedViolations: 0
  }
];

interface BenchmarkVariant {
  readonly name: string;
  readonly inputText: string;
}

const buildBenchmarkVariant = (tmpl: BenchmarkTemplate, itemNum: string, index: number): BenchmarkVariant => {
  if (tmpl.expectedViolations > 0) {
    if (tmpl.inputText.includes("체지방")) {
      const inputText = tmpl.inputText
        .replace("100% 즉시 분해", `${70 + (index % 25)}% 세포 급속 분해 연소`)
        .replace("하루 3번", `하루 ${2 + (index % 3)}회`);

      return { name: tmpl.name, inputText };
    }

    if (tmpl.inputText.includes("아토피")) {
      return {
        name: tmpl.name,
        inputText: tmpl.inputText.replace("하루만에", `${2 + (index % 3)}일 만에`)
      };
    }

    if (tmpl.inputText.includes("원금 100%")) {
      return {
        name: tmpl.name,
        inputText: tmpl.inputText.replace("25%", `${10 + (index % 20)}%`)
      };
    }

    if (tmpl.inputText.includes("노란 리본")) {
      return {
        name: `[참사오용 No.${itemNum}] 세월호 리본 참사 마케팅 특별가전`,
        inputText: tmpl.inputText.replace("할인 특가전!", `한정 추모 오용 목걸이 특가 런칭 (No.${index})!`)
      };
    }

    if (tmpl.inputText.includes("대출")) {
      return {
        name: tmpl.name,
        inputText: tmpl.inputText.replace("청소년", `소외 청소년 및 대입 수험생 (No.${index})`)
      };
    }
  }

  if (tmpl.inputText.includes("토마토")) {
    return {
      name: tmpl.name,
      inputText: tmpl.inputText.replace("완숙 토마토입니다.", `정직하게 수확해 낸 무농약 완숙 토마토 세트 (일괄 ${4 + (index % 5)}kg).`)
    };
  }

  if (tmpl.inputText.includes("벽시계")) {
    return {
      name: tmpl.name,
      inputText: tmpl.inputText.replace("무소음", `지속 충전형 저소음 특허 아날로그 무브먼트`)
    };
  }

  return {
    name: tmpl.name,
    inputText: tmpl.inputText
  };
};

export const generateLargeBenchmarkCases = (): GeneratedBenchmarkCase[] => {
  const resultList: GeneratedBenchmarkCase[] = [];
  for (let i = 1; i <= 20000; i++) {
    const tmpl = BENCHMARK_TEMPLATES[(i - 1) % BENCHMARK_TEMPLATES.length];
    const itemNum = String(i).padStart(5, '0');
    const variant = buildBenchmarkVariant(tmpl, itemNum, i);
    const suffixes = ["", " [신규]", " [특별 기획]", " [추천]", " [인기]", " [화제]", " [시즌 한정]", " [단독 수입]", " [체험단 모집]", " [실시간 할인]"];
    const suffix = suffixes[i % suffixes.length];

    resultList.push({
      id: `case_${itemNum}`,
      category: tmpl.category,
      name: `${tmpl.category === "Compliant / Safe Ads" ? "🟢 [안심]" : "🚨 [위반]"} No.${itemNum} - ${variant.name.replace(/\[.*\]\s*/g, "")}${suffix}`,
      inputText: `${variant.inputText} (${i})`,
      expectedViolations: tmpl.expectedViolations
    });
  }
  return resultList;
};

export const BENCHMARK_CASES = generateLargeBenchmarkCases();
