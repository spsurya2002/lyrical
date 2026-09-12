# Feature Specification: Song Page — Trilingual Explanation Viewer

**Feature Branch**: `001-song-page-trilingual`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Song page with three-language rendering — the core screen of LyricSense. A user opens a song that already has a stored explanation... Scope for this spec: viewing an already-explained song. Out of scope: the research pipeline that generates a new explanation, payment flows, and the library."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read what a song means, and see where that came from (Priority: P1)

Someone has just heard a song they love and wants to understand it. They open its
page and find the lyrics laid out, with the meaning of each line explained beside
them, and a summary at the end saying what the song is about as a whole. Beneath
every explanation they can see the sources it was built from — real pages someone
could go and read — so they can tell this was researched rather than invented.

**Why this priority**: This is the product. Everything else on the page is an
enhancement of it. It is also the entire differentiator: a user who cannot see
the sources has been given the same thing a chatbot would give them.

**Independent Test**: Open a song that already has a stored explanation in one
language, read a line meaning and the song summary, and confirm the sources for
each are listed and openable. Delivers the core value with no other story built.

**Acceptance Scenarios**:

1. **Given** a song with a stored explanation, **When** the user opens its page,
   **Then** the lyric lines, the meaning of the first line, the song summary, and
   the sources behind each are all visible without further interaction.
2. **Given** the song page is open, **When** the user selects a different lyric
   line, **Then** that line becomes the active line and the meaning panel shows
   its explanation and that explanation's own sources.
3. **Given** an explanation is displayed, **When** the user opens its source list,
   **Then** each source shows its domain, a type label, and the excerpt that was
   actually used to build the explanation.
4. **Given** any explanation on the page, **When** it is rendered, **Then** it
   displays a count of the sources it is grounded in.
5. **Given** a stored explanation that has been marked stale, **When** the user
   opens the page, **Then** the existing explanation remains fully readable and is
   marked as updating.

---

### User Story 2 - Read the same song in Hindi or Hinglish (Priority: P2)

A user who reads Hindi more comfortably than English switches the page to Hindi
and the entire page follows — lyrics in Devanagari, meanings in Hindi. Another
user who speaks Hindi but does not read Devanagari switches to Hinglish and gets
the same meanings in Hindi, written in English letters. Neither waits for
anything to load, and neither loses their place on the page.

**Why this priority**: Without this the product only serves English readers,
which is the smaller part of the audience for the music it explains. It is P2
only because P1 in a single language is a demonstrable product on its own.

**Independent Test**: Open a song, switch across all three modes, and confirm each
renders fully in the correct language and script, instantly, with scroll position
preserved.

**Acceptance Scenarios**:

1. **Given** the page is in English mode, **When** the user selects Hindi,
   **Then** lyrics render in Devanagari and all explanations render in Hindi.
2. **Given** the page is in English mode, **When** the user selects Hinglish,
   **Then** lyrics and explanations render in Latin script, with the explanations
   in the Hindi language.
3. **Given** the user has scrolled partway down a long song, **When** they switch
   mode, **Then** the same lyric line remains active and in view.
4. **Given** a user switches mode any number of times, **When** they check their
   remaining monthly allowance, **Then** it is unchanged.
5. **Given** any mode is selected, **When** the page renders, **Then** no Arabic
   or Urdu script appears anywhere on it, including within source excerpts.
6. **Given** a signed-in user selected a mode on a previous visit, **When** they
   return, **Then** the page opens in that mode.

---

### User Story 3 - Find out what one particular word means here (Priority: P2)

A word in the song is unfamiliar, or familiar but clearly not being used in its
everyday sense. The user selects that single word and gets its meaning **as used
in this song**, not a dictionary entry — and when the same word appears twice in
the song carrying two different senses, each occurrence explains itself.

**Why this priority**: This is the level of detail people currently cannot get
anywhere, and it is the reason the product stores word identity rather than word
spellings. It depends on P1 being in place.

**Independent Test**: Select a word that has a stored meaning and confirm the
song-specific gloss and its sources appear. Then select the same word at a second
occurrence where the stored meaning differs, and confirm a different gloss.

**Acceptance Scenarios**:

1. **Given** a lyric line is displayed, **When** the user selects a word within
   it that has a stored meaning, **Then** that word's meaning in this song is
   shown together with its sources.
2. **Given** a word appears twice in one song with two stored meanings, **When**
   the user selects each occurrence in turn, **Then** each shows its own meaning
   and the page indicates that the two uses differ.
