
# aHaSys Refactor: Modular Audit Flow - Summary

> Branch: `codex/refactor-modular-audit-flow`
> Base: `07324a3 refactor(app): split audit flow modules`
> Worktree commits ahead of base: 5
> This document is the archive of the work in this branch and the plan for
> splitting it into focused follow-up branches.

## 1. Context

The `codex/refactor-modular-audit-flow` branch layered six concerns on top of
the existing modular refactor at `07324a3`:

1. macOS / volume filesystem hygiene (`.gitignore`, `.env.example`).
2. Server-side split of the inline benchmark loop and RAG helper duplication.
3. A typed `ProviderRateLimitError` and a safer `(err: unknown)` decode in
   `server/routes/api.ts`, so 429 cascade can no longer fan out to sub-agents.
4. An OCR text-extraction fallback for adapters that do not accept images,
   gated by a vision-model keyword catalog.
5. UI affordances (mobile tab bar, model search/sort, OCR-aware progress
   messages) and a new OCR section in the markdown report.
6. A node `--test` suite that locks in the new behavior.

These landed as five commits. One of them (`chore(repo): ...`) is bulkier
than it should be: it absorbed the same mode-bit normalization that the
filesystem on this volume (an APFS mount that refuses `chmod`) made
impossible to stage as its own commit. A local `core.fileMode=false` in
`.git/config` keeps future commits from picking up the same noise.

## 2. Commits in the branch

| SHA       | Title                                                                 | Files | Notes |
|-----------|-----------------------------------------------------------------------|-------|-------|
| `e28bfb3` | chore(repo): ignore macOS AppleDouble noise and document refactor     | 18    | Combined mode-bit normalization + `.gitignore`, `.env.example`, `DESIGN.md`, `docs/ponytail_simplification.md`. See section 4. |
| `5eb6213` | refactor(server): split benchmark runner and rag helpers              | 1     | `server/services/benchmarkRunner.ts` (new). |
| `5511d4d` | feat(shared): introduce vision-model capability catalog              | 2     | `shared/modelCapabilities.ts` + `shared/modelCapabilityCatalog.json`. |
| `25e5947` | feat(ui): add MobileTabBar for narrow-viewport tab navigation        | 1     | `src/components/MobileTabBar.tsx` (new). |
| `9ff1736` | test: add node --test suite covering refactored modules               | 2     | `tests/analyzeQuotaCascade.test.ts` + `tests/refactorModules.test.ts`. |

One file remains untracked at the time of writing: `tests/liveE2E.ts` -- a
node script that drives `performAnalysis` against a local mock provider to
verify the end-to-end pipeline (vision probe, OCR fallback, report builder)
without burning API quota. The script exits non-zero on any failure and is
intended to be promoted into the test suite.

## 3. Validation

| Check                                         | Result                                                                 |
|-----------------------------------------------|------------------------------------------------------------------------|
| `npm run lint`                                | 0 errors                                                               |
| `npm test`                                    | 31/31 passing (5 suites)                                               |
| `npm run build`                               | vite 1851 modules, 0 warnings, gzipped 140.83 kB                       |
| Live Gemini call (full payload)               | 429 `QUOTA_EXCEEDED` -- prepay credits depleted at AI Studio           |
| 429 cascade path (live)                       | Correctly converted to `code: "QUOTA_EXCEEDED"` + Korean guidance      |
| 200 success path (mock)                       | 9 sub-agents activated, 9 violations, full markdown report generated   |

The `liveE2E.ts` script currently exposes one real defect that the mock
provider did not catch: `finalResultData.ocrFallbackUsed` is only assigned
`true` and is left `undefined` when the OCR fallback does not engage. The
markdown report and the test suite both treat the field as truthy/falsy,
so no user-visible bug exists today, but the field semantics should be
made explicit (assign `false` by default).

## 4. Known issues to address in the follow-up branches

