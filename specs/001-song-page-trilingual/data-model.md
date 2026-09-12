# Phase 1 — Data Model

**Feature**: 001-song-page-trilingual
**Date**: 2026-09-12

## In plain language first

Seven tables. The shape follows three ideas from the spec:

1. **A meaning is separate from the words used to express it.** One meaning,
   three renderings (English, Hindi, Hinglish). They are invalidated together, so
   they can never drift apart.
2. **A meaning belongs to a *place in a song*, not to a word.** `ishq` in one song
   and `ishq` in another are different records, because they mean different things.
3. **"Is this explained?" is never stored.** It is counted from the sources every
   time it is asked. A stored answer could go stale and quietly show an
   under-grounded explanation — the exact thing the constitution forbids.

---

## Tables

### `song`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique | URL identity, e.g. `kun-faya-kun` |
| `artist` | text | |
| `year` | int | |
| `film` | text null | |
| `created_at` | timestamptz | |

Titles live in `song_title` because they are script-dependent.

### `song_title`

| Column | Type | Notes |
|---|---|---|
| `song_id` | uuid FK → song | |
| `script` | enum `deva` \| `latn` | |
| `text` | text | |

PK `(song_id, script)`.

### `lyric_line`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `song_id` | uuid FK → song | |
| `line_no` | int | 1-based, ordered |

Unique `(song_id, line_no)`.

### `lyric_line_text`

| Column | Type | Notes |
|---|---|---|
| `line_id` | uuid FK → lyric_line | |
| `script` | enum `deva` \| `latn` | |
| `text` | text | |

PK `(line_id, script)`.

> **Why script and not mode** (R-01): English and Hinglish show the *same*
> romanized lyric. Three mode-keyed copies would mean two must be kept identical
> forever; the first drift shows different lyrics in two modes. Two script rows
> make that impossible.

### `word_occurrence`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `line_id` | uuid FK → lyric_line | |
| `position` | int | word index within the line, 0-based |
| `surface_latn` | text | as it appears romanized |
| `surface_deva` | text | as it appears in Devanagari |

Unique `(line_id, position)`.

> **This is the spec's hardest idea** (FR-018). A meaning attaches to an
> *occurrence* — this word, in this line, of this song — never to a spelling. Two
> occurrences of `fana` in one song can carry two meanings, and the page must be
> able to say they differ. That is a comparison of their `meaning_id`s.

### `meaning`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `target_type` | enum `song_summary` \| `line` \| `word_occurrence` | |
| `target_id` | uuid | polymorphic — song / lyric_line / word_occurrence |
| `status` | enum `active` \| `stale` | stale = queued for regeneration |
| `created_at` | timestamptz | |

Unique `(target_type, target_id)` where `status = 'active'`.

`stale` never hides the meaning — FR-007 requires the old text stays readable
while a replacement is produced.

### `meaning_rendering`

| Column | Type | Notes |
|---|---|---|
| `meaning_id` | uuid FK → meaning | |
| `mode` | enum `en` \| `hi` \| `hi-Latn` | |
| `text` | text | |
| `validated_at` | timestamptz null | last passed the script validator |

PK `(meaning_id, mode)`. Deleting a meaning cascades — three renderings die
together, never separately.

### `source`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `url` | text unique | |
| `domain` | text | shown on the source chip |
| `type` | enum `blog` \| `forum` \| `lyrics` \| `interview` \| `academic` \| `other` | |
| `excerpt` | text | stored at retrieval time |
| `retrieved_at` | timestamptz | |
| `reachable` | boolean | false = link rotted; source still counts and still shows |

> Excerpts are stored so a source that later goes offline can still be shown and
> attributed. A rotted link does **not** unground an explanation — it is marked
> unreachable and keeps counting.

### `meaning_source`

| Column | Type | Notes |
|---|---|---|
| `meaning_id` | uuid FK → meaning | |
| `source_id` | uuid FK → source | |

PK `(meaning_id, source_id)`. This join table is the constitution's Principle I in
physical form: **no rows here means nothing is served.**

---

## Derived values — computed, never stored

### `source_count`

```
count(meaning_source) per meaning_id
```

### `is_servable`

```
source_count >= config.GROUNDING_MIN_SOURCES     -- default 4 (D-003)
```

Applied when the page is assembled (R-04, R-05). Below-bar meanings stay stored so
FR-037 can disclose *"2 sources · we need 4"*, and so a contribution can push a song
over the bar with no regeneration.

### `coverage`

```
lines_explained = count(lines whose meaning is servable)
coverage        = lines_explained / total_lines
```

FR-026. Derived in the same query as `is_servable` so the two can never disagree
(R-06).

---

## Indexes

| Index | Purpose |
|---|---|
| `song(slug)` unique | page lookup |
| `lyric_line(song_id, line_no)` unique | ordered fetch |
| `lyric_line_text(line_id, script)` PK | lyric join |
| `word_occurrence(line_id, position)` unique | word lookup |
| `meaning(target_type, target_id)` | meaning lookup for a page |
| `meaning_source(meaning_id)` | **the grounding count — hot path** |
| `meaning_rendering(meaning_id, mode)` PK | rendering fetch |

The page is assembled in **two queries**: one for song + lines + text + meanings +
renderings + source counts, one for the source lists of servable meanings. Not
N+1 per line.

---

## Out of scope here

Written by the research pipeline and the subscription feature, read-only or absent
in this one: `user`, `user_quota`, `subscription`, `contribution`, `research_job`,
and the `embedding` / pgvector tables. This feature reads `user` and `user_quota`
for the meter and the chatbot gate; it writes neither.