3. **Given** a word has no stored meaning, **When** the page renders, **Then**
   that word is not presented as selectable.
4. **Given** a word meaning is open, **When** the user switches language mode,
   **Then** the same word stays selected and its meaning renders in the new mode.

---

### User Story 4 - Be told honestly when the tool doesn't know (Priority: P2)

A user opens a song, or a line within one, for which no grounded material exists.
Instead of a plausible-sounding paragraph, they are told plainly that there isn't
enough material yet, and offered the chance to contribute a source themselves.

**Why this priority**: This state is the visible proof of the product's central
promise. Shipping the page without it means the first gap in coverage silently
becomes an invented answer, which is the exact failure the product exists to fix.

**Independent Test**: Open a song or line whose stored explanation has no linked
sources, or none at all, and confirm the honest empty state appears with a
contribution path and no explanatory text of any kind.

**Acceptance Scenarios**:

1. **Given** a song with no grounded explanation at all, **When** the user opens
   its page, **Then** the page states that there is not enough grounded material
   and offers a path to contribute.
2. **Given** the empty state is shown, **When** the user reads it, **Then** no
   interpretation, paraphrase, or partial meaning of the song appears anywhere on
   the page.
3. **Given** an explanation record exists but has zero linked sources, **When**
   the page is rendered, **Then** it is treated as ungrounded and is not shown.
4. **Given** a song where some lines are grounded and others are not, **When** the
   user selects an ungrounded line, **Then** that line shows the empty state with
   a contribution path, and the grounded lines remain explained as normal.
5. **Given** a partly grounded song, **When** the user opens its page, **Then**
   the page shows how much of the song is explained, so a sparsely covered song
   is not mistaken for a complete one.
6. **Given** a song whose lines are grounded but whose overall summary is not,
   **When** the page renders, **Then** the summary region shows the empty state
   rather than a summary assembled from the line meanings.
7. **Given** a song supported by fewer than four reliable sources, **When** the
   user opens it, **Then** the lyric is shown, no meaning of any kind is offered,
   and the page states how many sources exist and that this falls short.
8. **Given** any ungrounded state, **When** the user reads it, **Then** they are
   offered both a way to contribute a source and a way to be notified when the
   song becomes explained.

---

### User Story 5 - Read comfortably on a phone (Priority: P3)

Most people hear a song and reach for their phone. The lyric stays readable, and
tapping a line brings its meaning up from the bottom of the screen without
burying the song.

**Why this priority**: It is the majority device, but the reading experience can
be validated on desktop first and the layout adapted after.

**Independent Test**: Open a song on a narrow screen, tap a line, read its
meaning, dismiss it, and confirm the lyric was never fully obscured.

**Acceptance Scenarios**:

1. **Given** a narrow screen, **When** the user taps a lyric line, **Then** that
   line's meaning opens from the bottom of the screen while part of the lyric
   remains visible.
2. **Given** the meaning is open, **When** the user dismisses it, **Then** the
   lyric returns to full height with the same line still active.
3. **Given** a narrow screen, **When** the user taps an individual word, **Then**
   the target area for that word is large enough to hit reliably without
   accidentally selecting a neighbouring word.

---

### User Story 6 - See where you stand on your free allowance (Priority: P3)

A user on the free plan can always see how much of their monthly allowance
remains, before they hit the end of it rather than at the moment of refusal. The
chatbot is visible to them as something they don't have yet, rather than hidden.

**Why this priority**: Reading a stored song costs a user nothing, so this story
never blocks them on this page — it exists so the limit is never a surprise
later.

**Independent Test**: Open a song page as a free-plan user and confirm remaining
allowance is displayed, and that the chatbot entry is visible and marked as
unavailable.

**Acceptance Scenarios**:

1. **Given** a signed-in free-plan user, **When** they open any song page,
   **Then** their remaining monthly allowance is displayed.
2. **Given** a free-plan user with allowance remaining, **When** they view any
   number of already-explained songs, **Then** their remaining allowance does not
   decrease.
3. **Given** a free-plan user, **When** they see the chatbot entry point, **Then**
   it is visible, marked as a paid feature, and does not open.
4. **Given** a paid-plan user, **When** they open a song page, **Then** no
   allowance meter is shown and the chatbot entry point is available.

---

### Edge Cases

- **A song is only partly grounded** — some lines have sources and others have
  none. This is the normal case, not a rarity. Grounded lines are explained,
  ungrounded lines say so individually, and the page shows overall coverage
  (D-001).