1. **Mode-bit normalization got mixed into `e28bfb3`.** The volume refused
   `chmod`, so we could not stage the 18 mode-only changes separately. The
   cleanest follow-up is to drop the mode bits and let the `core.fileMode`
   override do its job.
2. **`finalResultData.ocrFallbackUsed` default.** Set it to `false` in the
   initial object literal so callers can rely on the field always being a
   boolean.
3. **Live Gemini credits.** The 200 success path was verified only with a
   local mock provider. Once a funded key is available, run the live suite
   end-to-end.

## 5. Proposed split into focused branches

The work decomposes cleanly into six branches. Each one is small enough to
land as a single PR, and the dependency graph below shows what can run in
parallel.

| ID | Branch                                       | Depends on | What it ships                                                                 |
|----|----------------------------------------------|------------|-------------------------------------------------------------------------------|
| A  | `chore/refactor-audit-flow-hygiene`          | --         | `.gitignore`, `.env.example`, `DESIGN.md`, `docs/ponytail_simplification.md` |
| B  | `refactor/server-benchmark-rag`              | --         | `server/services/benchmarkRunner.ts` (new) + `benchmarkCases.ts` + `rag.ts`  |
| C  | `feat/ocr-fallback-non-vision`               | A          | `shared/modelCapabilities.*` + `llmService.ts` OCR + `api.ts` error decode    |
| D  | `feat/ui-mobile-and-model-search`            | C          | `App.tsx`, `MobileTabBar.tsx`, `SettingsTab.tsx`, `HistoryTab.tsx`, `ReviewTab.tsx`, `useAnalysisRunner.ts`, `types.ts`, `utils/report.ts` |
| E  | `test/refactor-modules-coverage`             | B, C       | `tests/analyzeQuotaCascade.test.ts` + `tests/refactorModules.test.ts`         |
| F  | `docs/audit-flow-archive`                    | all        | This summary + the `liveE2E.ts` harness as a tracked asset                   |

### Dependency graph

```
                              07324a3 (base)
                              /        \\
                             /          \\
                            A            B
                            |            |
                            C            |
                            |  \\        |
                            D   \\-------E
                                 \\     /
                                  F (last)
```

### Parallel execution plan

Round 1 (immediately, in parallel from base):
* A (`chore/refactor-audit-flow-hygiene`)
* B (`refactor/server-benchmark-rag`)

Round 2 (after A lands; in parallel):
* C (`feat/ocr-fallback-non-vision`)

Round 3 (after C lands; in parallel):
* D (`feat/ui-mobile-and-model-search`)
* E (`test/refactor-modules-coverage`) -- needs both B and C

Round 4 (last):
* F (`docs/audit-flow-archive`)

### Per-branch acceptance gate

Every branch must pass before merge:

```bash
npm run lint     # tsc --noEmit, 0 errors
npm test         # node --test, 0 fail
npm run build    # vite build, 0 warnings
```

`C` and `E` additionally re-run `npx tsx tests/liveE2E.ts` against a local
mock provider to confirm the OCR fallback pathway and the report builder.

## 6. Replay instructions for a follow-up agent

```bash
# start from the archived branch tip
git checkout codex/refactor-modular-audit-flow

# Round 1: branch off the base
git checkout -b chore/refactor-audit-flow-hygiene 07324a3
git checkout -b refactor/server-benchmark-rag 07324a3

# Round 2: branch off A
git checkout -b feat/ocr-fallback-non-vision chore/refactor-audit-flow-hygiene

# Round 3: branch off the appropriate parent
git checkout -b feat/ui-mobile-and-model-search feat/ocr-fallback-non-vision
git checkout -b test/refactor-modules-coverage 07324a3 # cherry-pick benchmarkRunner.ts from B after B merges

# Round 4: last, on top of everything
git checkout -b docs/audit-flow-archive <tip-after-D-and-E>
```

After all rounds land on `main`, this branch (`codex/refactor-modular-audit-flow`)
should be deleted. The follow-up branches all carry the same intent; the
archive exists only to keep `git log` readable while the work is being
replayed.
