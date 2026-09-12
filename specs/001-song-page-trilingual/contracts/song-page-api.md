# Contract — Song Page API

**Feature**: 001-song-page-trilingual

Three endpoints. Everything the page needs, and nothing that belongs to another
feature.

---

## `GET /api/songs/:slug`

The whole page in one request.

**Query**

| Param | Values | Default |
|---|---|---|
| `mode` | `en` \| `hi` \| `hi-Latn` | `en` |

**Auth**: optional (R-09). Signed-out visitors get the full page; the quota and
chatbot fields come back as `null`.

**200 response**

```jsonc
{
  "song": {
    "slug": "kun-faya-kun",
    "title": "Kun Faya Kun",          // in the mode's script
    "artist": "A.R. Rahman",
    "year": 2011,
    "film": "Rockstar"
  },
  "mode": "en",
  "coverage": {                        // FR-026
    "linesExplained": 4,
    "linesTotal": 26
  },
  "activeLineNo": 3,                   // first SERVABLE line, not line 1
  "lines": [
    {
      "lineNo": 3,
      "text": "Kun faya kun",
      "meaning": {                     // null when not servable
        "text": "A phrase carried into filmi verse from scripture: be, and it is…",
        "sourceCount": 4,
        "status": "active",            // "active" | "stale"
        "words": [                     // occurrences that HAVE a servable meaning
          { "occurrenceId": "…", "position": 0, "text": "Kun" }
        ]
      },
      "ungrounded": null
    },
    {
      "lineNo": 4,
      "text": "Maula maula",
      "meaning": null,
      "ungrounded": {                  // FR-023, FR-037
        "reason": "below_bar",         // "below_bar" | "no_material" | "mode_unavailable"
        "sourceCount": 2,
        "sourcesRequired": 4,
        "sources": [ /* the ones that DO exist */ ]
      }
    }
  ],
  "summary": { /* same shape as a line meaning, or null */ },
  "summaryUngrounded": null,
  "viewer": {
    "plan": "basic",                   // null when signed out
    "quota": { "remaining": 3, "limit": 5 },
    "chatbotAvailable": false
  }
}
```

**Rules this response encodes**

- `meaning` and `ungrounded` are **mutually exclusive** — exactly one is non-null
  on every line. There is no third state and no partial meaning (FR-025).
- A line below the bar returns `ungrounded`, never a hedged `meaning` (FR-005,
  FR-036).
- `words` lists only occurrences with a servable meaning. Anything absent is not
  rendered as selectable (FR-020).
- `activeLineNo` is the first **servable** line so the user lands on a real
  explanation, not an empty panel.
- `reason: "mode_unavailable"` is R-02: the meaning exists but this language
  rendering does not yet. Backfill is enqueued; the response does not block.

**Errors**: `404` unknown slug · `400` invalid mode.

---

## `GET /api/songs/:slug/words/:occurrenceId`

One word's meaning, fetched on selection (R-03).

**Query**: `mode`, as above.

**200**

```jsonc
{
  "occurrenceId": "…",
  "surface": "Fana",
  "lineNo": 12,
  "meaning": {
    "text": "Annihilation of the self — relief, not loss…",
    "sourceCount": 4,
    "sources": [ /* … */ ]
  },
  "otherOccurrences": [                // FR-019
    { "occurrenceId": "…", "lineNo": 18, "differs": true }
  ]
}
```

`differs` is `true` when that occurrence resolves to a **different** `meaning_id`.
This is what lets the page say the two uses are not the same without claiming a
difference that isn't there.

**Errors**: `404` unknown occurrence, or occurrence has no servable meaning.

---

## `GET /api/meanings/:meaningId/sources`

The source list behind one explanation, opened from the source strip (FR-004).

**200**

```jsonc
{
  "sources": [
    {
      "domain": "sufipoetry.blog",
      "url": "https://…",
      "type": "blog",
      "excerpt": "…the passage actually used…",
      "retrievedAt": "2026-08-14T09:22:00Z",
      "reachable": true
    }
  ]
}
```

`reachable: false` still appears, marked — a rotted link does not unground an
explanation.

---

## Cross-cutting rules

**Script validation (R-07)** — every response passes the validator immediately
before serialisation. A failing entity is replaced by its ungrounded state and
logged at error level with its id. One bad line never fails the whole page, and a
validator failure is never swallowed.

**Caching** — responses cached in Redis keyed `song:{slug}:{mode}:{viewerClass}`,
where `viewerClass` ∈ `anon | basic | pro`. Invalidated when any meaning for the
song changes status or gains a source. Mode switching therefore hits cache and
returns with no loading state (FR-014).

**Rate limiting** — read routes carry a generous per-IP limit. The rendering
backfill job (R-02) is the only model-calling path in this feature and is limited
separately, per Principle VI.

**Quota** — none of these endpoints consume quota. Ever. (FR-015, FR-028.)
There is a test asserting this.

**Entitlement** — `viewer` is populated from the single server-side
`getEntitlements(userId)`. `chatbotAvailable: false` is the authoritative answer;
the client hides the control as presentation only (FR-030).
