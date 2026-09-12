# Wireframe Prompt — LyricSense

**How to use this file:** paste everything below the line into Claude Design with
the **Wireframe** template selected. This is a *structure* brief — it deliberately
strips out colour, typography and finish so that layout, hierarchy and flow can be
judged on their own.

For the full visual design, use [`design_prompt.md`](design_prompt.md) with the
**UI mockups** template instead. Do not paste both into the same round.

**When wireframes are worth doing:** if the song page layout in the UI mockups
feels wrong, or the desktop → mobile transition isn't obvious. Wireframing the
whole product before mocking it up is the textbook order, but you already have a
settled design system, so it's optional — use it to solve the hard layout
problems, not to redraw everything.

---

## The brief

Wireframe the structure of **LyricSense**, a web app that explains what songs
actually mean — word by word, line by line, and as a whole.

**Greyscale only. No colour, no real typography, no imagery, no styling.** Boxes,
labels, placeholder text, and hierarchy. The point of this round is to settle
*what goes where and what happens next* before any visual decisions are made.

### What the product does

A user pastes a song name, a URL, or anything they remember. The app returns the
song's meaning, built from real sources it has retrieved — not invented. When it
lacks sources, it says so instead of guessing. Songs are largely Hindi, filmi,
qawwali, sufi and ghazal, where the same word can mean different things in
different songs.

### The two structural problems to solve

Everything else is routine. These two are why this wireframe round exists:

1. **Lyric + meaning side by side on desktop, and what that becomes on mobile.**
   The user must be able to read the lyric and its explanation without losing
   either. On a phone there is no room for both.
2. **Word-level interaction at readable text size.** Individual words inside a
   lyric line are tappable. Touch targets need ≥44px, but the words are set in
   running text. Solve this with padding and line spacing, not smaller type.

---

## Screens

Label every region. Use placeholder text of realistic length — explanations run
to full paragraphs, and a wireframe with two-word placeholders will lie to you
about how much room things need.

### 1. Landing
One primary input. One clear statement of the promise: it doesn't make things up.
Pricing summary lower down. Show the empty state, before anything is typed.

### 2. Search results / disambiguation
The user typed something vague. A list of candidate songs — title, artist, year,
thumbnail slot — plus a "none of these" path.

### 3. Song page — desktop (≥1100px) · THE CORE SCREEN

Three zones:

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: title · artist · year        [language switch] [⚙]  │
├───────────────────────────┬──────────────────────────────────┤
│  LYRIC COLUMN             │  MEANING PANEL                   │
│  the song's lines         │  explanation of the active line  │
│  one line is "active"     │  word-by-word glosses            │
│  words are clickable      │  source list beneath             │
│  scrolls independently    │                                  │
│                           │  ── sticky at bottom ──          │
│                           │  [ Ask about this song ]  (gated)│
├───────────────────────────┴──────────────────────────────────┤
│  SONG SUMMARY: what the whole song means                     │
└──────────────────────────────────────────────────────────────┘
```

Show the active-line treatment, a selected word, and the relationship between the
two columns. Indicate which regions scroll independently.

### 4. Song page — mobile
The meaning panel becomes a bottom sheet, opening on tap of a lyric line and
dismissible by swipe. Wireframe **three states**: sheet closed, sheet at half
height, sheet expanded. Show how much lyric stays visible in each — that's the
whole question.

### 5. Word selected
What happens when a single word is tapped. The gloss opens in the meaning panel
or sheet — **not a tooltip**, because these are paragraphs and tooltips can't be
read on touch. Show the word's selected state in the lyric and the resulting
panel content together.

### 6. Sources region
Beneath every explanation: a list of the sources it was built from — favicon
slot, domain, type label (`blog`, `forum`, `lyrics`, `interview`), and a count.
Show it both collapsed and expanded into an excerpt.

### 7. Empty state — not enough material
When no sources are found, the app says so rather than answering:

> **We don't have enough grounded material on this song yet.**
> `[ Contribute a source ]`

Wireframe it as a designed moment inside the meaning panel, not a generic error
block.

### 8. Loading / research in progress
Research takes real time. Show the waiting structure: progressive step text
("Finding sources…", "Reading 6 sources…", "Writing the explanation…") and which
parts of the page are populated versus pending.

### 9. Chatbot panel (gated feature)
A panel docked to the meaning column, aware of the open song. **It must not cover
the lyric column** — show how it coexists. Wireframe the locked state too: the
feature visible but gated with an upgrade affordance.

### 10. Pricing
Two plans side by side. Free: 5 new songs a month, all three languages, 20 saved
items. Paid: unlimited research, the chatbot, unlimited library, export.

### 11. Quota indicator + limit reached
A thin header meter: `3 of 5 new songs left this month`. Plus the prompt shown at
the moment the limit is hit, naming what the user was trying to do.

### 12. Personal library
Saved songs and saved words as two views. Words are the harder case — the same
word carries different meanings in different songs, so each saved word must show
its song context attached.

### 13. Contribute
Paste a URL or upload an image of something that explains a song well. Show the
"this gets reviewed before it's used" state.

---

## The language switch — structural, not cosmetic

The app has exactly three output modes: **English**, **Hindi** (Devanagari
script), and **Hinglish** (Hindi language in Latin letters). A segmented control
in the header, always visible.

Wireframe implications:

- Switching mode must **not** change the layout. Same structure, different text.
- Devanagari runs taller than Latin. Show the lyric column with placeholder lines
  at **both** heights so the layout is proven to absorb the difference rather
  than break.
- Scroll position is preserved across a switch.
- Switching is instant — it never triggers a loading state, because all three
  renderings are already cached.

---

## Flow diagram

Alongside the screens, include one flow showing the paths between them:

```
Landing → search → [song already explained?]
                      ├─ yes → Song page (instant)
                      └─ no  → [quota available?]
                                  ├─ no  → Upgrade prompt
                                  └─ yes → Research (loading)
                                              ├─ sources found → Song page
                                              └─ none found    → Empty state → Contribute
```

---

## Deliverable

One canvas. Greyscale wireframes in the order above, with the song page shown at
both desktop and mobile. Annotate the regions — what scrolls, what's sticky,
what's tappable, what's gated.

The song page (screens 3, 4 and 5 together) is the one that matters. If the rest
is rough but those three are right, this round succeeded.
