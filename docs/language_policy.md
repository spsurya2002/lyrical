# Language Policy

Binding. Referenced by Principle III of the
[constitution](../.specify/memory/constitution.md).

LyricSense supports **exactly three** output modes. There is no fourth, no
"auto", and no per-field mixing beyond what this document specifies.

---

## 1. The three modes

The user picks one mode. It applies to the entire screen at once — headwords,
line glosses, the song summary, chatbot replies, and UI chrome all switch
together. There is no state in which two modes are visible.

| Mode | Lyric / headword rendering | Explanation language | Script used | Example headword | Example gloss |
|---|---|---|---|---|---|
| **English** | Romanized | English | Latin only | `Kun Faya Kun` | "Be, and it is" — the idea that God's command alone is enough to make something happen. |
| **Hindi** | Devanagari | Hindi | Devanagari only | `कुन फ़या कुन` | "हो जा, तो वह हो जाता है" — यानी ईश्वर की इच्छा मात्र से सब कुछ संभव है। |
| **Hinglish** | Romanized | Hindi language | Latin only | `Kun Faya Kun` | "Ho ja, aur woh ho jaata hai" — yani Khuda ki sirf ek ichha se sab kuch mumkin ho jaata hai. |

### What "Hinglish" means here, precisely

Hinglish is **the Hindi language written in Latin script**. It is not English,
and it is not a mix of the two languages.

- Vocabulary, grammar, and sentence structure: Hindi.
- Script: Latin, always. No Devanagari character may appear in Hinglish output.
- English loanwords that a Hindi speaker uses naturally in speech are fine
  (`matlab`, `simple`, `feeling`). Rewriting the sentence into English is not.

> **Owner check needed.** Your note read *"if select hinglish meaning will be in
> hindi but word will be in english."* The table above implements that as: the
> word is Latin-script, and the meaning is Hindi-language also written in Latin
> script — which is what the Hinglish reply in your screenshot does. If you
> instead meant the meaning should appear in Devanagari while the headword is
> Latin, say so and this table changes in one place.

---

## 2. Absolute script prohibition

**Arabic and Urdu script must never reach a user.** This holds for every surface:
headwords, lyric lines, glosses, summaries, chatbot output, search results,
quoted source snippets, metadata, page titles, and share cards.

Blocked Unicode ranges:

| Block | Range |
|---|---|
| Arabic | `U+0600`–`U+06FF` |
| Arabic Supplement | `U+0750`–`U+077F` |
| Arabic Extended-B | `U+0870`–`U+089F` |
| Arabic Extended-A | `U+08A0`–`U+08FF` |
| Arabic Presentation Forms-A | `U+FB50`–`U+FDFF` |
| Arabic Presentation Forms-B | `U+FE70`–`U+FEFF` |

This matters because the songs this product explains — qawwali, sufi, ghazal,
filmi — carry heavy Arabic and Persian vocabulary. Sources scraped from the web
will contain Urdu script constantly. **Ingesting it is allowed; emitting it is
not.** Source documents may be stored in their original script for provenance;
the rendering boundary is where it stops.

### Handling loanwords

An Arabic- or Persian-origin word that lives in the song is rendered in the
mode's own script, never its original one:

| Word | English mode | Hindi mode | Hinglish mode |
|---|---|---|---|
| فنا | `Fana` | `फ़ना` | `Fana` |
| عشق | `Ishq` | `इश्क़` | `Ishq` |
| رब | `Rabb` | `रब्ब` | `Rabb` |

The etymology may be *described* ("an Arabic-origin word meaning…"). The Arabic
spelling is never shown.

---

## 3. Enforcement

Policy that is only written down gets violated. It is enforced in three places:

1. **Generation** — the prompt for each mode states the script constraint and
   the mode's target language explicitly.
2. **Validation boundary** — every generated payload passes a script validator
   before it is stored or returned. The validator:
   - rejects any blocked-range codepoint in any mode;
   - rejects Devanagari (`U+0900`–`U+097F`, `U+A8E0`–`U+A8FF`) in English and
     Hinglish payloads;
   - rejects a Hindi payload whose explanation body is predominantly Latin.
   A failed payload is regenerated once, then surfaced as an error. It is never
   served, and never written to the cache.
3. **Tests** — the validator has fixture tests using real qawwali vocabulary,
   including at least one source document that legitimately contains Urdu
   script, asserting that it is stored but never emitted.

---

## 4. Storage model

Three modes are three renderings of one meaning, not three unrelated records.

- A word's or song's **meaning** is stored once, mode-independent, with its
  source links.
- Each **rendering** is cached per mode and keyed `(entity_id, mode)`.
- Marking a song stale (objective.md, features C + G) invalidates **all three**
  renderings together. They must never drift apart.
- A missing rendering for one mode is generated on demand from the stored
  meaning; it does not trigger fresh research.

---

## 5. UI requirements

- The mode switch is reachable from any song page without losing scroll position.
- The chosen mode persists per user account, and for signed-out visitors in
  local storage.
- Default for a new visitor: **English**.
- Switching mode must not re-trigger research or consume a Basic-plan quota unit
  — it is a rendering change, not a new explanation.
- Hindi mode needs a Devanagari-capable font stack with a real fallback; see
  [`design_system.md`](design_system.md).
