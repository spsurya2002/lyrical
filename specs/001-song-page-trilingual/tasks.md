---

description: "Task list for 001-song-page-trilingual"
---

# Tasks: Song Page — Trilingual Explanation Viewer

**Input**: Design documents from `specs/001-song-page-trilingual/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/song-page-api.md](contracts/song-page-api.md),
[quickstart.md](quickstart.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel — different files, no dependency on incomplete work
- **[Story]**: US1–US6, mapping to the user stories in spec.md
- **⛔**: Blocked — do not start, reason given

## The verification rule

**Every task ends with `npm run verify` actually run, and its output quoted in the
report.** That command is `typecheck + lint + test + e2e`. A task is not done
because the code looks right; it is done when verify passed and you saw it pass.
Tasks that need a check beyond the gate name it explicitly.

Per Principle II: never report a task complete without having run this.

---

## Phase 1: Setup

**Purpose**: project skeleton, tooling, and the gate itself

- [x] T001 Create npm workspace root with `backend/` and `frontend/` in `package.json`, per the structure in plan.md
- [x] T002 [P] Initialize backend: Express + TypeScript 5.x on Node 20 in `backend/package.json`, `backend/tsconfig.json`
- [x] T003 [P] Initialize frontend: React 18 + Vite + TypeScript + Tailwind in `frontend/package.json`, `frontend/vite.config.ts`
- [x] T004 [P] Configure ESLint + Prettier across both workspaces in `.eslintrc.cjs`, `.prettierrc`
- [x] T005 [P] Add `docker-compose.yml` with Postgres 16 + pgvector and Redis 7
- [x] T006 Create `.env.example` with every variable in quickstart.md, and `backend/src/config/index.ts` reading them — including `GROUNDING_MIN_SOURCES` defaulting to `4`. **No hardcoded limits anywhere else.**
- [x] T007 Wire test tooling (R-08): Vitest in `backend/vitest.config.ts` and `frontend/vitest.config.ts`, Playwright in `frontend/playwright.config.ts`, Testcontainers helper in `backend/tests/helpers/postgres.ts`
- [x] T008 Add scripts to root `package.json`: `dev`, `dev:api`, `dev:web`, `worker`, `db:migrate`, `db:seed`, `test`, `test:e2e`, `typecheck`, `lint`, and `verify` = typecheck + lint + test + e2e

**Verify**: `npm run verify` passes on an empty project. This is the gate coming online — it must pass before anything else is written.

---

## Phase 2: Foundational

**⚠️ Blocking — no user story may begin until this phase is complete.**

**Purpose**: the schema, and the three rules the constitution actually protects

### Schema

- [x] T009 Create migration framework and initial migration in `backend/src/db/migrations/001_initial.sql` — the seven tables from data-model.md: `song`, `song_title`, `lyric_line`, `lyric_line_text`, `word_occurrence`, `meaning`, `meaning_rendering`, `source`, `meaning_source`
- [x] T010 Add constraints exactly as specified in data-model.md: `song.slug` unique · `lyric_line(song_id, line_no)` unique · `lyric_line_text` PK `(line_id, script)` · `word_occurrence(line_id, position)` unique · `meaning` unique `(target_type, target_id)` where `status = 'active'` · `meaning_rendering` PK `(meaning_id, mode)` with **cascade delete from `meaning`** · `meaning_source` PK `(meaning_id, source_id)`
- [x] T011 Add enums: `script` = `deva | latn` · `mode` = `en | hi | hi-Latn` · `target_type` = `song_summary | line | word_occurrence` · `meaning.status` = `active | stale` · `source.type` = `blog | forum | lyrics | interview | academic | other`
- [x] T012 [P] Add the indexes listed in data-model.md, including `meaning_source(meaning_id)` — the grounding count is the hot path

### The rules — pure functions, no I/O

- [x] T013 [P] Implement `backend/src/domain/modeScript.ts` — mode → script: `hi → deva`, `en → latn`, `hi-Latn → latn` (R-01)
- [x] T014 [P] Implement `backend/src/domain/scriptValidator.ts` — reject any codepoint in `U+0600–06FF`, `U+0750–077F`, `U+0870–089F`, `U+08A0–08FF`, `U+FB50–FDFF`, `U+FE70–FEFF` in **every** mode; reject Devanagari (`U+0900–097F`, `U+A8E0–A8FF`) in `en` and `hi-Latn`; reject an `hi` payload whose body is predominantly Latin
- [x] T015 [P] Unit tests for `scriptValidator` in `backend/tests/unit/scriptValidator.test.ts` using **real qawwali vocabulary**, not `foo`/`bar` — including a fixture source containing genuine Urdu script
- [x] T016 [P] Implement `backend/src/domain/grounding.ts` — `isServable(sourceCount) = sourceCount >= config.GROUNDING_MIN_SOURCES`. Derived per call, **never stored** (R-05)
- [x] T017 [P] Unit tests for `grounding.ts` in `backend/tests/unit/grounding.test.ts` — at the bar, below it, at zero, and with the config value changed
- [x] T018 [P] Implement `backend/src/domain/coverage.ts` — `linesExplained / linesTotal`, derived from the same aggregate as grounding (R-06)
- [x] T019 [P] Implement `backend/src/domain/entitlements.ts` — `getEntitlements(userId)` returning plan and limits. **The single source.** No route may re-derive them
- [x] T020 [P] Unit tests for `entitlements.ts` in `backend/tests/unit/entitlements.test.ts` — basic, pro, and signed-out

### Infrastructure

- [x] T021 [P] `backend/src/api/middleware/optionalAuth.ts` — verifies a JWT when present, **allows the request through when absent** (R-09). Getting this wrong locks out signed-out visitors
- [x] T022 [P] `backend/src/api/middleware/rateLimit.ts` — `express-rate-limit` backed by Redis
- [x] T023 [P] Error handling and structured logging in `backend/src/api/middleware/errors.ts` — no empty catch, no error swallowed into a default that looks like success
- [x] T024 [P] Redis cache helper in `backend/src/db/cache.ts`, keyed `song:{slug}:{mode}:{viewerClass}`
- [x] T025 [P] Frontend design tokens in `frontend/src/styles/tokens.css` — all 18 tokens from docs/design_system.md as CSS custom properties, consumed via Tailwind theme extension. **The only hex values in the codebase**
- [x] T026 [P] Font loading in `frontend/index.html` — Newsreader, Tiro Devanagari Hindi, Inter, Noto Sans Devanagari, JetBrains Mono with `display=swap`. Subset to Latin + Devanagari only; **do not ship Arabic glyph coverage**
- [x] T027 Seed fixtures in `backend/src/db/seed/` — the five songs from quickstart.md: `kun-faya-kun` (fully grounded), `piya-haji-ali` (2 sources, below bar), `arziyan` (4 of 26 lines), `khwaja-mere-khwaja` (same word, two meanings), `tere-bina` (stale meaning + one unreachable source)

**Verify**: `npm run verify`, plus `npm run db:migrate && npm run db:seed` against a real Postgres.

---

## Phase 3: US1 — Read a song and see its sources (P1) 🎯 MVP

**Goal**: open a song, read line meanings and the summary, open the sources behind each.

**Independent test**: open `/song/kun-faya-kun` in English, read a line meaning and the song summary, open a source chip and see the excerpt actually used.

- [ ] T028 [US1] Contract test for `GET /api/songs/:slug` in `backend/tests/contract/songPage.test.ts` against the shape in contracts/song-page-api.md — assert `meaning` and `ungrounded` are **mutually exclusive** on every line
- [ ] T029 [US1] Page query in `backend/src/db/queries/songPage.sql.ts` — song + lines + text + meanings + renderings + source counts in **one** query; source lists in a second. **Not N+1 per line**
- [ ] T030 [US1] `backend/src/services/songPageService.ts` — assemble the response, applying `grounding.isServable` and `coverage`. **Start reading the code here**
- [ ] T031 [US1] Apply `scriptValidator` at the serialisation boundary in `songPageService.ts` (R-07) — a failing entity is replaced by its ungrounded state and logged at error level with its id; one bad line never fails the page
- [ ] T032 [US1] Route `backend/src/api/routes/songPage.ts` with `optionalAuth` and `rateLimit`
- [ ] T033 [P] [US1] Sources query and route: `backend/src/db/queries/sources.sql.ts`, `backend/src/api/routes/sources.ts` — `GET /api/meanings/:meaningId/sources`, including unreachable sources marked rather than hidden
- [ ] T034 [P] [US1] Contract test for the sources endpoint in `backend/tests/contract/sources.test.ts`
- [ ] T035 [US1] **Grounding integration test** in `backend/tests/integration/grounding.test.ts` — **with retrieval stripped, the page produces the ungrounded state, never an answer.** This is Principle I's testable line. If this passes while the pipeline still answers, the test is wrong
- [ ] T036 [P] [US1] `frontend/src/hooks/useSongPage.ts` — fetch and cache the page payload
- [ ] T037 [P] [US1] `frontend/src/components/lyric/LyricLine.tsx` — ⚠️ **the only component that renders lyric text.** R-001 depends on this staying true
- [ ] T038 [US1] `frontend/src/components/lyric/LyricColumn.tsx` — the scrolling column, active-line treatment, independent scroll
- [ ] T039 [P] [US1] `frontend/src/components/meaning/MeaningPanel.tsx` — desktop meaning panel
- [ ] T040 [P] [US1] `frontend/src/components/grounding/SourceStrip.tsx` — chips with favicon, domain, type label; click opens the stored excerpt
- [ ] T041 [P] [US1] `frontend/src/components/grounding/GroundedMark.tsx` — the `● 6 sources` mark
- [ ] T042 [US1] `frontend/src/pages/SongPage.tsx` — the three-zone layout from docs/design_system.md §6
- [ ] T043 [US1] E2E in `frontend/tests/e2e/readSong.spec.ts` — quickstart scenario 1

**Checkpoint**: a demonstrable product. One song, one language, meanings with visible sources.

---

## Phase 4: US2 — Three languages (P2)

**Goal**: switch English / Hindi / Hinglish, instantly, without losing place.

**Independent test**: switch across all three modes; each renders fully in the correct script; no loading state; scroll position and active line survive; quota unmoved.

- [ ] T044 [US2] Add `mode` handling to `songPageService.ts` and the page query — lyric text by **script** (R-01), meanings by **mode**
- [ ] T045 [P] [US2] `frontend/src/components/language/ModeSwitch.tsx` — segmented control, always visible, top-right
- [ ] T046 [P] [US2] `frontend/src/hooks/useLanguageMode.ts` — persist per account when signed in, `localStorage` when not; default `en` (FR-016, R-09)
- [ ] T047 [US2] Preserve active line and scroll position across a mode switch in `SongPage.tsx` (FR-013)
- [ ] T048 [P] [US2] `backend/src/llm/LlmProvider.ts` — the provider interface, per-job model config
- [ ] T049 [P] [US2] `backend/src/llm/providers/gemini.ts` and `backend/src/llm/providers/ollama.ts` — SDK imports permitted **only** in this directory
- [ ] T050 [US2] Test in `backend/tests/unit/noProviderLeak.test.ts` asserting no provider SDK import exists outside `src/llm/providers/` (R-10). A leak must fail the build, not be discovered at switch time
- [ ] T051 [US2] BullMQ queue and `backend/src/jobs/backfillRendering.ts` — generate a missing rendering from the stored meaning. Rate-limited per Principle VI
- [ ] T052 [US2] `mode_unavailable` handling in `songPageService.ts` (R-02) — serve what exists, mark the affected entities honestly, enqueue backfill, **never block and never fall back to another language**
- [ ] T053 [US2] **Script boundary E2E** in `frontend/tests/e2e/scriptBoundary.spec.ts` — zero Arabic/Urdu codepoints in any response across all three modes, including the song whose stored source **is** in Urdu script
- [ ] T054 [US2] Test in `backend/tests/integration/modeSwitch.test.ts` — a mode switch consumes **no quota** and triggers **no research** (FR-014, FR-015)
- [ ] T055 [US2] Devanagari line-height +0.1 in `tokens.css` and lyric components — matras must not clip
- [ ] T056 [US2] E2E in `frontend/tests/e2e/threeLanguages.spec.ts` — quickstart scenario 2

**Checkpoint**: the product serves its full audience.

---

## Phase 5: US3 — Word meanings in song context (P2)

**Goal**: select a word, get its meaning *here* — and know when two uses differ.

**Independent test**: on `khwaja-mere-khwaja`, select the same word at two occurrences and get two different meanings, with the difference stated.

- [ ] T057 [US3] Word query in `backend/src/db/queries/wordMeaning.sql.ts` — by `word_occurrence.id`, not by spelling
- [ ] T058 [US3] `backend/src/services/wordMeaningService.ts` — including `otherOccurrences[].differs`, computed by comparing `meaning_id`s (FR-019)
- [ ] T059 [US3] Route `backend/src/api/routes/wordMeaning.ts` — `GET /api/songs/:slug/words/:occurrenceId`
- [ ] T060 [P] [US3] Contract test in `backend/tests/contract/wordMeaning.test.ts`
- [ ] T061 [US3] Integration test in `backend/tests/integration/wordIdentity.test.ts` — same spelling, two occurrences, two meanings; and same spelling, one shared meaning, `differs: false`. **The page must not imply a difference that isn't there**
- [ ] T062 [P] [US3] `frontend/src/components/meaning/WordGloss.tsx` — renders in the meaning panel, **not a tooltip**
- [ ] T063 [US3] Selectable-word treatment in `LyricLine.tsx` — dotted underline at rest, `--accent-wash` on hover. Words with no servable meaning are **not** selectable (FR-020)
- [ ] T064 [US3] E2E in `frontend/tests/e2e/wordMeanings.spec.ts` — quickstart scenario 3

---

## Phase 6: US4 — Honest gaps (P2)

**Goal**: the product says what it doesn't know, per line, and shows how much of a song is explained.

**Independent test**: `piya-haji-ali` shows the lyric and no meaning at all, stating `2 sources · we need 4`. `arziyan` shows four explained lines, the rest honestly marked, and `4 of 26 lines explained`.

- [ ] T065 [US4] Ungrounded response shapes in `songPageService.ts` — `reason` ∈ `below_bar | no_material | mode_unavailable`, with `sourceCount`, `sourcesRequired`, and the sources that **do** exist (FR-036, FR-037)
- [ ] T066 [US4] `activeLineNo` = the first **servable** line, not line 1 — a user must land on a real explanation, never an empty panel
- [ ] T067 [US4] Summary ungrounded independently of lines in `songPageService.ts` (FR-024) — a summary must never be assembled from line meanings
- [ ] T068 [US4] Integration test in `backend/tests/integration/perLineHonesty.test.ts` — partly grounded song: grounded lines explained, ungrounded lines marked, no partial meaning anywhere (FR-025)
- [ ] T069 ⛔ [US4] `frontend/src/components/grounding/UngroundedState.tsx` — **BLOCKED on design artboard 3e.** Behaviour is specified; visual treatment is not. Do not start until [design_prompt_round2.md](../../design_prompt_round2.md) has been run and re-audited
- [ ] T070 ⛔ [US4] `frontend/src/components/grounding/CoverageIndicator.tsx` — **BLOCKED on design artboards 3d and 3f.** Same reason
- [ ] T071 [US4] "Notify me when it's ready" action alongside contribute in `frontend/src/components/grounding/NotifyMe.tsx`, posting to `backend/src/api/routes/notifyMe.ts` (FR-038)
- [ ] T072 [US4] E2E in `frontend/tests/e2e/honestGaps.spec.ts` — quickstart scenario 4

> T069 and T070 are the only blocked tasks. Everything else in US4 is backend and can proceed now.

---

## Phase 7: US5 — Mobile (P3)

**Goal**: readable on the device most people actually use.

**Independent test**: at 390px, tap a line — the meaning rises from the bottom, part of the lyric stays visible; tap a word without hitting its neighbour.

- [ ] T073 [P] [US5] `frontend/src/components/meaning/MeaningSheet.tsx` — bottom sheet, swipe to dismiss, lyric never fully obscured (FR-031)
- [ ] T074 [US5] Responsive switch at 1100px in `SongPage.tsx` — panel above, sheet below
- [ ] T075 [US5] ≥44×44px touch targets for individual words in `LyricLine.tsx`, achieved with **padding and line spacing, not smaller text** (FR-032)
- [ ] T076 [US5] E2E in `frontend/tests/e2e/mobile.spec.ts` at 390px — quickstart scenario 5

---

## Phase 8: US6 — Plan and quota (P3)

**Goal**: the free user always knows where they stand, and the server is the boundary.

**Independent test**: as Basic, the meter shows, the chatbot entry is visible and marked `PRO` and does not open — and the server refuses it regardless of the UI.

- [ ] T077 [US6] `viewer` block in the page response from `getEntitlements(userId)` — `null` when signed out (contract)
- [ ] T078 [P] [US6] `frontend/src/components/plan/QuotaMeter.tsx` — neutral until 1 remaining, then `--stale`. **Never red**
- [ ] T079 [P] [US6] `frontend/src/components/plan/ProBadge.tsx` — features shown and gated, not hidden
- [ ] T080 [US6] **Entitlement contract test** in `backend/tests/contract/entitlements.test.ts` — call each gated route directly with a Basic token and assert `402` with `PRO_ONLY_FEATURE`. Hiding a button is not a security boundary (FR-030)
- [ ] T081 [US6] Test in `backend/tests/integration/noQuotaConsumed.test.ts` — **no route in this feature consumes quota, ever** (FR-028)
- [ ] T082 [US6] E2E in `frontend/tests/e2e/planGating.spec.ts` — quickstart scenario 6

---

## Phase 9: Polish

- [ ] T083 [P] Keyboard path in `frontend/src/components/lyric/LyricColumn.tsx` and `frontend/src/components/meaning/MeaningPanel.tsx` — every meaning reachable and dismissible with Escape, across all three modes; E2E in `frontend/tests/e2e/keyboard.spec.ts` (FR-033)
- [ ] T084 [P] `lang="hi"` on Devanagari content, `lang="hi-Latn"` on Hinglish, so screen readers switch voice (FR-034)
- [ ] T085 [P] Visible focus everywhere: 2px `--accent` ring, 2px offset. No outline removed without a replacement
- [ ] T086 Performance check in `backend/tests/integration/largeSong.test.ts` and `frontend/tests/e2e/performance.spec.ts` — a 100+ line song, line selection with no perceptible delay (SC-008), and the R-03 windowing threshold above 150 lines
- [ ] T087 Remove any off-palette hex that crept in; confirm `tokens.css` is the only file containing hex values
- [ ] T088 Final `npm run verify` plus the two checks that must never be skipped: `npm run test:script-boundary` and `npm run test:grounding`

---

## Dependencies

```
Phase 1 Setup
    ↓