- **A song where only one line is grounded.** The page still opens and is useful.
  The active line on open should be a grounded one, not an empty panel.
- **A line's meaning exists in one language mode but not another.** The missing
  rendering is produced from the stored meaning; it never triggers new research
  and never consumes allowance.
- **A song has no line breaks or is a single long passage.** The lyric column must
  remain navigable and a line must still be selectable.
- **A Devanagari lyric line is much taller than its Latin equivalent.** Switching
  mode must not clip text or break the layout.
- **A source excerpt contains Urdu script.** The excerpt is stored but must not be
  displayed; the source remains listed and attributed.
- **A source page no longer exists.** The source stays listed with its stored
  excerpt, marked as no longer reachable — the explanation does not become
  ungrounded because a link rotted.
- **An explanation is marked stale while the user is reading it.** The user is not
  interrupted; the current text stays readable.
- **The same word appears many times in one song with one shared meaning.** The
  page must not imply the uses differ when they do not.
- **A signed-out visitor opens a song page.** See Assumptions.
- **Extremely long songs** (qawwalis frequently run past 100 lines) must remain
  responsive to scroll and selection.

## Requirements *(mandatory)*

### Functional Requirements

**Displaying the explanation**

- **FR-001**: System MUST display a song's lyric lines, the meaning of the active
  line, and a summary of the song's overall meaning.
- **FR-002**: System MUST allow the user to make any lyric line the active line
  and MUST show that line's meaning when they do.
- **FR-003**: System MUST display, for every explanation shown, the number of
  sources it was derived from.
- **FR-004**: System MUST allow the user to view the list of sources behind any
  explanation, each showing its origin, a type label, and the excerpt used.
- **FR-005**: System MUST NOT display any explanation supported by fewer than
  **four** reliable sources. Below that bar the explanation is withheld and the
  ungrounded state is shown instead (D-003).
- **FR-006**: System MUST NOT display any interpretive content that was not
  derived from a stored source.
- **FR-007**: System MUST continue to display a stale explanation, marked as
  updating, until a replacement exists.

**Language modes**

- **FR-008**: System MUST offer exactly three language modes — English, Hindi,
  Hinglish — and no others.
- **FR-009**: System MUST render the whole page in the selected mode: lyrics,
  line meanings, word meanings, the song summary, source labels, and interface
  text.
- **FR-010**: System MUST render Hindi mode in Devanagari script and English and
  Hinglish modes in Latin script.
- **FR-011**: System MUST render Hinglish explanations in the Hindi language using
  Latin script.
- **FR-012**: System MUST NOT display Arabic or Urdu script anywhere on the page,
  in any mode, including within source excerpts and metadata.
- **FR-013**: System MUST preserve the active line and scroll position across a
  mode change.
- **FR-014**: System MUST complete a mode change without any research being
  performed and without any loading state being shown.
- **FR-015**: System MUST NOT consume any part of a user's allowance for a mode
  change.
- **FR-016**: System MUST remember a signed-in user's chosen mode across visits,
  and MUST default a first-time visitor to English.

**Word meanings**

- **FR-017**: System MUST allow the user to select an individual word that has a
  stored meaning, and MUST show that word's meaning as used in this song.
- **FR-018**: System MUST treat each occurrence of a word independently, so that
  two occurrences carrying different stored meanings display differently.
- **FR-019**: System MUST indicate to the user when two occurrences of the same
  word in a song carry different meanings.
- **FR-020**: System MUST NOT present a word as selectable when it has no stored
  meaning.
- **FR-021**: System MUST display the sources behind a word meaning in the same
  way as for a line meaning.

**The ungrounded state — per-line honesty**

Grounding is assessed per line, not per song. A song with three explained lines
out of thirty is shown, with those three explained and the rest honestly marked.

- **FR-022**: System MUST, when no grounded material exists for a song at all,
  state that plainly and offer a path to contribute a source.
- **FR-023**: System MUST, when an individual lyric line has no grounded meaning,
  show the ungrounded state for that line while leaving every other line's
  meaning unaffected.
- **FR-024**: System MUST display the song summary only when the summary is itself
  grounded; otherwise the summary region MUST show the ungrounded state.
- **FR-025**: System MUST NOT display any partial or speculative meaning alongside
  any ungrounded state, at either line or song level.
- **FR-026**: System MUST show how much of the song is explained, so that a
  sparsely grounded song is not presented as a fully explained one.

