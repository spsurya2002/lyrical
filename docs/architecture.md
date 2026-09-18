# Architecture

How LyricSense actually works, and why it is built this way.

Written 2026-09-19, after spec 001 shipped the song page and before the content
pipeline was built. It supersedes the sequencing in `roadmap.md`.

---

## Context

Spec 001 shipped a song page — three languages, per-line and per-word meanings,
grounding rules, 241 tests. It reads from a contract, and the content behind
that contract was never built.

Two objections were raised before building it, and both were correct:

1. **A crawler is the wrong foundation** — legal exposure, patchy coverage,
   blocked domains, and lyrics that may not be the song the user asked for.
2. **Pure AI is expensive and unfaithful** — generated meaning drifts from what
   the song actually means, and re-deriving it per query pays repeatedly for a
   worse answer.

Two artefacts settled the redesign: the `lyrics-finder` prototype, and two
reference PDFs on *Dama Dam Mast Qalandar* (English and Hinglish) that establish
the quality bar. The PDFs are kept locally rather than in this repo — they
contain full lyrics, and there is no reason to add more of that to a public
repository than the product already requires.

---

## 1. The central insight

The reference documents are not "good output". They are a specification. Look at
where their words go:

| Section | Song-specific? |
|---|---|
| What a *manqabat* is; what a *dhamaal* is | **No** — genre |
| Lal Shahbaz Qalandar; Sehwan Sharif; the *chaar yaar* | **No** — entities |
| *dam*, *sukr*, *sahw*, *malamati*, *dhikr*, *fana* | **No** — Sufi vocabulary |
| "*pat* is honour, **not** scarf" | **No** — a word-sense |
| "Four mistranslations you will meet online" | **No** — negative knowledge |
| Which lines this song has | **Yes** |
| How those concepts land in *these* lines | **Yes** |

**Most of the document is not about that song.** *Dam* means breath in every
qawwali. *Mast* means *sukr* in all of them. A few thousand concepts and entities
carry an enormous catalogue.

> **The reusable unit is the concept, the entity and the word-sense — not the
> song.**

Two consequences:

- **Cost falls as the catalogue grows.** The expensive thinking happens once. The
  tenth song using *sukr* costs almost nothing. A naive pipeline pays full price
  forever.
- **Accuracy becomes auditable.** A curated concept you can read and correct
  beats the same concept re-derived by a model on every request.

The reference documents also hedge by evidence class — *"shrine tradition, worth
knowing, but legend rather than documented fact"* — and devote a section to
corrections. The generator must reproduce that; the verifier must check it.

---

## 2. What lyrics actually look like

LRCLIB was queried directly against the real catalogue rather than assumed.

**Coverage is good.** Every song returned results — *Dama Dam Mast Qalandar* 6,
*Kun Faya Kun* 20, *Afreen Afreen* 20, *Chaap Tilak* 20, *Arziyan* 12,
*Khwaja Mere Khwaja* 20.

**Quality varies enormously.** The four top hits for one song:

```
Mame Khan         1952 ch   "He naa naa / Maula aa aa / Laali Mere Laal Ki"
Wadali Brothers   8993 ch   "aahhh... aaaahh aeeyyy / tera hi naam sunkar..."
Merian            1811 ch   "Ho o o o / Ho o o o / Ho o o o"
Hans Raj Hans     1024 ch   "Ho Lal meri pat rakhiyo bala Jhoole Laalan..."
```

One is transcribed live *alaap*. One is mostly vocalisation. One is the clean
text. They disagree on spelling throughout — `bala`/`bhala`, `Sehvan`/`Sehwan`,
`Shabaaz`/`Shahbaz`. Scripts are inconsistent, and **one *Kun Faya Kun* entry is
29% Arabic script**, which Principle III forbids from reaching a user.

### A song is a family of performances

The reference document says it plainly: *"a folk text with no fixed author and no
fixed lyrics… almost every singer adds or drops verses."*

