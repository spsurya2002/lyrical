# Implementation Plan: Song Page — Trilingual Explanation Viewer

**Branch**: `001-song-page-trilingual` | **Date**: 2026-09-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-song-page-trilingual/spec.md`

## Summary

Build the read path for a song's explanation: lyrics, per-line meanings, word
meanings in song context, a song summary, and the sources behind each — rendered
in one of three language modes, with honest empty states wherever grounding falls
below the four-source bar.

The technical shape follows from three spec decisions. Meanings are stored
separately from the three language renderings of them, so the renderings cannot
drift. Meanings attach to a *word occurrence* rather than a spelling, so the same
word can mean different things twice in one song. And "is this explained?" is
counted from sources on every read rather than stored, so a stale flag can never
cause an under-grounded explanation to be served.

## Technical Context

**Language/Version**: TypeScript 5.x, Node 20 LTS

**Primary Dependencies**: React 18 + Vite (web) · Express (api) · Tailwind ·
BullMQ · `pg` · `google-auth-library` · `jsonwebtoken` · `express-rate-limit`

**Storage**: PostgreSQL 16 + pgvector (vector tables unused by this feature) ·
Redis for cache and queue

**Testing**: Vitest · Supertest · Playwright · Testcontainers (R-08)

**Target Platform**: Linux server; evergreen browsers, 390px and up

**Project Type**: Web application — two deployable units, per `tech_stack.md`

**Performance Goals**: mode switch < 1s at p95 with no loading state (SC-003) ·
line selection with no perceptible delay on 100+ line songs (SC-008)

**Constraints**: dark theme only · no Arabic/Urdu in any response · no quota
consumed on any route in this feature · every model call behind one interface

**Scale/Scope**: ~13 UI screens across the product; this feature is the song page
and its three endpoints

## Constitution Check

*GATE: passed before Phase 0, re-checked after Phase 1.*

| Principle | How this plan satisfies it | Where |
|---|---|---|
| **I — No ungrounded meaning** | `meaning_source` join is the physical gate: no rows, nothing served. Servability is *derived* per read, so it cannot go stale. Below-bar meanings return `ungrounded`, never a hedged meaning. `meaning` and `ungrounded` are mutually exclusive in the response — there is no shape that can express a partial answer | R-04, R-05, data-model, contract |
| **II — No ungrounded agent claims** | `npm run verify` is the single gate; every task ends with it run and its output quoted | quickstart |
| **III — Three languages, no Arabic/Urdu** | Validator runs at the serialisation boundary as well as on write, because this feature cannot assume the out-of-scope writer validated. Fixtures include a source stored in Urdu script, asserted never to be emitted | R-07, quickstart |
| **IV — Specs before code** | This plan derives from spec.md; tasks follow from it | — |
| **V — Owner approves** | No spend required: the feature runs on Postgres + Redis alone. Model provider needed only for the backfill job | quickstart |
| **VI — Cost is a feature** | No route here consumes quota, with a test asserting it. The one model-calling path (backfill) is a rate-limited background job, never a request path. Entitlements resolve through one server-side function; client gating is presentation only | R-02, contract |
| **VII — Simple until proven otherwise** | No new infrastructure beyond the agreed stack. Page assembled in two queries, not N+1. Derived values stay derived until profiling says otherwise | R-03, R-05 |

**Result: PASS.** No violations, so Complexity Tracking is omitted.

## Project Structure

### Documentation (this feature)

```text
specs/001-song-page-trilingual/
├── plan.md              # this file
├── spec.md              # what and why
├── research.md          # decisions R-01…R-10, with rationale
├── data-model.md        # the seven tables
├── quickstart.md        # run commands + validation scenarios
├── contracts/
│   └── song-page-api.md # the three endpoints
├── checklists/
│   └── requirements.md  # quality + design audit record
└── tasks.md             # created by /speckit-tasks, not yet
```

### Source code

Organised so the **flow reads top to bottom**. A request enters at `api/`, is
assembled in `services/`, has rules applied in `domain/`, and reaches the database
in `db/`. Nothing skips a layer.

```text
backend/
├── src/
│   ├── api/                      # HTTP surface — thin, no logic
│   │   ├── routes/
│   │   │   ├── songPage.ts       #    GET /api/songs/:slug
│   │   │   ├── wordMeaning.ts    #    GET /api/songs/:slug/words/:id
│   │   │   └── sources.ts        #    GET /api/meanings/:id/sources
│   │   └── middleware/
│   │       ├── optionalAuth.ts   #    signed-out visitors allowed (R-09)
│   │       └── rateLimit.ts
│   │
│   ├── services/                 # assembles a response from parts
│   │   ├── songPageService.ts    #    THE MAIN FLOW — start reading here
│   │   ├── wordMeaningService.ts
│   │   └── renderingBackfill.ts  #    enqueues missing renderings (R-02)
│   │
│   ├── domain/                   # the rules — pure, no I/O, easy to test
│   │   ├── grounding.ts          #    the four-source bar, servability
│   │   ├── coverage.ts           #    "4 of 26 lines explained"
│   │   ├── scriptValidator.ts    #    no Arabic/Urdu, correct script per mode
│   │   ├── modeScript.ts         #    mode → script mapping (R-01)
│   │   └── entitlements.ts       #    getEntitlements() — the ONE source
│   │
│   ├── db/
│   │   ├── migrations/
│   │   ├── queries/
│   │   │   ├── songPage.sql.ts   #    the two-query page fetch
│   │   │   └── wordMeaning.sql.ts
│   │   └── seed/                 #    the five fixture songs
│   │
│   ├── llm/
│   │   ├── LlmProvider.ts        #    the interface — the only type outside leaks
│   │   └── providers/
│   │       ├── gemini.ts         #    SDK imports allowed ONLY in here
│   │       └── ollama.ts
│   │
│   ├── jobs/
│   │   └── backfillRendering.ts  #    BullMQ worker
│   │
│   └── config/
│       └── index.ts              #    GROUNDING_MIN_SOURCES, limits, models
│
└── tests/
    ├── unit/                     #    domain/ — pure rules
    ├── integration/              #    real Postgres via Testcontainers
    └── contract/                 #    the three endpoints via Supertest

