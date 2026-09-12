# LyricSense Design System

**Direction:** dark, cinematic, music-first. A near-black warm canvas, a single
gold accent, lyrics set large in a serif, and a UI quiet enough that the words of
the song are the loudest thing on screen.

The reference feeling is a darkened room with the song playing — not a dashboard,
not a dictionary. The product's competition is a scattered mess of Google, Reddit
and lyrics sites; the design's job is to feel like the opposite of that: one
calm, considered place.

---

## 1. Principles

1. **The lyric is the hero.** Nothing on screen may out-weigh the line being
   explained — not navigation, not the upgrade prompt, not the chatbot.
2. **Grounding is visible.** The product's entire claim is that it doesn't make
   things up. Sources are shown as a designed element, never hidden behind a
   tooltip. See §7.
3. **Quiet chrome.** Controls recede until reached for. One accent colour, used
   sparingly, so that when gold appears it means something.
4. **Readable at length.** People read long explanations here. Generous line
   height, constrained measure, real typographic hierarchy.
5. **Three languages, one layout.** Devanagari is a first-class citizen, not a
   font fallback. Switching modes must not reflow the page into a different
   design.

---

## 2. Colour tokens

Warm near-black, not blue-black — blue-black reads corporate, warm reads like a
room with a lamp on.

### Base

| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#0A0908` | Page canvas |
| `--bg-surface` | `#141211` | Cards, panels |
| `--bg-elevated` | `#1C1917` | Modals, popovers, chatbot |
| `--bg-inset` | `#070606` | Wells, code, input interiors |
| `--border-subtle` | `#221F1C` | Hairlines, dividers |
| `--border-default` | `#2E2A26` | Card edges, inputs |
| `--border-strong` | `#433D37` | Focus rings, active edges |

### Text

| Token | Value | Contrast on base | Use |
|---|---|---|---|
| `--text-primary` | `#F5F1EA` | 17.8:1 | Lyrics, headings |
| `--text-secondary` | `#B5AFA6` | 9.1:1 | Explanations, body |
| `--text-muted` | `#7A746C` | 4.6:1 | Metadata, captions |
| `--text-faint` | `#4E4942` | 2.4:1 | Decorative only — never for text that must be read |

### Accent — gold

| Token | Value | Use |
|---|---|---|
| `--accent` | `#D9A441` | Primary actions, active state, links |
| `--accent-hover` | `#E8B858` | Hover |
| `--accent-press` | `#C08F33` | Active/pressed |
| `--accent-wash` | `rgba(217,164,65,0.10)` | Selected word background, tinted panels |
| `--accent-edge` | `rgba(217,164,65,0.28)` | Borders on accented surfaces |

`--accent` on `--bg-base` is 8.9:1 — safe for text, not only decoration.

### Semantic

| Token | Value | Use |
|---|---|---|
| `--grounded` | `#7FA87C` | Source-backed content, verified state |
| `--stale` | `#C9993F` | Explanation marked stale, pending regeneration |
| `--ungrounded` | `#C2705A` | "Not enough material" state, errors |
| `--info` | `#6E93B5` | Neutral notices |

`--ungrounded` is deliberately muted rather than alarm-red: the absence of
grounded material is an honest state, not a failure. It should read as candour,
not as something broken.

### Rules

- **One accent.** Do not introduce a second brand hue. Semantic colours are for
  state, never decoration.
- Never put `--text-muted` or fainter on `--bg-elevated` for anything the user
  must read.
- Gold is never used as a large fill. It is an edge, a mark, a small solid
  button — it is not a hero background.

---

## 3. Typography

Every family chosen must cover **Latin and Devanagari** with matching weight and
colour, or Hindi mode will look like a downgrade.

| Role | Latin | Devanagari | Notes |
|---|---|---|---|
| Lyrics / display | **Newsreader** | **Tiro Devanagari Hindi** | Both are reading-first serifs and sit at similar optical weight |
| Explanation body | **Newsreader** | **Tiro Devanagari Hindi** | Same family pair as lyrics, smaller and lighter |
| UI / chrome | **Inter** | **Noto Sans Devanagari** | Buttons, nav, labels, metadata |
| Numerals / code | **JetBrains Mono** | — | Quota counts, IDs, timestamps |

All are on Google Fonts. Declare a real fallback stack; never let Devanagari
land on a system default while Latin gets the designed face.

### Scale

| Token | Size / line-height | Use |
|---|---|---|
| `--text-display` | 44 / 1.15 | Song title |
| `--text-lyric` | 28 / 1.55 | The lyric line being explained |
| `--text-lyric-sm` | 21 / 1.6 | Lyric lines in the scroll column |
| `--text-lg` | 18 / 1.65 | Lead paragraph, summary |
| `--text-body` | 16 / 1.7 | Explanation text |
| `--text-sm` | 14 / 1.6 | Metadata, source labels |
| `--text-xs` | 12.5 / 1.5 | Captions, badges |

- Reading measure: **62–70 characters**. Explanations never run full-bleed.
- Devanagari needs more vertical room — add **0.1 to the line-height** of any
  token rendering Devanagari. Matras clip otherwise, and clipped matras look
  like a bug to a Hindi reader.
- Hindi text is not italicised. Devanagari has no true italic; synthesised
  obliques look broken. Use weight or colour for emphasis instead.

---

## 4. Space, radius, elevation

**Space** — 4px base: `4, 8, 12, 16, 24, 32, 48, 64, 96`. Nothing between steps.

**Radius** — `sm 6` (inputs, badges) · `md 10` (cards, buttons) · `lg 16`
(panels, modals) · `full` (pills, avatars).

