# SHARED CONTRACT GUIDE

## OVERVIEW
Small cross-boundary layer used by both frontend and backend. Treat changes here as API-contract changes.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Vision probe rules | `modelCapabilities.ts` | Used by `src/hooks/useAnalysisRunner.ts` and `server/services/llmService.ts`. |
| Model catalog data | `modelCapabilityCatalog.json` | Keep schema aligned with helper expectations. |
| Defaults display | `src/constants/llm.ts` | Frontend defaults live outside `shared`; update intentionally. |
| Server adapter behavior | `server/services/llmService.ts` | Must agree with shared capability decisions. |

## CONVENTIONS
- Prefer typed helpers over checking model names inline in UI or server code.
- Keep catalog entries data-only; logic belongs in `modelCapabilities.ts`.
- Preserve frontend/backend compatibility when adding a provider, capability, or model family.
- Run `npm run lint` after edits here; both sides import these files.

## ANTI-PATTERNS
- Do not add browser-only or Node-only dependencies to `shared/`.
- Do not let frontend capability messaging disagree with server fallback behavior.
- Do not hardcode model capability exceptions in `src/components` or `server/routes`.
- Do not rename catalog fields without updating every consumer and tests.
