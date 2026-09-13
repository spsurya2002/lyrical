# Phase 0 — Research & Design Decisions

**Feature**: 001-song-page-trilingual
**Date**: 2026-09-12

Decisions taken to resolve unknowns before design. Each records what was chosen,
why, and what was rejected.

---

## R-01 — Lyric text is stored by *script*, not by *mode*

**Decision**: lyric lines are stored in two script variants, `deva` and `latn`, not
three mode variants. Mode maps to script: `hi → deva`, `en → latn`, `hi-Latn → latn`.

**Rationale**: English and Hinglish modes show the *same* romanized lyric — only
the explanation differs between them. Storing three copies would mean two of them
must be kept identical forever, and the first time they drift, the same song shows
different lyrics in two modes. Storing by script makes drift structurally
impossible and cuts lyric storage by a third.

**Rejected**: mode-keyed lyric storage — uniform with meaning renderings, but
creates a duplicate that has to be manually kept in sync.

**Note**: meaning renderings *are* mode-keyed (three), because English and Hinglish
explanations genuinely differ. Only the lyric collapses.

---

## R-02 — A missing rendering is backfilled asynchronously, never inline

**The conflict**: `docs/language_policy.md` says a missing rendering is "generated
on demand from the stored meaning". FR-014 says a mode change must show **no
loading state**. An inline model call cannot satisfy both.

**Decision**: all three renderings are produced together when the explanation is
first created (research pipeline, out of scope here). The read path assumes they
exist. If one is missing, the page:

1. serves every entity that *does* have the requested rendering,
2. shows an honest per-entity "not available in this language yet" state for those
   that don't,
3. enqueues a backfill job (BullMQ) for the missing renderings,
4. never blocks, never shows a spinner, never falls back to another language.

**Rationale**: falling back to English in Hindi mode would silently violate the
mode contract — the user would be reading English believing it was all that
existed. An honest gap is the product's established answer to missing material,
and this is the same answer applied to a different kind of gap.