**Elevation** — in a dark UI, light does the lifting, not shadow. Raise a surface
by lightening it and adding a hairline border. Shadow is used only for genuinely
floating layers (modal, popover), and stays soft and near-black:
`0 16px 48px rgba(0,0,0,0.6)`.

---

## 5. Motion

Calm and quick. Nothing bounces.

| Token | Duration | Easing | Use |
|---|---|---|---|
| `--motion-fast` | 120ms | `ease-out` | Hover, focus, colour |
| `--motion-base` | 200ms | `cubic-bezier(.2,.8,.2,1)` | Panels, popovers, mode switch |
| `--motion-slow` | 420ms | `cubic-bezier(.2,.8,.2,1)` | Page-level reveal |

Research takes real time. That wait gets a designed state — a slow gold shimmer
along the lyric column with honest step text ("Finding sources…", "Reading 6
sources…", "Writing the explanation…") — not a spinner. Users tolerate waiting
when they can see it working.

Respect `prefers-reduced-motion`: cut the shimmer, keep the step text.

---

## 6. Core layout — the song page

Three zones on desktop (≥1100px):

```
┌──────────────────────────────────────────────────────────────┐
│  Song title · artist · year            [EN|हिं|Hinglish] [⚙] │
├───────────────────────────┬──────────────────────────────────┤
│                           │                                  │
│   LYRIC COLUMN            │   MEANING PANEL                  │
│   serif, large            │   the active line, explained     │
│   active line: gold edge  │   word chips with glosses        │
│   + lifted surface        │   source strip beneath           │
│   words are clickable     │                                  │
│   ─────────────────────   │   ── sticky ──                   │
│   scrolls                 │   [ Ask about this song ]  PRO   │
│                           │                                  │
├───────────────────────────┴──────────────────────────────────┤
│  SONG SUMMARY — what the whole song means, wide measure      │
└──────────────────────────────────────────────────────────────┘
```

- Below 1100px the meaning panel becomes a bottom sheet, opening on tap of a
  line and dismissible by swipe.
- The language switch is a segmented control, always visible, top-right. It
  **never** re-triggers research or consumes quota — and the UI should make that
  obvious, switching instantly from cached renderings.
- The lyric column keeps scroll position across a mode switch.

---

## 7. Grounding UI — the signature element

This is what separates LyricSense from asking a chatbot, so it gets real design
weight rather than a footnote.

**Source strip** — sits directly beneath every explanation. A row of small
source chips: favicon, domain, and a one-word type label (`blog`, `forum`,
`lyrics`, `interview`). Clicking opens the excerpt that was actually used.

**Grounded mark** — a small `--grounded` dot with a source count
(`● 6 sources`) at the top of any explanation. Quiet, always present.

**Ungrounded state** — when retrieval finds nothing usable, the panel shows an
honest empty state in `--ungrounded`, not an answer:

> **We don't have enough grounded material on this song yet.**
> We'd rather say nothing than make something up.
> `[ Contribute a source ]`

This screen is a feature. It is the visible proof of the product's promise, and
it is the natural entry point to feature G — design it as a moment, not as an
error.

**Stale mark** — a `--stale` dot with "updating" on explanations queued for
regeneration. The old explanation stays readable while it regenerates.

---

## 8. Word interaction

- Clickable words carry a 1px dotted `--border-strong` underline at rest — an
  invitation, not a link.
- Hover lifts to `--accent-wash`; active is a solid `--accent-wash` with an
  `--accent-edge` border.
- The gloss opens in the meaning panel, not a tooltip — these explanations are
  paragraphs, and tooltips can't hold them or be read on touch.
- The same word appearing twice in one song can carry two different meanings
  (objective.md, feature D). Each occurrence is independently selectable, and
  when they differ the panel says so explicitly.

---

## 9. Plan and quota UI

Tone matters here: informative, never nagging.

- **Quota meter** — a thin bar in the header: `3 of 5 new songs left this month`.
  Neutral until 1 remaining, then `--stale`. Never red; running out of free quota
  is not an error.
- **Pro badges** — a small gold-outline `PRO` pill on gated features. The feature
  is shown, not hidden, so the user knows what they'd get.
- **Upgrade prompts** appear at the moment of the limit, stating what was being
  attempted. One prompt per session. No interstitials, no dismissible banners
  that come back.
- **Never gate a cached song.** Reading an already-explained song is free and
  unlimited; the paywall sits only on new research.

---

## 10. Accessibility

- Body text meets WCAG AA (4.5:1); large text 3:1. Tokens in §2 are chosen to
  pass — don't compose new pairs without checking.
- Focus is always visible: 2px `--accent` ring, 2px offset. Never remove outlines
  without a replacement.
- Colour never carries meaning alone — grounded/stale/ungrounded each pair the
  dot with text.
- Full keyboard path: lyric lines are a navigable list; a word gloss is reachable
  and dismissible with Escape.
- Set `lang="hi"` on Devanagari content so screen readers switch voice. Hinglish
  stays `lang="hi-Latn"`.
- Targets ≥44×44px on touch — including individual clickable words, which is the
  hardest case on this page and must be handled with padding, not smaller text.

---

## 11. Implementation notes

- Tokens as CSS custom properties on `:root`, consumed via Tailwind theme
  extension. No raw hex in components.
- **Dark is the only theme in v1.** Design tokens are structured so a light
  theme could be added later, but do not build one now — one well-made theme
  beats two mediocre ones.
- Self-host fonts or preload them with `font-display: swap`. A Devanagari
  webfont arriving late causes a visible reflow of the whole lyric column.
- Subset fonts to Latin + Devanagari. Do not ship Arabic glyph coverage — per
  [`language_policy.md`](language_policy.md) it can never be rendered, and
  shipping it invites a leak.
