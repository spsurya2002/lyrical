# Quickstart — Song Page

**Feature**: 001-song-page-trilingual

> **Nothing here exists yet.** This file is the contract for the commands the
> implementation must provide, written before the code so the commands are
> designed rather than accumulated. Every command below must work by the time
> `/speckit-implement` reports done.

---

## One-time setup

```bash
npm install                 # installs both workspaces
docker compose up -d        # Postgres + pgvector, Redis
cp .env.example .env        # then fill in the values below
npm run db:migrate          # create schema
npm run db:seed             # load fixture songs (see below)
```

### `.env` values needed

| Variable | For | Needed to run the page? |
|---|---|---|
| `DATABASE_URL` | Postgres | **Yes** |
| `REDIS_URL` | cache + queue | **Yes** |
| `JWT_SECRET` | session tokens | Yes, any random string locally |
| `GOOGLE_CLIENT_ID` / `_SECRET` | Google login | No — signed-out works (R-09) |
| `LLM_PROVIDER` | `gemini` \| `ollama` | No — only the backfill job uses it |
| `GEMINI_API_KEY` | backfill job | No, unless testing backfill |
| `GROUNDING_MIN_SOURCES` | the four-source bar | No — defaults to `4` |

**You can run and read the whole song page with only the first three.** The model
provider is needed only for the rendering-backfill job.

---

## Running it

```bash
npm run dev                 # both: API on :3000, web on :5173
npm run dev:api             # backend only
npm run dev:web             # frontend only
npm run worker              # BullMQ worker (backfill jobs)
```

Then open **http://localhost:5173/song/kun-faya-kun**

## Checking it

```bash
npm test                    # unit + integration (Vitest)
npm run test:e2e            # Playwright journeys
npm run typecheck           # tsc --noEmit, both workspaces
npm run lint
npm run verify              # typecheck + lint + test + e2e — the gate
```

`npm run verify` is what must pass before any task is reported done.

---

## Seed fixtures — chosen to exercise the hard cases

`npm run db:seed` loads five songs, each proving something specific:

| Slug | What it proves |
|---|---|
| `kun-faya-kun` | Fully grounded. All three modes, source strips, word meanings |
| `piya-haji-ali` | **Below the bar** — 2 sources, needs 4. FR-005, FR-036, FR-037 |
| `arziyan` | **Partly grounded** — 4 of 26 lines. FR-023, FR-026, coverage indicator |
| `khwaja-mere-khwaja` | Same word, **two different meanings** in one song. FR-018, FR-019 |
| `tere-bina` | A **stale** meaning, and one **unreachable** source that still counts |

Fixtures contain real qawwali vocabulary, and at least one source excerpt stored
in Urdu script — present in the database, and asserted never to appear in any
response.

---

## Validation scenarios

Each maps to acceptance scenarios in [spec.md](spec.md). Run them after
`npm run dev`.

### 1 — Read a song and see its sources *(User Story 1)*

Open `/song/kun-faya-kun`. Expect: lyrics, the first **grounded** line already
explained, a source count on every explanation, and a song summary. Open a source
chip — it shows domain, type, and the excerpt actually used.

### 2 — All three languages *(User Story 2)*

Switch English → Hindi → Hinglish.

- Hindi renders in Devanagari; Hinglish in Latin with Hindi wording.
- **No loading state appears** at any point.
- Scroll position and active line survive every switch.
- The quota meter does not move.

### 3 — Word meanings differ within one song *(User Story 3)*

On `/song/khwaja-mere-khwaja`, select the same word at two occurrences. Expect two
different meanings and an explicit statement that the uses differ.

### 4 — Honest gaps *(User Story 4)*

- `/song/piya-haji-ali` — the lyric shows, **no meaning of any kind**, and the page
  states `2 sources · we need 4`, with contribute and notify paths.
- `/song/arziyan` — four lines explained, the rest honestly marked, and a coverage
  indicator reading `4 of 26 lines explained`.

### 5 — Mobile *(User Story 5)*

At 390px, tap a line: the meaning rises from the bottom, part of the lyric stays
visible. Tap an individual word — the target is comfortable, and does not select
its neighbour.

### 6 — Plan gating *(User Story 6)*

As a Basic user: the quota meter shows, the chatbot entry is visible and marked
`PRO`, and does not open.

```bash
# The check that matters — the server must refuse regardless of the UI
curl -H "Authorization: Bearer <basic-user-token>" \
     localhost:3000/api/chat/kun-faya-kun
# expect: 402 { "reason": "PRO_ONLY_FEATURE" }
```

---

## The two checks that must never be skipped

```bash
npm run test:script-boundary   # zero Arabic/Urdu in any response, all modes,
                               # including the song whose source IS in Urdu script

npm run test:grounding         # with retrieval stripped, the page produces the
                               # ungrounded state — never an answer
```

These are Principles III and I. If either fails, nothing else matters.
