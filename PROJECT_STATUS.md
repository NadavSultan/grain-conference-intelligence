# Project Status

## Checkpoint control

- Status: awaiting independent Checkpoint 1 review; not self-approved.
- Current branch: `feat/checkpoint-1-foundation`
- Baseline commit: `e43f1c7 docs: establish grain assignment baseline`
- Task 1 commit: `58df089 chore: scaffold branded conference intelligence workspace`
- Task 2 commit: `e774db7 feat: add sourced conference and labelled prep fixtures`
- Checkpoint 1 remediation commit: `6a10960 fix: remediate checkpoint 1 evidence fixtures`
- Checkpoint 1 review-remediation commit: `82ca369 fix: bind claims and snapshot diffs to specific evidence`
- Checkpoint 1 claim-provenance commit: `d6cf9d0 fix: complete checkpoint 1 claim provenance`
- Vercel eventual Root Directory: `grain-conference-intelligence` (recorded for future project configuration; no Vercel project was linked and no deployment was performed).
- Next authorized work: none pending independent review.

## Verification evidence

All commands were run from `grain-conference-intelligence` with pnpm 11.19.0.

| Gate | Exit | Evidence |
| --- | ---: | --- |
| `pnpm test:run` after Task 1 | 0 | 1 file, 7 tests passed, 0 skipped |
| `pnpm typecheck` after Task 1 | 0 | TypeScript emitted no diagnostics |
| `pnpm lint` after Task 1 | 0 | ESLint emitted no diagnostics |
| `pnpm vitest run src/data/seeds.test.ts` after Task 2 | 0 | 1 file, 17 tests passed, 0 skipped |
| `pnpm test:run` after Task 2 | 0 | 2 files, 24 tests passed, 0 skipped |
| `pnpm typecheck` after Task 2 | 0 | TypeScript emitted no diagnostics |
| `pnpm lint` after Task 2 | 0 | ESLint emitted no diagnostics |
| `pnpm build` after Task 2 | 0 | Next.js 16.3.4 production build compiled, typechecked, and generated 4 static pages |
| `pnpm vitest run src/data` after first remediation | 0 | 1 file, 22 tests passed, 0 skipped |
| `pnpm test:run` after first remediation | 0 | 2 files, 29 tests passed, 0 skipped |
| `pnpm typecheck` after first remediation | 0 | TypeScript emitted no diagnostics |
| `pnpm lint` after first remediation | 0 | ESLint emitted no diagnostics |
| `pnpm build` after first remediation | 0 | Next.js 16.3.4 compiled and generated 4 static pages |
| `pnpm vitest run src/data` after review remediation | 0 | 1 file, 26 tests passed, 0 skipped |
| `pnpm test:run` after review remediation | 0 | 2 files, 33 tests passed, 0 skipped |
| `pnpm typecheck` after review remediation | 0 | TypeScript emitted no diagnostics |
| `pnpm lint` after review remediation | 0 | ESLint emitted no diagnostics |
| `pnpm build` after review remediation | 0 | Next.js 16.3.4 compiled and generated 4 static pages |
| `pnpm vitest run src/data` after claim-provenance remediation | 0 | 1 file, 30 tests passed, 0 skipped |
| `pnpm test:run` after claim-provenance remediation | 0 | 2 files, 37 tests passed, 0 skipped |
| `pnpm typecheck` after claim-provenance remediation | 0 | TypeScript emitted no diagnostics |
| `pnpm lint` after claim-provenance remediation | 0 | ESLint emitted no diagnostics |
| `pnpm build` after claim-provenance remediation | 0 | Next.js 16.3.4 compiled and generated 4 static pages |

Zero-skip status: **PASS — 37 passed, 0 skipped in the complete test suite.**

## Exact changed files relative to `main`

- `PROJECT_STATUS.md`
- `CHECKPOINT_1_REPORT.md`
- `grain-conference-intelligence/.gitignore`
- `grain-conference-intelligence/AGENTS.md`
- `grain-conference-intelligence/CLAUDE.md`
- `grain-conference-intelligence/README.md`
- `grain-conference-intelligence/eslint.config.mjs`
- `grain-conference-intelligence/next.config.ts`
- `grain-conference-intelligence/package.json`
- `grain-conference-intelligence/pnpm-lock.yaml`
- `grain-conference-intelligence/pnpm-workspace.yaml`
- `grain-conference-intelligence/postcss.config.mjs`
- `grain-conference-intelligence/public/evidence/david.html`
- `grain-conference-intelligence/public/evidence/edge-fixtures.html`
- `grain-conference-intelligence/public/evidence/marcus.html`
- `grain-conference-intelligence/public/evidence/priya.html`
- `grain-conference-intelligence/public/evidence/sam.html`
- `grain-conference-intelligence/public/file.svg`
- `grain-conference-intelligence/public/globe.svg`
- `grain-conference-intelligence/public/next.svg`
- `grain-conference-intelligence/public/vercel.svg`
- `grain-conference-intelligence/public/window.svg`
- `grain-conference-intelligence/src/app/favicon.ico`
- `grain-conference-intelligence/src/app/globals.css`
- `grain-conference-intelligence/src/app/layout.tsx`
- `grain-conference-intelligence/src/app/page.tsx`
- `grain-conference-intelligence/src/components/app-shell.tsx`
- `grain-conference-intelligence/src/components/grain-wordmark.tsx`
- `grain-conference-intelligence/src/data/conferences.ts`
- `grain-conference-intelligence/src/data/demo-workspace.ts`
- `grain-conference-intelligence/src/data/prep-snapshots.ts`
- `grain-conference-intelligence/src/data/seeds.test.ts`
- `grain-conference-intelligence/src/domain/schemas.ts`
- `grain-conference-intelligence/src/domain/types.ts`
- `grain-conference-intelligence/src/workspace/provider.tsx`
- `grain-conference-intelligence/src/workspace/reducer.test.ts`
- `grain-conference-intelligence/src/workspace/reducer.ts`
- `grain-conference-intelligence/src/workspace/state.ts`
- `grain-conference-intelligence/tsconfig.json`
- `grain-conference-intelligence/vitest.config.ts`
- `grain-conference-intelligence/vitest.setup.ts`

## Known limitations and unresolved data questions

- Six conference audience totals remain explicitly `null`/Unknown because an official total supporting the stored edition was not available on the selected official page. Buyer and historical-edition counts are not misrepresented as current total attendance.
- Conference facts are a source-ledger snapshot verified on 2026-09-09 and must be rechecked before real planning because future event details can change.
- Money20/20 Middle East stores its 38,000 audience and buyer-density claim against the 2026 ticket page. SaaStr AI Annual 2027 stores 10,000 from the official 2027 organizer page.
- The four outreach profiles and compact edge cases are fictional demo data. Their local exhibits and records are labelled; the illustrative 2–4 June schedule is intentionally separate from verified Money20/20 Europe 2027 dates.
- Prep status is user-facing seed content and is not treated as a public/CRM-proved factual claim.
- Live research, conference pages, Prep UI, mobile capture, Relationship Copilot, CRM implementation, deployment, and all Checkpoint 2 work remain unimplemented by design.
- Vercel Root Directory is documented as `grain-conference-intelligence`; applying it requires a future linked Vercel project and was not authorized in this checkpoint.
