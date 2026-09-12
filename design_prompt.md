# Design Prompt — LyricSense

**How to use this file:** paste everything below the line into Claude Design (or
any design tool). It is written to stand alone — the tool will not have access to
this repository, so every constraint it needs is restated here.

Source of truth if the two ever disagree: [`docs/design_system.md`](docs/design_system.md).

---

## The brief

Design the UI for **LyricSense**, a web app that explains what songs actually
mean — word by word, line by line, and as a whole.

### The problem it solves

When someone hears a song they love and wants to know what it means, they
currently hunt across Google, YouTube, Reddit, Quora, lyrics sites and blogs, and
stitch it together themselves. If they ask a chatbot instead, it confidently
invents a meaning that has nothing to do with the song.

LyricSense is one place, and it does not invent. Every explanation is built from
real sources it has retrieved and stored, and it shows those sources. When it
doesn't have enough material, it says so rather than guessing.

The songs are largely Hindi, Urdu-influenced filmi, qawwali, sufi and ghazal
music — words carry devotional and poetic weight, and the same word can mean
different things in different songs.

### Who it's for

People who love a song and want to feel it more completely — not scholars. The
tone is warm and plainspoken, never academic.

---

## Visual direction

**Dark, cinematic, music-first.** The reference feeling is a darkened room with
the song playing. Not a dashboard, not a dictionary, not a SaaS product.

The UI is quiet so the lyric is the loudest thing on screen. One gold accent,
used sparingly enough that when it appears, it means something.

Avoid: neon gradients, glassmorphism, busy cards, stock "AI" imagery, purple-blue
tech palettes, floating 3D blobs.

---

## Design tokens — use these exactly

### Colour

```
Base
--bg-base         #0A0908   page canvas (warm near-black, NOT blue-black)
--bg-surface      #141211   cards, panels
--bg-elevated     #1C1917   modals, popovers, chatbot
--bg-inset        #070606   wells, input interiors
--border-subtle   #221F1C   hairlines
--border-default  #2E2A26   card edges, inputs
--border-strong   #433D37   focus rings, active edges

Text
--text-primary    #F5F1EA   lyrics, headings
--text-secondary  #B5AFA6   explanation body
--text-muted      #7A746C   metadata, captions
--text-faint      #4E4942   decorative only, never readable text

Accent (gold) — the only brand hue
--accent          #D9A441   primary actions, active state, links
--accent-hover    #E8B858
--accent-press    #C08F33
--accent-wash     rgba(217,164,65,0.10)   selected word background
--accent-edge     rgba(217,164,65,0.28)   borders on accented surfaces

State
--grounded        #7FA87C   source-backed content
--stale           #C9993F   marked for regeneration
--ungrounded      #C2705A   "not enough material" state
--info            #6E93B5
```

Gold is never a large fill — it is an edge, a small mark, a compact solid button.

### Type

| Role | Latin | Devanagari |
|---|---|---|
| Lyrics + explanation | **Newsreader** | **Tiro Devanagari Hindi** |
| UI chrome | **Inter** | **Noto Sans Devanagari** |
| Numerals | **JetBrains Mono** | — |

```
display     44 / 1.15    song title
lyric       28 / 1.55    the active lyric line
lyric-sm    21 / 1.6     lyric lines in the scroll column
lg          18 / 1.65    lead paragraph, summary
body        16 / 1.7     explanation text
sm          14 / 1.6     metadata, source labels
xs          12.5 / 1.5   badges, captions
```

Reading measure 62–70 characters. Devanagari gets +0.1 line-height (matras clip
otherwise). Never italicise Devanagari.

### Space, radius, motion

Space on a 4px base: `4 8 12 16 24 32 48 64 96`.
Radius: `6` inputs/badges · `10` cards/buttons · `16` panels/modals · `full` pills.
Motion: 120ms hover · 200ms panels · 420ms page reveal. Ease-out. Nothing bounces.

In a dark UI, elevate by **lightening the surface plus a hairline border**, not
by shadow. Shadow only on truly floating layers.

---

## The three-language rule — affects layout, not just copy

The user picks one of exactly three modes and the whole page follows:

| Mode | Word shown as | Meaning written in | Script |
|---|---|---|---|
| **English** | `Kun Faya Kun` | English | Latin |
| **Hindi** | `कुन फ़या कुन` | Hindi | Devanagari |
| **Hinglish** | `Kun Faya Kun` | Hindi language | Latin |

Example of the same explanation in all three:

- **English** — "Be, and it is" — expressing that God's command alone is enough to make something happen.
- **Hindi** — "हो जा, तो वह हो जाता है" — यानी ईश्वर की इच्छा मात्र से सब कुछ संभव है।
- **Hinglish** — "Ho ja, aur woh ho jaata hai", yani Khuda ki sirf ek ichha se sab kuch mumkin ho jaata hai.