**Plan and allowance**

- **FR-027**: System MUST display a free-plan user's remaining monthly allowance
  on the song page.
- **FR-028**: System MUST NOT consume allowance for viewing, re-reading, or
  sharing an already-explained song.
- **FR-029**: System MUST show the chatbot entry point to free-plan users in a
  visibly unavailable state rather than hiding it.
- **FR-030**: System MUST determine what a user is entitled to on the server, and
  MUST NOT rely on the interface alone to withhold a paid feature.

**Reading experience**

- **FR-031**: System MUST present the meaning alongside the lyric on wide screens
  and from the lower edge of the screen on narrow ones, without fully obscuring
  the lyric in either case.
- **FR-032**: System MUST make every selectable word large enough to be tapped
  reliably on a touch screen without reducing text size.
- **FR-033**: System MUST allow a user to reach and dismiss every meaning on the
  page using only a keyboard.
- **FR-034**: System MUST announce Devanagari and Hinglish content to assistive
  technology as Hindi so that it is read aloud correctly.

**Below the source bar**

- **FR-036**: System MUST, when material exists but falls below the four-source
  bar, show the lyric and state plainly that there is not enough to explain it —
  never a partial or hedged meaning.
- **FR-037**: System MUST, in that state, disclose what material does exist and
  how far short it falls, so the bar is visible rather than arbitrary.
- **FR-038**: System MUST offer the user a way to be notified when a song becomes
  explained, alongside the contribution path.

**Lyrics display**

- **FR-035**: System MUST display the song's full lyrics. See *Accepted Risks*
  below — this is a decision taken with the licensing exposure understood.

### Key Entities

- **Song**: A single song, with its title, artist, year, and ordered lyric lines.
  Carries an overall meaning and a grounded/stale/ungrounded status.
- **Lyric Line**: One line of a song, in sequence. Has at most one meaning.
- **Word Occurrence**: A single appearance of a word at a known position in a
  known line of a known song. This — not the word's spelling — is what a meaning
  attaches to, because the same spelling can mean different things in two songs
  and twice within one song.
- **Meaning**: An explanation of a song, a line, or a word occurrence. Exists once,
  independent of language, and is invalid unless linked to at least one source.
- **Rendering**: A meaning expressed in one of the three language modes. Three
  renderings of one meaning must always agree; they are invalidated together.
- **Source**: A retrieved document that a meaning was built from — its origin, its
  type, the excerpt used, and whether it is still reachable.
- **Viewer**: The person reading the page, their plan, their remaining allowance,
  and their chosen language mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of explanations shown to users display at least one source.
  There is no state in which the product presents meaning without attribution.
- **SC-002**: Zero Arabic or Urdu characters are rendered across a full sample of
  every song in the catalogue, in all three modes.
- **SC-003**: Switching language mode shows the fully rendered page in under one
  second, with no loading indicator, in 95% of switches.
- **SC-004**: Viewing already-explained songs never reduces a free user's monthly
  allowance — measured as zero allowance decrements attributable to viewing,
  across all users, over a month.
- **SC-005**: A first-time visitor can find the meaning of a specific line they
  care about within 30 seconds of the page opening.
- **SC-006**: 90% of users who open a song page reach the word-level meaning of at
  least one word, indicating the interaction is discoverable without instruction.
- **SC-007**: Users reading in Hindi rate the page's readability no lower than
  users reading in English — the Devanagari experience is not a downgrade.
- **SC-008**: On a song of 100+ lines, selecting a line shows its meaning without
  perceptible delay in 95% of selections.
- **SC-009**: Every meaning on the page is reachable and dismissible by keyboard
  alone, verified across all three modes.
- **SC-010**: When the product lacks material, users report the honest empty state
  as trustworthy rather than broken — measured by contribution rate from that
  screen exceeding abandonment.
- **SC-011**: A user can tell at a glance how much of a song is explained, without
  scrolling its full length — verified on a song with under 20% line coverage.
- **SC-012**: Partly grounded songs remain useful: users who open a song with at
  least one grounded line read that line's meaning rather than leaving, in the
  majority of such visits.

## Decisions

Both open questions were resolved by the owner on 2026-09-12.

### D-001 — Partial grounding: per-line honesty

Grounding is assessed **per line**. Grounded lines show their meaning; ungrounded
lines show the empty state individually; the song summary appears only if it is
itself grounded. A coverage indicator tells the user how much of the song is
explained.