Spec 001's schema assumes `song → lines 1..N`, one text. That is a pop-song model
and it is wrong for this catalogue:

- **Work** — the song as a tradition
- **Rendition** — a specific recording
- **Canonical line** — belongs to the Work; renditions include, omit, reorder

**Meanings attach to the Work's lines, never to a rendition.** That is what makes
knowledge reusable across every recording of a song.

### One principle grounds both halves

Which text is right? **Cross-source agreement.** Five of six transcriptions carry
a line → canonical. One carries it → that singer's addition.

This is the same rule the product already applies to meanings:

> **Nothing is asserted on one source's say-so. Not a meaning, and not a lyric.**

---

## 3. What the prototype already got right

`lyrics-finder` is **API-first**, not a crawler. The crawl is a fallback that is
skipped entirely when a database answers well:

> *"A database that recognised the song by name beats anything the crawl is
> likely to add, and crawling costs ten seconds of blocked search engines."*
> — `lyricsFinder.ts:118`

| Layer | Source | Method | Posture |
|---|---|---|---|
| Identity | `youtube.com/oembed` | official, keyless | ✅ |
| Identity | `itunes.apple.com/search` | official, keyless | ✅ |
| Lyrics | `lrclib.net/api/search` | official REST, keyless, MIT, no rate limit | ✅ |
| Lyrics | `api.lyrics.ovh` | official, keyless | ✅ |
| Fallback | Bing / DuckDuckGo / Mojeek | HTML scraping | ❌ ToS |
| Fallback | Genius / AZLyrics | HTML scraping | ❌ ToS |

Roughly **800 of 2,487 lines** are the clean API path, and the two halves are
cleanly separated in the code.

**Lifted near-verbatim:**

- `utils/text.ts` — 265 lines, **zero dependencies**. `fuzzyCoverage` (capped
  Levenshtein, written for transliteration variance), `detectScripts`,
  `splitScriptSeams`, `distinctiveTokens`, `parseVideoTitle`. This already solves
  the `Sehvan`/`Sehwan` problem.
- `services/youtube.ts` — oEmbed resolution, no API key.
- `services/songResolver.ts` — iTunes canonicalisation with a two-way
  `fuzzyCoverage` gate that stops *"Sokoot E Shab"* matching *"Shab e Hijr"*.
- `services/lyricsApis.ts` — LRCLIB query-laddering and per-script collection.
- `extractor.lyricsLikeness` — scores "does this read like a song". This is what
  rejects the `Ho o o o` entry.

### Two gaps the prototype does not close

**There is no transliteration anywhere.** The Roman / اردو / हिन्दी toggle works
by finding the same song *already typed in different scripts by different LRCLIB
contributors*. If a song exists in one script only, the toggle disappears.

That is fine for a lyrics finder and a **blocker** for LyricSense, which requires
all three modes for every song. *Dama Dam Mast Qalandar* is 100% Latin across all
six candidates — there is no Devanagari to find. Transliteration therefore
becomes its own pipeline stage.

**The prototype deliberately surfaces Arabic script.** LyricSense forbids it.
Same code, opposite rule — the ingest boundary must transliterate or drop it.

---

## 4. What survives from spec 001

The schema **extends rather than changes**.

**Load-bearing — not touched without a constitutional amendment:**
`domain/grounding.ts`, `domain/scriptValidator.ts`, `domain/modeScript.ts`, the
`meaning` / `meaning_rendering` / `meaning_source` triad, the partial unique index
that lets a stale meaning stay readable, the `LineView` discriminated union.

**Reusable unchanged:** the entire read path, the entire frontend,
`coverage.ts`, `entitlements.ts`, `LlmProvider.ts`, the BullMQ wiring,
`migrate.ts`, config, rate limiting, **~80% of the tests**.

**The gap, stated plainly:** there is no retrieval, no chunking, no embedding, no
citation binding, no generation, no contribution ingestion, and no quota
*consumption*. `meaning_source` — the table the whole constitution rests on —
**has no writer**. It is a well-defended empty room.