frontend/
├── src/
│   ├── pages/
│   │   └── SongPage.tsx          #    THE MAIN SCREEN — start reading here
│   ├── components/
│   │   ├── lyric/
│   │   │   ├── LyricColumn.tsx
│   │   │   └── LyricLine.tsx     #    ⚠ the ONLY place lyrics render (R-001)
│   │   ├── meaning/
│   │   │   ├── MeaningPanel.tsx  #    desktop
│   │   │   ├── MeaningSheet.tsx  #    mobile bottom sheet
│   │   │   └── WordGloss.tsx
│   │   ├── grounding/
│   │   │   ├── SourceStrip.tsx
│   │   │   ├── GroundedMark.tsx
│   │   │   ├── CoverageIndicator.tsx   # FR-026
│   │   │   └── UngroundedState.tsx     # FR-023, FR-036, FR-037
│   │   ├── language/
│   │   │   └── ModeSwitch.tsx
│   │   └── plan/
│   │       ├── QuotaMeter.tsx
│   │       └── ProBadge.tsx
│   ├── hooks/
│   │   ├── useSongPage.ts
│   │   └── useLanguageMode.ts    #    persistence, per R-09
│   └── styles/
│       └── tokens.css            #    the ONLY hex values in the codebase
└── tests/
```

**Structure Decision**: two workspaces in one repo (`backend/`, `frontend/`),
matching `tech_stack.md`'s two deployable units. The backend's four-layer split
(`api → services → domain → db`) exists so the rules that matter — grounding,
script validation, entitlements — live in `domain/` as pure functions with no I/O.
That makes them readable on their own and testable without a database, which
matters because they are the three things the constitution actually protects.

### Reading the code in order

For following the flow without reading everything:

1. `backend/src/api/routes/songPage.ts` — where a request arrives
2. `backend/src/services/songPageService.ts` — how the page is assembled
3. `backend/src/domain/grounding.ts` — the four-source bar, the product's core rule
4. `backend/src/domain/scriptValidator.ts` — the Arabic/Urdu boundary
5. `frontend/src/pages/SongPage.tsx` — what the user sees
6. `frontend/src/components/grounding/` — the honesty UI

### Two files with special standing

- **`frontend/src/components/lyric/LyricLine.tsx`** — the only component that
  renders lyric text. R-001 (lyrics licensing) is an accepted risk; keeping
  rendering in one place is what makes switching to excerpt-only a contained
  change rather than a page redesign.
- **`backend/src/llm/providers/`** — the only directory permitted to import a
  model-provider SDK. A test asserts this, so a leak fails the build rather than
  being discovered at provider-switch time.

## Phase status

| Phase | Output | Status |
|---|---|---|
| 0 — Research | [research.md](research.md) | Complete, 10 decisions |
| 1 — Data model | [data-model.md](data-model.md) | Complete, 7 tables |
| 1 — Contracts | [contracts/song-page-api.md](contracts/song-page-api.md) | Complete, 3 endpoints |
| 1 — Quickstart | [quickstart.md](quickstart.md) | Complete |
| 2 — Tasks | `tasks.md` | **Not started** — run `/speckit-tasks` |

## Known open items

Neither blocks `/speckit-tasks`.

- **Design artboards 3d–3f** ([design_prompt_round2.md](../../design_prompt_round2.md))
  — affects the visual detail of `CoverageIndicator` and `UngroundedState`, not
  the architecture. Close before those two components are implemented.
- **Payment provider** — project-wide, and not used by this feature.
