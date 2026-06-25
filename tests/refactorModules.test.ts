import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { pickRandomBenchmarkCases, runBenchmarkSuite } from '../server/services/benchmarkRunner';
import { BENCHMARK_CASES } from '../server/services/benchmarkCases';
import { retrieveGuidelines } from '../server/services/rag';
import {
  ProviderRateLimitError,
  isProviderRateLimitError,
  MissingApiKeyError,
} from '../server/services/llmService';
import { modelSupportsVision, shouldProbeVisionCapability } from '../shared/modelCapabilities';

const benchTmp = mkdtempSync(join(tmpdir(), 'ahasys-verify-'));
const benchOptions = {
  casesDir: join(benchTmp, 'cases'),
  summaryFilePath: join(benchTmp, 'test_runs.json'),
  readmeFilePath: join(benchTmp, 'README.md'),
};

describe('shared/modelCapabilities', () => {
  it('treats gemini-2.5-flash as vision-capable', () => {
    assert.equal(modelSupportsVision('gemini-2.5-flash'), true);
  });
  it('treats gpt-4o-mini as vision-capable', () => {
    assert.equal(modelSupportsVision('gpt-4o-mini'), true);
  });
  it('treats qwen2.5-vl-7b as vision-capable', () => {
    assert.equal(modelSupportsVision('qwen2.5-vl-7b'), true);
  });
  it('treats gemma-2-9b as text-only', () => {
    assert.equal(modelSupportsVision('gemma-2-9b'), false);
  });
  it('returns false for empty/undefined/null model name', () => {
    assert.equal(modelSupportsVision(''), false);
    assert.equal(modelSupportsVision(undefined), false);
    assert.equal(modelSupportsVision(null), false);
  });
  it('skips probe for GEMINI with images', () => {
    assert.equal(
      shouldProbeVisionCapability({ adapterType: 'GEMINI', modelName: 'gemini-2.5-flash', hasImages: true }),
      false,
    );
  });
  it('probes when non-vision adapter + images are present', () => {
    assert.equal(
      shouldProbeVisionCapability({ adapterType: 'OLLAMA', modelName: 'gemma2:9b', hasImages: true }),
      true,
    );
  });
  it('skips probe when there are no images', () => {
    assert.equal(
      shouldProbeVisionCapability({ adapterType: 'OLLAMA', modelName: 'gemma2:9b', hasImages: false }),
      false,
    );
  });
  it('skips probe for catalog-matched openai model', () => {
    assert.equal(
      shouldProbeVisionCapability({ adapterType: 'OPENAI', modelName: 'gpt-4o', hasImages: true }),
      false,
    );
  });
});

describe('llmService error classes', () => {
  it('isProviderRateLimitError matches ProviderRateLimitError instance', () => {
    assert.equal(isProviderRateLimitError(new ProviderRateLimitError('x')), true);
  });
  it('isProviderRateLimitError matches 429 quota exceeded message', () => {
    assert.equal(isProviderRateLimitError(new Error('429 quota exceeded')), true);
  });
  it('isProviderRateLimitError matches RESOURCE_EXHAUSTED message', () => {
    assert.equal(isProviderRateLimitError(new Error('RESOURCE_EXHAUSTED: x')), true);
  });
  it('isProviderRateLimitError returns false for unrelated errors', () => {
    assert.equal(isProviderRateLimitError(new Error('nope')), false);
  });
  it('isProviderRateLimitError tolerates non-Error values', () => {
    assert.equal(isProviderRateLimitError('quota exceeded'), true);
    assert.equal(isProviderRateLimitError(null), false);
    assert.equal(isProviderRateLimitError(undefined), false);
    assert.equal(isProviderRateLimitError(42), false);
  });
  it('ProviderRateLimitError carries code=QUOTA_EXCEEDED', () => {
    const e = new ProviderRateLimitError('boom');
    assert.equal(e.code, 'QUOTA_EXCEEDED');
    assert.equal(e.name, 'ProviderRateLimitError');
  });
  it('MissingApiKeyError carries code=MISSING_API_KEY and is not a rate-limit error', () => {
    const e = new MissingApiKeyError('no key');
    assert.equal(isProviderRateLimitError(e), false);
    assert.equal((e as { code?: string }).code, 'MISSING_API_KEY');
  });
});

describe('benchmark generation & sampling', () => {
  it('BENCHMARK_CASES is the full 20k corpus', () => {
    assert.equal(BENCHMARK_CASES.length, 20000);
  });
  it('pickRandomBenchmarkCases(50) returns 50 unique ids', () => {
    const sample = pickRandomBenchmarkCases(50);
    assert.equal(sample.length, 50);
    assert.equal(new Set(sample.map((c) => c.id)).size, 50);
  });
  it('pickRandomBenchmarkCases(0) returns an empty list', () => {
    assert.equal(pickRandomBenchmarkCases(0).length, 0);
  });
  it('pickRandomBenchmarkCases caps the result at the corpus size', () => {
    assert.equal(pickRandomBenchmarkCases(50000).length, 20000);
  });
  it('benchmark cases have well-formed id, category, and inputText', () => {
    for (const c of pickRandomBenchmarkCases(20)) {
      assert.match(c.id, /^case_\d{5}$/);
      assert.ok(c.category.length > 0);
      assert.ok(c.inputText.length > 0);
    }
  });
});

describe('benchmark suite runner', () => {
  it('runBenchmarkSuite returns 100 cases with consistent stats', () => {
    const result = runBenchmarkSuite(benchOptions);
    assert.equal(result.total, 100);
    assert.equal(result.testRuns.length, 100);
    assert.equal(result.passed + result.failed, 100);
    assert.equal(result.success, true);
    assert.equal(result.reportLink, '/docs/benchmark/README.md');
  });
  it('runBenchmarkSuite passed + failed equals total', () => {
    const result = runBenchmarkSuite(benchOptions);
    assert.equal(result.testRuns.length, result.passed + result.failed);
  });
});

describe('rag guideline retrieval', () => {
  it('returns no guidelines for clean text', () => {
    assert.equal(retrieveGuidelines('오늘 날씨가 좋네요').length, 0);
  });
  it('forces T4 tragedy keyword articles to score 100.0', () => {
    const r = retrieveGuidelines('세월호 추모 세일');
    const t4 = r.find((x) => x.article.tier === 4);
    assert.ok(t4, 'expected at least one T4 article');
    assert.equal(t4.score, 100.0);
  });
  it('boosts cosmetic-domain tier-1 articles when cosmetic keywords appear', () => {
    const r = retrieveGuidelines('이 화장품은 여드름과 주름을 없앱니다');
    const cosmetic = r.find((x) => x.article.domain === '화장품법');
    assert.ok(cosmetic, 'expected a 화장품법 article to surface');
    assert.ok(cosmetic.score >= 92.0);
  });
  it('boosts finance-domain tier-1 articles when finance keywords appear', () => {
    const r = retrieveGuidelines('무위험 원금 100% 보장에 월 수익률 10%');
    const fin = r.find((x) => x.article.domain === '금융소비자보호법');
    assert.ok(fin, 'expected 금융소비자보호법 article to surface');
    assert.ok(fin.score >= 95.0);
  });
});
