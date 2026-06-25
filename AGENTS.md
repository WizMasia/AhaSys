# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-25 13:57:02 KST
**Commit:** 83a68c93
**Branch:** main

## OVERVIEW
aHaSys is a Korean advertising and legal-compliance review console: React/Vite frontend, Express/TSX backend, Gemini plus OpenAI-compatible LLM adapters, RAG-style regulatory lookup, and optional EasyOCR fallback.

## STRUCTURE
```
ahasys/
├── server.ts                  # Express bootstrap; mounts /api and Vite/static serving
├── src/                       # React shell, tabs, hooks, browser-side API client
├── server/                    # API router, LLM analysis, benchmark, OCR, regulatory data
├── shared/                    # Contracts used by both frontend and backend
├── tests/                     # node:test suites plus manual smoke/repro scripts
├── docs/                      # OCR setup, refactor notes, benchmark corpus/docs
├── scripts/ocr_easyocr.py     # Python OCR worker called from server/services
└── dist/                      # build artifact; ignore for source edits
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| App boot | `server.ts`, `src/main.tsx` | `npm run dev` starts Express and Vite middleware together. |
| UI shell and tabs | `src/App.tsx`, `src/components/` | Large files remain in `App`, `ReviewTab`, `SettingsTab`. |
| Analysis request flow | `src/hooks/useAnalysisRunner.ts`, `src/services/api.ts`, `server/routes/api.ts` | Browser calls `/api/analyze`; server delegates to LLM service. |
| LLM adapters and OCR fallback | `server/services/llmService.ts`, `server/services/llm/`, `server/services/easyOcrService.ts`, `scripts/ocr_easyocr.py` | Preserve non-vision fallback, OCR notice, and result fields. |
| Regulatory corpus | `server/db/regulatoryLibrary.ts`, `server/db/regulatory_library.json`, `server/services/rag.ts` | Benchmark and analysis both consume this area. |
| Model capability rules | `shared/modelCapabilities.ts`, `shared/modelCapabilityCatalog.json` | Shared frontend/backend contract. |
| Design constraints | `DESIGN.md`, `src/index.css` | Korean text line-height and compact console density matter. |
| Tests | `tests/*.test.ts`, `tests/*.ts` | Only `*.test.ts` run under `npm test`; other scripts are manual. |
| Deployment | `Dockerfile`, `docker-compose.yml`, `.env.example`, `README.md` | Production must build `dist` before `npm start`. |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `setupServer` | function | `server.ts` | 1 | Boots Express, Vite middleware/static serving, and listener. |
| `apiRouter` routes | router | `server/routes/api.ts` | central | Owns `/history`, `/proxy/models`, `/analyze`, `/benchmark`. |
| `performAnalysis` | function | `server/services/llmService.ts` | high | Main compliance orchestration facade. |
| `executeLLMAnalysis` | function | `server/services/llm/adapters.ts` | high | Gemini and OpenAI-compatible adapter execution. |
| `extractTextFromImages` | function | `server/services/llm/visionOcr.ts` | OCR path | Bridges image analysis to EasyOCR fallback. |
| `runBenchmark` | function | `server/services/benchmarkRunner.ts` | API + tests | Produces benchmark reports under `docs/benchmark`. |
| `findRelevantArticles` | function | `server/services/rag.ts` | analysis + benchmark | Regulatory lookup/scoring helper. |
| `App` | component | `src/App.tsx` | frontend root | Owns tab shell and workflow wiring. |
| `AppProvider` / `useApp` | context | `src/contexts/AppContext.tsx` | UI-wide | Stores theme, tab, LLM config, model fetch state. |
| `useAnalysisRunner` | hook | `src/hooks/useAnalysisRunner.ts` | `App` | Frontend analysis progress and `/api/analyze` call flow. |
| `apiClient` | object | `src/services/api.ts` | frontend | Encapsulates browser calls to server routes. |
| `ReviewTab` | component | `src/components/ReviewTab.tsx` | large UI | Input, upload, result/report, and warning surface. |
| `shouldProbeVisionCapability` | function | `shared/modelCapabilities.ts` | frontend + server | Decides when OpenAI-compatible models need image probe/OCR fallback. |

## CONVENTIONS
- Package manager is npm; `package-lock.json` is authoritative.
- TypeScript uses ESM, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, and `@/*` mapped to the repo root.
- Runtime entry is `tsx server.ts`; there is no separate client/server workspace.
- Vite HMR is controlled by `DISABLE_HMR`; keep the watch-disable behavior in `vite.config.ts`.
- React UI is Tailwind-heavy and follows `DESIGN.md`, not a component library.
- Prompt files under `server/prompts/` define strict JSON-only agent output contracts.

## ANTI-PATTERNS (THIS PROJECT)
- Ignore AppleDouble `._*` files; they are filesystem noise, not source.
- Do not edit `dist/`, `node_modules/`, `.venv-ocr/`, `.codegraph/`, or `.playwright-mcp/` as source.
- Do not introduce `any`, `ts-ignore`, or duplicate JSON-repair logic; this is explicitly forbidden by the refactor spec.
- Do not weaken the over-sensitive compliance routing in `server/prompts/agent_instructions.md`.
- Do not assume OCR runs in production demos; `.env.example` and README state Render uses `OCR_ENABLED=false`.
- Do not use hero-scale type inside compact panels; Korean status text needs generous line height.

## COMMANDS
```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm start
docker compose up --build -d
```

## NOTES
- LSP was not available during initialization; code map came from CodeGraph, shell structure, and explorer passes.
- Project-owned scale at initialization: 112 non-vendor files and about 7.5k TS/TSX/Python lines.
- Large UI hotspots remain `src/components/ReviewTab.tsx`, `src/App.tsx`, `src/components/SettingsTab.tsx`; backend LLM behavior is split under `server/services/llm/`.
- `tests/liveE2E.ts` and OCR scripts are manual repro/smoke scripts unless invoked directly.
- Local OCR requires Python 3.10-3.12 plus EasyOCR/PyTorch; see `docs/ocr-setup.md`.
- OCR worker protocol is stdin `{ images: string[] }` and stdout `{ text, error? }`; per-image labels are `[이미지 N OCR]`.