*Rationale*: sources discuss a song's famous lines and ignore the rest, so
song-level all-or-nothing would hide most of the catalogue at launch. Per-line
honesty also makes the product's central promise visible line by line rather than
only on empty songs.

*Encoded in*: FR-023, FR-024, FR-025, FR-026, User Story 4.

### D-002 — Lyrics: display in full, licensing risk accepted

Full lyrics are displayed, as designed. Owner decision, taken with the exposure
below understood. See *Accepted Risks*.

*Encoded in*: FR-035.
### D-003 — The source bar is four, not one

An explanation is shown only when it rests on **at least four reliable sources**.
Below that, the song or line is treated as ungrounded: the lyric is shown, the
shortfall is disclosed, and the user is offered the contribution and notification
paths.

*Origin*: the design round proposed this independently — *"Below four reliable
sources, we show you the lyric and nothing else. A guess about a poem is worse
than an honest gap."* It contradicted the spec's original bar of one, was
escalated, and the owner chose four on 2026-09-12.

*Rationale*: two forum posts and a lyric page cannot establish what a line of
qawwali means. A low bar would fill the catalogue with thin readings and destroy
the trust the product is built on.

*Cost, accepted*: materially fewer songs are viewable at launch, and more of the
catalogue sits in the ungrounded state until contributions arrive. This makes
feature G (community contributions) more important, not less.

*Relationship to the constitution*: Principle I sets an absolute floor — never
zero sources. Four sits above that floor, so there is no conflict and no
amendment is required. If the bar should be constitutional rather than
per-spec, say so and it will be amended with a version bump.

*Encoded in*: FR-005, FR-036, FR-037, FR-038.


## Carried Forward to Other Specs

The 2026-09-12 design round produced three ideas that are good and are **out of
scope here**. Recorded so they are not lost when their own spec is written.

- **Research shows its discards** — the waiting state displayed *"Found 11
  candidate sources → Kept 6, discarded 5 as unreliable"*. Making quality control
  visible is a strong trust signal. → *research pipeline spec*.
- **The chatbot refuses out-of-scope questions in the user's words** — *"none of
  our six sources cover that, so I won't speculate."* → *chatbot spec*.
- **Contribution review is shown as a queue** with its current step, plus accepted
  and declined examples. → *contributions (feature G) spec*.

## Accepted Risks

### R-001 — Lyrics licensing exposure

**The risk**: song lyrics are copyrighted separately from recordings. In India
they are typically controlled by the film's music label. Sites that display full
lyrics generally license them from a provider or the rights holder. Displaying
full lyrics without a licence invites takedown notices and, at scale, liability.

**Status**: knowingly accepted for this version. Flagged 2026-09-12, decided by
the owner the same day.

**Why accepting it is defensible for now**: the product's output is commentary and
criticism, which is treated more favourably than reproduction alone; volume is
low pre-launch; and the exposure grows with traffic rather than arriving at once.

**What would change the calculation** — revisit if any of these occur:

- the product starts earning revenue, which changes both the incentive to pursue
  it and the damages available
- a takedown notice arrives
- traffic reaches a level where the site is publicly visible to rights holders
- Indian operation gives way to a market with more aggressive enforcement

**The cheaper alternative remains available**: rendering only the line under
discussion as a quoted excerpt materially reduces exposure. It was considered and
set aside for this version, not ruled out. Keeping lyric rendering in a single
component would let that switch be made later without redesigning the page —
a note for `/speckit-plan`.

*This is a record of a business decision, not legal advice.*

## Assumptions

- **Signed-out visitors can read song pages.** Viewing stored explanations costs
  nothing to serve, and requiring a login before anyone sees value would suppress
  adoption. Their chosen language mode is remembered on their device only.
- **Every lyric line has at most one meaning.** Multiple competing interpretations
  of a single line are not modelled in this version.
- **Only words with a stored meaning are selectable.** Function words and common
  particles are not made selectable merely to appear interactive.
- **The first *grounded* line is active when the page opens**, so a user sees a
  real explanation immediately rather than an empty panel. On a partly grounded
  song this may not be the song's first line.
- **Dark theme only.** No light theme exists in this version.
- **Explanations are already stored.** This spec covers reading them; producing
  them is a separate feature.
- **Audio playback is out of scope.** The page explains a song; it does not play
  one.
- **Sharing and export are out of scope** for this spec, though the page must not
  consume allowance for them when they arrive.
- **Source excerpts are stored at retrieval time**, so a source that later goes
  offline can still be shown and attributed.
