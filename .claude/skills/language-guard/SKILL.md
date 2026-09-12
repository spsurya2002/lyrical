---
name: "language-guard"
description: "Enforce the LyricSense three-language output contract (English, Hindi, Hinglish) and the absolute prohibition on Arabic/Urdu script reaching a user. Load BEFORE writing or changing anything that generates, renders, stores, translates, transliterates, or tests user-facing text — model prompts, rendering components, API response shapes, cache keys, seed data, fixtures, share cards, or the script validator itself. Also load when adding a language toggle, touching font stacks, or handling scraped source content."
user-invocable: true
disable-model-invocation: false
---

# Language Guard

Binding rules: [`docs/language_policy.md`](../../../docs/language_policy.md).
Governing principle: III in
[`.specify/memory/constitution.md`](../../../.specify/memory/constitution.md).

## The contract

Exactly three modes. No fourth, no "auto", no per-field mixing.

| Mode | Word/headword | Explanation | Script |
|---|---|---|---|
| `en` | Romanized | English | Latin only |
| `hi` | Devanagari | Hindi | Devanagari only |
| `hi-Latn` | Romanized | Hindi **language** | Latin only |

**Hinglish (`hi-Latn`) is Hindi written in Latin script** — Hindi vocabulary,
Hindi grammar, Latin letters. It is not English, and not a 50/50 mix. Natural
English loanwords a Hindi speaker actually says (`matlab`, `simple`, `feeling`)
are fine; rewriting the sentence into English is a violation.

## The prohibition

**Arabic and Urdu script must never reach a user.** Headwords, lyric lines,
glosses, summaries, chatbot replies, quoted source excerpts, metadata, page
titles, share cards, alt text, error messages — all of it.

Blocked ranges:

```
U+0600–U+06FF  Arabic
U+0750–U+077F  Arabic Supplement
U+0870–U+089F  Arabic Extended-B
U+08A0–U+08FF  Arabic Extended-A
U+FB50–U+FDFF  Arabic Presentation Forms-A
U+FE70–U+FEFF  Arabic Presentation Forms-B
```

Devanagari, for the checks below: `U+0900–U+097F`, `U+A8E0–U+A8FF`.

**Ingest is allowed; emit is not.** Source documents scraped from the web will
routinely contain Urdu script — these are qawwali and ghazal songs. Store them in
their original script for provenance. The rendering boundary is where it stops.

Loanwords render in the mode's own script, never their original one:

| Word | `en` | `hi` | `hi-Latn` |
|---|---|---|---|
| fana | `Fana` | `फ़ना` | `Fana` |
| ishq | `Ishq` | `इश्क़` | `Ishq` |
| rabb | `Rabb` | `रब्ब` | `Rabb` |

Etymology may be *described* ("an Arabic-origin word meaning…"). The Arabic
spelling is never shown.

## What to do

### Writing a generation prompt
State the mode's target language and its script constraint explicitly in the
prompt. Never rely on the model inferring it from the input language — input will
often be Urdu-script source text, and the model will mirror it.

### Writing rendering code
Everything user-facing passes the validator before it is stored or returned. Not
"usually" — every path, including error messages, cached reads, and streamed
chunks.

### Writing the validator
It must reject:
1. any blocked-range codepoint, in **every** mode;
2. Devanagari in `en` or `hi-Latn` payloads;
3. an `hi` payload whose explanation body is predominantly Latin.

On failure: regenerate once, then surface an error. **Never serve it, never
write it to the cache.** A poisoned cache entry outlives the bug that made it.

### Storage
One mode-independent meaning with its source links; renderings cached per
`(entity_id, mode)`. Staleness invalidates **all three renderings together** —
they must never drift apart. A missing rendering is generated from the stored
meaning and does **not** trigger fresh research or consume quota.

### Fonts
Latin and Devanagari both need designed faces (see
[`docs/design_system.md`](../../../docs/design_system.md)). Subset to Latin +
Devanagari only — **do not ship Arabic glyph coverage**. It can never legitimately
render, and shipping it invites a silent leak.

## Before saying it works

- [ ] Validator rejects each blocked range — test, run, output quoted
- [ ] A fixture source document containing real Urdu script is **stored** but
      never **emitted**
- [ ] Real qawwali vocabulary used in fixtures, not `foo`/`bar`
- [ ] Devanagari rejected in `en` and `hi-Latn`
- [ ] Mode switch consumes no quota and triggers no research
- [ ] Failed payloads never reach the cache
- [ ] Devanagari line-height +0.1 — matras are not clipped

Per Principle II: do not report any of these as passing unless you ran it and
saw the output this session.
