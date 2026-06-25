import { REGULATORY_LIBRARY } from '../../db/regulatoryLibrary';
import {
  getCopyrightProtectionInstruction,
  getEsgGreenwashingInstruction,
  getLegalCommerceInstruction,
  getLegalFinanceInstruction,
  getLegalNetInstruction,
  getOrchestratorRoutingInstruction,
  getPrivacyProtectionInstruction,
  getSocialControversyInstruction,
  getSystemInstruction,
  getYouthProtectionInstruction,
} from '../../prompts/compliancePrompt';

interface FewShotCase {
  readonly inputText: string;
  readonly verdict: string;
  readonly score: number;
  readonly meta: {
    readonly productType: string;
    readonly targets: string;
    readonly regulatoryDomain: string;
  };
}

export interface AnalysisInstructions {
  readonly fullLibraryContext: string;
  readonly fewShotContext: string;
  readonly orchestrator: string;
  readonly legalProduct: string;
  readonly legalFinance: string;
  readonly legalCommerce: string;
  readonly legalNet: string;
  readonly social: string;
  readonly esg: string;
  readonly privacy: string;
  readonly youth: string;
  readonly copyright: string;
}

const buildLawContext = (domains: readonly string[]): string => (
  REGULATORY_LIBRARY
    .filter((article) => domains.includes(article.domain))
    .map((article) => `[${article.clause}] - ${article.text}`)
    .join('\n\n')
);

export const buildFewShotContext = (fewShots: readonly FewShotCase[]): string => (
  fewShots.map((fs, idx) => `[Past Case #${idx + 1}]
- Input Text: "${fs.inputText}"
- Verdict: ${fs.verdict}
- Meta: Product Type: ${fs.meta.productType}, Target: ${fs.meta.targets}, Domain: ${fs.meta.regulatoryDomain}
- Compliance Score: ${fs.score}`).join('\n\n')
);

export const buildAnalysisInstructions = (fewShotContext: string): AnalysisInstructions => {
  const fullLibraryContext = REGULATORY_LIBRARY
    .map((article) => `[${article.clause}] (Tier ${article.tier}) - ${article.text}`)
    .join('\n\n');
  const productLawsContext = buildLawContext(["화장품법", "식품표시광고법", "의료법", "어린이식생활법", "국민건강증진법"]);
  const financeLawsContext = buildLawContext(["금융소비자보호법", "게임산업진흥법"]);
  const commerceLawsContext = buildLawContext(["표시광고법", "소비자기본법", "민법", "전자상거래법", "옥외광고물법"]);
  const netLawsContext = buildLawContext(["정보통신망법", "아동복지법"]);
  const socialLawsContext = REGULATORY_LIBRARY
    .filter((article) => article.tier === 4)
    .map((article) => `[${article.clause}] (Tier ${article.tier}) - ${article.text}`)
    .join('\n\n');

  return {
    fullLibraryContext,
    fewShotContext,
    orchestrator: `${getOrchestratorRoutingInstruction()}\n\n[참조 준법 가이드라인 데이터베이스]\n${fullLibraryContext}`,
    legalProduct: getSystemInstruction(productLawsContext, fewShotContext),
    legalFinance: `${getLegalFinanceInstruction()}\n\n[참조 법령 및 가이드라인]\n${financeLawsContext}`,
    legalCommerce: `${getLegalCommerceInstruction()}\n\n[참조 법령 및 가이드라인]\n${commerceLawsContext}`,
    legalNet: `${getLegalNetInstruction()}\n\n[참조 법령 및 가이드라인]\n${netLawsContext}`,
    social: `${getSocialControversyInstruction()}\n\n[참조 법령 및 가이드라인]\n${socialLawsContext}`,
    esg: getEsgGreenwashingInstruction(),
    privacy: getPrivacyProtectionInstruction(),
    youth: getYouthProtectionInstruction(),
    copyright: getCopyrightProtectionInstruction(),
  };
};