Phase 2 Foundational  ⚠️ blocking
    ↓
Phase 3 US1 (P1) ── MVP, demonstrable alone
    ↓
    ├── Phase 4 US2 (P2)  three languages
    ├── Phase 5 US3 (P2)  word meanings
    └── Phase 6 US4 (P2)  honest gaps   [T069, T070 blocked on design]
            ↓
    ├── Phase 7 US5 (P3)  mobile
    └── Phase 8 US6 (P3)  plan + quota
            ↓
        Phase 9 Polish
```

US2, US3 and US4 are independent of each other and may be built in any order once
US1 is done. US5 and US6 depend only on US1.

## Parallel opportunities

| Phase | Parallelisable |
|---|---|
| 1 | T002–T005 |
| 2 | T012–T026 — the domain rules are pure functions in separate files |
| 3 | T033/T034, T036/T037, T039–T041 |
| 4 | T045/T046, T048/T049 |
| 9 | T083–T085 |

## Implementation strategy

**MVP = Phase 1 + 2 + 3.** That gives one song, one language, meanings with
visible sources — the product's promise demonstrated end to end.

Then US2 (reaches the full audience), US4 (completes the honesty promise), US3
(the differentiating detail), then US5 and US6.

**Do not skip T035 or T053.** They are Principles I and III made testable. If
either fails, nothing else in this list matters.

## Summary

| | |
|---|---|
| Total tasks | 88 |
| Setup | 8 |
| Foundational | 19 |
| US1 (P1) | 16 |
| US2 (P2) | 13 |
| US3 (P2) | 8 |
| US4 (P2) | 8 (2 blocked) |
| US5 (P3) | 4 |
| US6 (P3) | 6 |
| Polish | 6 |
| Blocked | 2 — T069, T070, on design round 2 |
