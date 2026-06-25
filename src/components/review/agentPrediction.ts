const AGENT_KEYWORDS = [
  { label: 'LEGAL_FINANCE (금융/게임)', terms: ['수익', '원금', '금리', '투자', '대출', '게임', '확률', '뽑기'] },
  { label: 'LEGAL_COMMERCE (공정거래/계약)', terms: ['광고', '1위', '최초', '소비자', '환불', '취소', '계약', '간판', '현수막'] },
  { label: 'LEGAL_NET (정보망/아동복지)', terms: ['이메일', '개인정보', '보안', '아동', '청소년', '학대', '스팸', '명예훼손'] },
  { label: 'SOCIAL (사회적 논란/재난)', terms: ['리본', '홀로코스트', '우크라이나', '비극', '이태원', '전쟁', '탱크', '단테', '나수', '5/18', '4/16', '10/29', '6/25', '4/3'] },
  { label: 'ESG (그린워싱)', terms: ['친환경', '무독성', '그린', 'esg', '탄소', '오염'] },
  { label: 'PRIVACY (개인정보)', terms: ['비밀번호', '주민번호', '해킹', '도용'] },
  { label: 'YOUTH (청소년)', terms: ['자해', '가출', '주류', '담배'] },
  { label: 'COPYRIGHT (지식재산권)', terms: ['특허', '상표', '카피', '라이선스', '저작권'] },
] as const;

export function getPredictedAgents(text: string, hasImages: boolean): readonly string[] {
  const normalizedText = text.toLowerCase();
  const agents = ['LEGAL_PRODUCT (식의약/보건)'];

  for (const rule of AGENT_KEYWORDS) {
    if (rule.terms.some((term) => normalizedText.includes(term)) || (rule.label.startsWith('COPYRIGHT') && hasImages)) {
      agents.push(rule.label);
    }
  }

  return agents;
}