**Four genuine schema changes, not additions:**

| Change | Why |
|---|---|
| relax `source.url NOT NULL UNIQUE` | blocks image contributions and re-crawl snapshots |
| widen `source_type` | needs contribution kinds |
| add `concept` to `meaning_target` | if concepts reuse the meaning machinery |
| add `source_chunk` beside `source.excerpt` | one frozen snippet per URL cannot serve RAG |

Plus: **`lyric_line_text` has no provenance at all.** There is no answer today to
"where did this transcription come from, and how sure are we". `pgvector` is
provisioned in `docker-compose.yml` but no extension is created.

---

## 5. The architecture

```
   query: name, YouTube URL, or a half-remembered line
              │
   ┌──────────▼───────────┐
   │ 1. IDENTITY          │  YouTube oEmbed → iTunes → candidates
   │                      │  disambiguate, never guess
   └──────────┬───────────┘
   ┌──────────▼───────────┐
   │ 2. LYRICS            │  APIs → curated crawl → filter → normalise
   │                      │  → reconcile → transliterate → confidence
   └──────────┬───────────┘
   ┌──────────▼───────────┐      ┌──────────────────────────┐
   │ 3. EXPLANATION       │◄────►│ 4. KNOWLEDGE BASE        │
   │    agentic RAG       │      │  concepts · entities     │
   │                      │      │  word-senses · errors    │
   └──────────┬───────────┘      └──────────────────────────┘
   ┌──────────▼───────────┐              ▲
   │ 5. VERIFICATION      │──────────────┘ agent writes back
   │    the AI monitor    │                what it had to learn
   └──────────┬───────────┘
   ┌──────────▼───────────┐
   │ 6. PRESENTATION      │  already built — unchanged
   └──────────────────────┘
```

### Layer 1 — Identity

YouTube oEmbed and iTunes, both keyless. Returns **ranked candidates**, never one
answer. Ambiguity is shown to the user, because guessing here poisons everything
downstream — this is the "lyrics may not match what the user asked for" failure,
and the fix is to make resolution *visible* rather than cleverer.

### Layer 2 — Lyrics

1. **Fetch** from LRCLIB, then lyrics.ovh, then — only if both fall short — a
   **curated site list**, crawled with an honest user-agent and working
   robots.txt handling (D1). No search engines.
2. **Filter** junk via `lyricsLikeness`.
3. **Normalise** script to `deva` + `latn`. **Arabic is transliterated or dropped
   at ingest** and never stored for display.
4. **Reconcile** candidates into canonical Work lines by cross-source agreement,
   using `fuzzyCoverage` so `Sehvan`/`Sehwan` are one line.
5. **Transliterate** the missing script — rules first, model only where the rules
   flag uncertainty (D2) — so all three modes always exist.
6. **Score** confidence per line and per work.
7. **Store every candidate with provenance** — never only the winner, so a
   re-reconcile needs no refetch.

**Gate: below a confidence threshold, the Work is not explained at all.** An
explanation of the wrong lyrics is worse than none.

### Layer 3 — Explanation (agentic RAG)

For each line the agent retrieves concepts, entities and word-senses from the KB;
identifies terms it has **no** knowledge for; researches only those and **writes
them into the KB**; then generates from retrieved knowledge, never recall.

The write-back is the growth engine. The KB improves every time someone opens a
song it has not seen, and the next song using that concept is free.

### Layer 4 — Knowledge base *(the moat)*

| Kind | Examples |
|---|---|
| **Concept** | *dam*, *sukr*, *sahw*, *fana*, *malamati*, *dhikr* |
| **Entity** | Lal Shahbaz Qalandar, Amir Khusrau, Sehwan Sharif |
| **Form** | qawwali, manqabat, hamd, naat, dhamaal, kafi |
| **Word-sense** | *pat* → honour · *laal* → red / ruby / beloved |
| **Known error** | "*pat* = scarf" · "*mast* = drunk on alcohol" |

