# SERVER GUIDE

## OVERVIEW
Express + TSX backend. `server.ts` owns process boot; `server/routes/api.ts` owns HTTP routes; services own analysis, OCR, history, benchmark, and regulatory lookup.

## STRUCTURE
```
server/
├── routes/api.ts              # all /api routes
├── services/llmService.ts     # public facade and performAnalysis orchestration
├── services/llm/              # adapters, routing, OCR fallback, result aggregation
├── services/easyOcrService.ts # Python worker bridge and OCR disable behavior
├── services/benchmarkRunner.ts
├── services/benchmarkCases.ts
├── services/historyStore.ts
├── services/rag.ts
├── db/regulatoryLibrary.ts
├── db/regulatory_library.json
└── prompts/                  # compliance prompt and agent JSON contracts
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add/change route | `routes/api.ts` | Router is mounted at `/api` from root `server.ts`. |
| Analyze request behavior | `services/llmService.ts`, `services/llm/` | Facade plus feature modules; test before and after edits. |
| Provider/model list proxy | `services/llm/modelProxy.ts`, `routes/api.ts` | OpenAI-compatible providers share code paths. |
| OCR fallback | `services/llm/visionOcr.ts`, `services/easyOcrService.ts`, `../scripts/ocr_easyocr.py` | Respect `OCR_ENABLED=false`. |
| Benchmark runs | `services/benchmarkRunner.ts`, `services/benchmarkCases.ts` | Outputs docs under `docs/benchmark`. |
| Regulatory matching | `services/rag.ts`, `db/regulatoryLibrary.ts` | Shared by analysis and benchmark. |
| Compliance agent behavior | `prompts/agent_instructions.md`, `prompts/compliancePrompt.ts` | JSON-only output contracts. |

## CONVENTIONS
- Keep request/response shapes aligned with `src/services/api.ts` and `src/types.ts`.
- Prompt agents are intentionally over-sensitive; tiny social, medical, finance, privacy, youth, or IP signals should still route.
- Agent prompt output schemas are exact JSON contracts; no prose or markdown.
- Production serving depends on `dist`; run `npm run build` before `NODE_ENV=production npm start`.
- `express.json` limit is 50 MB because image payloads may be sent as base64.
- `services/llmService.ts` should stay a compatibility facade; put feature logic in `services/llm/*.ts`.
- OCR worker stdin is `{ images: string[] }`; stdout is `{ text, error? }`; Python exit codes are `2` invalid request, `3` base64 decode failure, `4` OCR failure.
- `EASYOCR_LANGS` is cached by the Python reader; changing it requires process restart.

## ANTI-PATTERNS
- Do not silently drop image analysis when a model lacks vision; preserve OCR fallback messaging.
- Do not assume EasyOCR is installed or enabled on deployed demos.
- Do not break `ocrFallbackUsed`, `ocrExtractedText`, or `ocrNotice` propagation from `llmService` into reports.
- Do not mutate benchmark docs/corpus as a side effect of unrelated server changes.
- Do not weaken provider error handling around quota/API-key failures; the UI surfaces those distinctly.
- Do not duplicate regulatory search or JSON-repair helpers; centralize in existing service helpers.
