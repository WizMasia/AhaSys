# FRONTEND GUIDE

## OVERVIEW
React 19 + Vite + Tailwind console UI. `src/App.tsx` wires the shell; tabs and hooks own most behavior.

## STRUCTURE
```
src/
├── main.tsx              # React root; wraps App in AppProvider
├── App.tsx               # tab shell, orchestration, report helpers
├── components/           # tab shells plus feature component folders
├── components/review/    # ReviewTab input, progress, result, report panels
├── components/history/   # HistoryTab filtering, ledger header, timeline panels
├── contexts/             # AppContext for theme, tabs, LLM config, model fetch state
├── hooks/                # analysis, benchmark, image upload, LLM config logic
├── services/api.ts       # browser API client for /api/*
├── utils/                # error/report helpers
├── constants/llm.ts      # default endpoints and model names
└── types.ts              # frontend/domain result shapes
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Boot and provider wiring | `main.tsx`, `contexts/AppContext.tsx` | `AppProvider` must wrap `App`. |
| Tab layout and cross-tab state | `App.tsx` | Large hotspot; keep behavior scoped when touching it. |
| Review input/result UI | `components/ReviewTab.tsx`, `components/review/` | `ReviewTab.tsx` is the facade; feature panels live under `components/review/`. |
| History ledger UI | `components/HistoryTab.tsx`, `components/history/` | `HistoryTab.tsx` is the facade; filtering and timeline panels live under `components/history/`. |
| LLM settings UI | `components/SettingsTab.tsx` | Endpoint/model defaults come from `constants/llm.ts`. |
| Analysis submission | `hooks/useAnalysisRunner.ts`, `services/api.ts` | Calls `apiClient.analyzeCompliance`. |
| Benchmark UI | `components/BenchmarkTab.tsx`, `hooks/useBenchmarkRunner.ts` | Server writes benchmark report artifacts. |
| Image upload state | `hooks/useImageUploads.ts` | Uploaded image shape is consumed by analysis runner. |
| Report markdown | `utils/report.ts` | Also exercised by `tests/liveE2E.ts`. |

## CONVENTIONS
- Use existing Tailwind utility style and `DESIGN.md` semantic roles.
- Keep compact console surfaces dense; avoid marketing-page or hero-section patterns.
- Korean status/progress text must keep enough line height to avoid clipping.
- `@/*` resolves to the repo root, so imports may cross into `shared/`.
- `shouldProbeVisionCapability` from `shared/modelCapabilities.ts` controls image probe expectations in the frontend.
- Keep `components/ReviewTab.tsx` as a compatibility facade; put review input/result/progress logic in `components/review/*.tsx`.
- Keep `components/HistoryTab.tsx` as a compatibility facade; put ledger filtering and timeline rendering in `components/history/*.tsx`.

## ANTI-PATTERNS
- Do not add new hardcoded LLM defaults in components; use `src/constants/llm.ts`.
- Do not bypass `src/services/api.ts` with direct fetch calls from random components.
- Do not let mobile controls overflow; wrap them instead.
- Do not animate progress text layout; keep motion to opacity/transform.
- Do not put new feature logic back into `ReviewTab`; extract only when it reduces real complexity and preserves the existing compact console layout.
- Do not put new history ledger logic back into `HistoryTab`; extract filtering, counts, empty states, and timeline row rendering.