Each entry carries sources, confidence, **evidence class** (documented /
traditional / disputed) and **provenance** (curated / researched / contributed).

The **known-error table** is unusual and important. Those are precisely what a
crawl-and-summarise pipeline reproduces. Storing negative knowledge is the only
mechanism here that lets the verifier catch a model repeating a known
mistranslation.

#### A concept is evidence, never a substitute

The existing schema's central conviction is that *meanings attach to an
occurrence, never to a spelling* (FR-018 — the same word means different things
in two songs, and twice in one). A concept KB is the opposite shape.

They coexist only if a concept **feeds** an occurrence meaning as evidence. If a
page ever serves a concept gloss *in place of* an occurrence meaning, FR-018
breaks and the `differs` logic collapses. **This is the highest-leverage
constraint in the redesign.**

#### On fine-tuning

Fine-tuning bakes knowledge into weights where **it cannot be cited**, which
breaks Principle I outright, and it cannot be corrected without retraining. RAG
keeps provenance, stays auditable, and updates instantly. Fine-tuning may later
be worth it for *style* — matching the reference documents' register — but never
for facts.

### Layer 5 — Verification, the AI monitor

A **separate pass**, not a prompt instruction: a generator asked to check itself
is one model with one blind spot.

| Check | Fails when |
|---|---|
| Lyric match | retrieved text isn't the work asked for |
| Grounding | a claim traces to no KB entry or source |
| Known error | output repeats something in the error table |
| Hedging | a traditional claim is stated as documented fact |
| Script | prohibited script, or wrong script for the mode |
| Register | "Hinglish" that is really English |

Cheap model, narrow job. Failure withholds the output and records why.

### Layer 6 — Presentation

**Already built and unchanged.**

---

## 6. Cost model

| | Naive | This |
|---|---|---|
| First song using *sukr* | full research | research + KB write |
| Tenth song using *sukr* | full research | KB retrieval ≈ 0 |
| Same song, 2nd visitor | full research | cache hit, 0 |
| Chatbot question | web search | KB + stored sources, no crawl |

Three caches: **KB** (shared across songs — the big one), **explanation** (per
work, feature C), **lyrics** (per work). Plus per-job model routing: a strong
model generates once, a cheap model verifies every time.

`LlmProvider` today has one method returning a string — no embeddings, no
structured output, no token accounting. Those are additions to the port, not
rewrites.

---

## 7. Decisions

### D1 — API first, then a curated crawl. No search engines.

Order: LRCLIB → lyrics.ovh → **curated site list** (rekhta.org, hindigeetmala,
lyricstranslate, sufi archives). Search-engine scraping is **removed** — it broke
three sets of terms and was the most fragile part of the prototype.

Required before any crawl ships:

- **Honest self-identifying user-agent.** The Chrome spoof goes.
- **Fix the robots.txt parser** — add `Allow:` support. Note that
  self-identifying re-enables named crawler groups the spoof was silently
  skipping, so some sites will now correctly block us. That is the point.
- Keep the existing per-host throttle, concurrency cap and page budget.

*Consequence*: narrower reach than search. Songs neither the APIs nor the curated
list carry fall to the honest ungrounded state and a contribution prompt — which
is behaviour the product already has.

### D2 — Transliteration: rules first, model where uncertain

A deterministic transliterator handles the unambiguous majority at zero cost.
Where it flags uncertainty — nuqta placement, Perso-Arabic loanwords, the
`Sehvan`/`Sehwan` class — a model resolves it. Both paths pass the script
validator before storage.

Two code paths is the accepted cost; the alternative is paying a model to turn
`ghar` into `घर`.

### D3 — Display full lyrics for now; rights status decides later

Full lyrics stay displayed, as in spec 001. The decision for copyrighted works is
deferred — **but made actionable now** rather than left as a note.

`work.rights_status ∈ unknown | free | copyrighted | licensed`, with a display
policy keyed to it. Today every status renders in full. When the decision comes,
changing `copyrighted` to excerpt-only is a config change plus one component, not
a redesign. `LyricLine.tsx` being the single rendering component is what makes
that true, and it stays that way.