**Rejected**: inline generation (violates FR-014); language fallback (violates the
mode contract and the product's core promise); blocking the whole page on one
missing rendering (punishes the user for a data gap).

**Consequence**: this is the only model-calling path in this feature, it is a
background job rather than a request path, and it still requires a rate limit per
Principle VI.

---

## R-03 — Line meanings ship with the page; word meanings are lazy

**Decision**: the page payload includes every line's meaning for the active mode.
Word-occurrence meanings are fetched on selection.

**Rationale**: SC-008 requires line selection with no perceptible delay, and a
round trip per line cannot guarantee that. A line meaning is roughly 400–800
characters; a 100-line qawwali is therefore ~60–80 KB uncompressed, well under 20 KB
gzipped — cheap enough to send once. Word occurrences are a different order of
magnitude: a long song has 400+ of them and a user opens perhaps five.

**Rejected**: lazy line meanings (fails SC-008); eager word meanings (payload
dominated by content almost nobody opens).

### Amended 2026-09-13 — windowing dropped, on measurement

This decision originally added: *"above 150 lines, switch to windowed loading."*
That was a projection made before anything had been measured. A 200-line fixture
was then added and measured (T086, `tests/integration/largeSong.test.ts`):

```
payload: 47.2 KB for 200 lines
26 lines: 7ms · 200 lines: 8ms  (1.1x for 7.7x the lines)
```

Both halves of the projection were wrong. The payload is well under the 60–80 KB
this decision estimated for a song half that length, and response time barely
moves with line count because the three fixed queries dominate — the per-line
cost is close to nothing.

**Windowing is therefore not built**, and `LINE_WINDOWING_THRESHOLD` is removed
rather than left in place unused: a configuration value that controls nothing is
a claim about the system that isn't true.

The test keeps the numbers honest. Its timing assertion fails if the page ever
becomes more than linearly expensive in lines, which is the shape an N+1 would
take — the actual risk this decision was worried about.

---

## R-04 — The four-source bar is applied at read time, from configuration

**Decision**: `GROUNDING_MIN_SOURCES` (default `4`) is read from configuration and
applied when the page is assembled. Meanings below the bar remain stored; they are
simply not served.

**Rationale**: D-003 is a *display* policy, not a data-integrity rule. Storing
below-bar meanings is what lets FR-037 disclose "2 sources · we need 4", and lets
a song become explained the moment contributions push it over the line, with no
regeneration. Making the bar configuration means it can be tuned as the catalogue
grows without a migration or a code change.

**Rejected**: refusing to store below-bar meanings (loses the material needed for
FR-037 and forces a re-run when the bar is met); hardcoding `4` (forbidden by
`docs/subscription_plans.md` and Principle VI's configuration rule).

---

## R-05 — Grounded status is derived, never stored

**Decision**: whether a meaning is servable is computed as
`count(reachable sources) >= GROUNDING_MIN_SOURCES`, at query time.

**Rationale**: a stored boolean would go stale the instant a contribution lands or
a source goes unreachable, and would have to be recomputed by a background job
that could fail silently — producing exactly the "shows meaning without adequate
grounding" failure the constitution forbids. Deriving it makes that class of bug
impossible.

**Performance**: the count is maintained by a covering index and materialised into
the page query as an aggregate. If profiling later shows it hot, the fix is a
materialised view refreshed on source change — not a denormalised flag.

**Rejected**: a stored `is_grounded` column; a nightly recompute job.

---

## R-06 — Coverage is computed, not stored

**Decision**: FR-026's "4 of 26 lines explained" is derived in the same query that
assembles the page, from the same aggregate as R-05.

**Rationale**: it must never disagree with what the page actually shows. Deriving
both numbers from one source makes disagreement impossible.

---

## R-07 — The script validator runs on read as well as write

**Decision**: every user-facing payload passes the script validator immediately
before serialisation, in addition to validation at write time.

**Rationale**: the research pipeline that writes this data is out of scope for this
feature, so this feature cannot rely on its validation having run. Data may also
predate a validator fix. Principle III says Arabic/Urdu must never reach a user —
the only way to guarantee that is to check at the last boundary before it leaves.

**Failure behaviour**: a failing entity is withheld and its ungrounded state served
in its place; the failure is logged with the entity id at error level. The page
does not fail wholesale for one bad line, and a validator failure is never
swallowed silently.

**Cost**: a regex scan over a few tens of KB per request, cached alongside the
rendered payload. Negligible.

---

## R-08 — Testing: Vitest, Supertest, Playwright

**Decision**: Vitest for unit and integration tests on both frontend and backend,
Supertest for HTTP contract tests, Playwright for the end-to-end language and
keyboard journeys. Testcontainers for a real Postgres in integration tests.

**Rationale**: `tech_stack.md` does not name a test stack, so this resolves it.
Vitest shares Vite's config and transform, so the frontend needs no second
toolchain and the backend gets the same runner — one idiom, per CLAUDE.md §6. A
real Postgres matters here because the grounding query depends on aggregate
behaviour that an in-memory fake would not reproduce.

**Rejected**: Jest (second toolchain alongside Vite for no gain); mocked database
(would not exercise the query that enforces the constitution's central rule).

---

## R-09 — Signed-out visitors can read; mode persists per device

**Decision**: the page read route takes optional authentication. Signed-out
visitors get the full page, with the quota meter and chatbot entry replaced by a
sign-in prompt. Their chosen mode persists in `localStorage`.

**Rationale**: already settled in the spec's Assumptions — serving cached
explanations costs almost nothing, and a login wall before anyone sees value would
suppress adoption. Recorded here because it determines that auth middleware on this
route must be optional rather than required, which is easy to get wrong.

---

## R-10 — Provider-agnostic model access

**Decision**: one internal interface (`LlmProvider`) with per-job configuration.
Only the rendering-backfill job uses it in this feature. Gemini adapter first,
Ollama adapter for local development.

**Rationale**: required by `tech_stack.md`. No provider SDK type may appear outside
its adapter — the moment one leaks into a service signature, switching providers
becomes a refactor instead of a new file.

**Enforced by**: a test asserting no provider SDK import exists outside
`src/llm/providers/`.

---

## Open items carried into implementation

| Item | Status |
|---|---|
| Payment provider | Open project-wide; **not needed** for this feature |
| Design artboards 3d–3f | Outstanding; affects visual detail of FR-023 and FR-026, not architecture |
| Gemini API key | Needed only for the backfill job; local development can use Ollama |
