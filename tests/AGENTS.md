# TEST GUIDE

## OVERVIEW
Tests live in one folder. `npm test` runs only `tests/**/*.test.ts`; other `.ts` files are manual smoke or repro scripts.

## STRUCTURE
```
tests/
├── refactorModules.test.ts        # pure helper/module coverage
├── analyzeQuotaCascade.test.ts    # analysis-flow quota/error behavior
├── liveE2E.ts                     # manual mock-provider integration run
├── easyOcrSmoke.ts                # manual OCR smoke
├── easyOcrTragedy.ts              # manual OCR repro
├── easyOcrTragedyAnalyze.ts       # manual OCR + analysis repro
└── ocrDisabledSmoke.ts            # manual OCR-disabled path smoke
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Automated suite | `*.test.ts` | Runs with Node's built-in test runner and `tsx`. |
| Analysis regression | `analyzeQuotaCascade.test.ts`, `liveE2E.ts` | Covers `server/services/llmService.ts`. |
| Module/refactor regression | `refactorModules.test.ts` | Covers RAG, benchmark, shared capabilities. |
| OCR behavior | `easyOcr*.ts`, `ocrDisabledSmoke.ts` | Manual scripts; may need local Python stack. |
| Report formatting | `liveE2E.ts`, `src/utils/report.ts` | Integration-style coverage. |

## CONVENTIONS
- Use `node:test` and Node assertions; no Jest/Vitest config exists.
- Keep fixtures inline unless multiple suites genuinely share them.
- Use temp dirs for filesystem-output tests; do not write into real docs unless the test is explicitly about generated reports.
- Mock LLM providers with local HTTP servers or injected functions.

## COMMANDS
```bash
npm test
node --import tsx --test tests/refactorModules.test.ts
npx tsx tests/liveE2E.ts
npx tsx tests/easyOcrSmoke.ts
npx tsx tests/ocrDisabledSmoke.ts
```

## ANTI-PATTERNS
- Do not assume plain `.ts` scripts are included in CI or `npm test`.
- Do not require real API keys for automated tests.
- Do not require EasyOCR for the default automated suite.
- Keep tests for vision-capable models skipping OCR, non-vision models probing first, and retry via OCR after image-processing failures.
- Do not delete or weaken failing tests to make build output green.