**Hard constraint: no Arabic or Urdu script anywhere in any mockup.** Not in
headwords, not in decorative text, not in sample source quotes. These songs are
full of Arabic-origin words, but they are always rendered as `Fana` / `फ़ना`,
never `فنا`.

Design implications:

- The language switch is a segmented control, always visible, top-right.
- Devanagari must look **designed, not fallback** — show the Hindi mockup with
  real Devanagari text in Tiro Devanagari Hindi, at equal visual weight to the
  Latin version. If Hindi mode looks worse than English mode, the design fails.
- Switching modes must not reflow the page into a different layout.

---

## Screens to design

### 1. Landing page
One input, one promise. Paste a song name, a URL, or anything you remember about
it. State the differentiator plainly: *it doesn't make things up*. Show Basic and
Pro pricing lower down.

### 2. Search / disambiguation
The user typed something vague. Show candidate songs — title, artist, year, album
art — and a path for "none of these".

### 3. Song page (the core screen — design this most carefully)

Desktop ≥1100px, three zones:

```
┌──────────────────────────────────────────────────────────────┐
│  Song title · artist · year            [EN|हिं|Hinglish] [⚙] │
├───────────────────────────┬──────────────────────────────────┤
│   LYRIC COLUMN            │   MEANING PANEL                  │
│   serif, large            │   the active line, explained     │
│   active line: gold edge  │   word chips with glosses        │
│   + lifted surface        │   source strip beneath           │
│   words are clickable     │                                  │
│   scrolls                 │   ── sticky ──                   │
│                           │   [ Ask about this song ]  PRO   │
├───────────────────────────┴──────────────────────────────────┤
│  SONG SUMMARY — what the whole song means, wide measure      │
└──────────────────────────────────────────────────────────────┘
```

Clickable words carry a dotted underline at rest, `--accent-wash` on hover. A
word's meaning opens in the meaning panel — **not a tooltip**, because these are
paragraphs and tooltips can't be read on touch.

### 4. Song page — mobile
The meaning panel becomes a bottom sheet, opening on tap of a lyric line,
dismissible by swipe. Individual words still need ≥44px touch targets — solve
this with padding, not smaller text.

### 5. Grounding UI — the signature element
This is what separates the product from asking a chatbot, so give it real design
weight:

- **Source strip** under every explanation — small chips with favicon, domain,
  and a one-word type label (`blog`, `forum`, `lyrics`, `interview`). Clicking
  one opens the excerpt that was actually used.
- **Grounded mark** — a small `--grounded` dot with a count: `● 6 sources`.
- **Stale mark** — `--stale` dot reading "updating", with the old explanation
  still readable underneath.

### 6. The "not enough material" state
Design this as a moment, not an error:

> **We don't have enough grounded material on this song yet.**
> We'd rather say nothing than make something up.
> `[ Contribute a source ]`

Use `--ungrounded`, which is deliberately muted rather than alarm-red. This
screen is the visible proof of the product's promise.

### 7. Research-in-progress
Research genuinely takes time. Design an honest waiting state: a slow gold
shimmer along the lyric column with real step text — "Finding sources…",
"Reading 6 sources…", "Writing the explanation…". No generic spinner.

### 8. In-context chatbot (Pro)
A panel docked to the meaning column, aware of the song currently open. Must not
cover the lyric. Show the Basic-user state too: visible but gated, with a gold
`PRO` pill.

### 9. Pricing / upgrade
Basic (free) vs Pro. Basic: 5 new songs a month, all three languages, 20 saved
items. Pro: unlimited research, the chatbot, unlimited library, PDF and share-card
export. Informative, not pushy.

### 10. Quota + upgrade prompt
A thin header meter: `3 of 5 new songs left this month`. Neutral until 1
remaining, then `--stale` — never red, since running out of a free allowance is
not an error. Plus the in-context upgrade prompt at the moment of the limit.

### 11. Personal library
Saved songs and saved words, as two views. Words are the more interesting case —
the same word can carry different meanings across songs, so show the word with
its song context attached.

### 12. Contribute knowledge
Paste a URL or upload an image of something that explains a song well. Make clear
it's reviewed before being folded in, and that it's free on both plans.

### 13. Share card
A social-shareable image of one lyric line and its meaning. Must work in all
three language modes.

---

## Accessibility requirements

- Body text ≥4.5:1 contrast, large text ≥3:1. The tokens above are chosen to pass.
- Visible focus everywhere: 2px `--accent` ring, 2px offset.
- Colour never carries meaning alone — every state dot is paired with text.
- Touch targets ≥44×44px, including individual clickable words.

---

## Deliverable

One canvas, artboards laid out in the order above, desktop and mobile for the
song page. Dark theme only — there is no light theme in v1.

Show the song page **three times, once per language mode**, so the Devanagari
rendering can be judged against the Latin one directly. That comparison is the
single most important thing this design has to get right.