*R-001 remains open, and exposure still grows with the catalogue.*

### D4 — No curated seed; the knowledge base grows agentically

The KB starts empty and fills as songs are researched.

*Consequence*: the first several dozen songs are expensive — every concept is a
first encounter — and their entries arrive unreviewed. Two cheap mitigations:

- Every entry carries `provenance` and `reviewed`. Agent-written entries start
  unreviewed.
- The verifier trusts unreviewed entries less, and a review queue surfaces the
  most-used unreviewed entries first — so the concepts carrying the most songs
  get attention first.

---

## 8. Schema additions these decisions imply

Beyond the four changes in §4:

| Addition | For |
|---|---|
| `work.rights_status` + display policy | D3 — makes the deferred decision a config change |
| `lyric_line_text.source_id`, `confidence`, `transliterated_by` | provenance the schema has none of |
| `kb_entry.provenance`, `.reviewed`, `.evidence_class` | D4 — keeps unreviewed growth safe |
| `source.origin ∈ api \| crawl \| contribution \| manual` | distinguishes a licensed API row from a crawled page |

---

## 9. Risk register

| # | Risk | Sev | Mitigation |
|---|---|---|---|
| R1 | **Lyrics copyright** | High | Open (R-001, D3). APIs reduce crawl exposure, not the underlying question |
| R2 | Wrong song matched | High | Identity surfaces ambiguity; verifier re-checks |
| R3 | Wrong lyric variant | High | Cross-source reconciliation; confidence gate blocks explanation |
| R4 | KB accumulates wrong facts | High | Sourced, versioned, evidence-classed, reviewable; verifier discounts unreviewed |
| R5 | Hallucinated meaning | High | Generate from retrieved only; separate verifier; known-error table |
| R6 | Cost runaway | Med | KB-first; three caches; model routing; limits already built |
| R7 | LRCLIB single dependency | Med | Adapter interface; store raw candidates |
| R8 | Transliteration variance | Med | `fuzzyCoverage` at reconcile; never claim one spelling correct |
| R9 | Missing script for a song | Med | Transliteration stage (D2) — required for three modes |
| R10 | Prohibited script at ingest | Med | Validator at ingest as well as output — sources genuinely contain it |
| R11 | Long-tail coverage | Med | Honest ungrounded state exists; contributions are the answer |
| R12 | Crawl blocked after honest UA | Med | Accepted consequence of D1; APIs carry the common case |

---

## 10. Spec sequence

Replaces the sequencing in `roadmap.md`.

| Spec | Scope |
|---|---|
| **002** | Schema — Work/Rendition, lyric provenance, KB tables, `source_chunk`, pgvector, `rights_status` |
| **003** | Lyrics pipeline — adapters, curated crawl, reconciliation, confidence, transliteration |
| **004** | Knowledge base — schema, retrieval, review queue |
| **005** | Explanation agent — agentic RAG with KB write-back |
| **006** | Verification layer |
| **007** | Identity and discovery — search, disambiguation, landing |
| **008+** | Accounts, contributions, library, payments, chatbot, export |

002–006 produces one real, trustworthy explained song. 007 makes it reachable.

---

## 11. How this gets verified

- **Lyrics**: run the pipeline over the fixture songs plus *Dama Dam Mast
  Qalandar*; assert the canonical text matches the reference document's line set;
  assert no Arabic script survives ingest; assert all three modes exist.
- **Grounding**: the constitution-mandated test that does not yet exist — strip
  retrieval, assert the pipeline produces the not-enough-material state rather
  than an answer.
- **KB reuse**: research two songs sharing *dam*; assert the second makes no model
  call for that concept.
- **Verifier**: feed it a known mistranslation from the reference list; assert it
  rejects.
- **Quality**: compare generated output against the reference document by hand.
  That document is the bar.
- `npm run verify` stays green throughout — it is the regression net for
  everything spec 001 proved.
