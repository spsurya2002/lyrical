# Design Prompt — Round 2

**How to use this file:** paste everything below the line into the **same
LyricSense canvas** in Claude Design. It is a follow-up, not a fresh start — the
canvas already has screens 1–13 and the design system established.

**Why this round exists:** the first prompt was written before the decision that
grounding is assessed *per line* rather than per song. Two states were therefore
never designed. This round adds them. Nothing already on the canvas needs
redoing.

---

## The brief

Add three artboards to the LyricSense canvas, in exactly the established theme —
same colour tokens, same Newsreader / Tiro Devanagari Hindi / Inter pairing, same
spacing, radii and motion. These must sit beside screens 3–13 as if they had
always been there.

### The change that drove this round

Grounding is now assessed **per line**, not per song. A song is not all-explained
or all-unexplained. The normal case is a song where a handful of famous lines are
well sourced and the rest are not, because that is what the internet actually
discusses.

The product must be honest about that at line level, and must never let a
sparsely explained song look like a complete one.

### The source bar

An explanation is shown only when it rests on **at least four reliable sources** —
the bar this canvas itself proposed in screen 6, now adopted as the rule. Below
four, the lyric is shown and no meaning of any kind is offered.

---

## Artboard 3d — Song page, partly grounded *(the important one)*

A desktop song page, English mode, 1240px — same layout as 3a — for a song where
**only 4 of 26 lines clear the four-source bar**.

It must show, on one screen:

- **Grounded lines** rendering normally, exactly as in 3a.
- **Ungrounded lines** rendering as lyric text, visibly not explained, and not
  presented as clickable. They are not errors and must not read as broken — use
  `--text-muted` and restraint, not `--ungrounded` on every line.
- **A coverage indicator** — the user must be able to tell at a glance how much
  of this song is explained, without scrolling its full length. Something like
  `4 of 26 lines explained`. Place it where it is honest rather than buried:
  near the song title or at the head of the lyric column.
- **The active line on open is a grounded one**, not line 1 — a user must land on
  a real explanation, not an empty panel.
- **The song summary region showing its own ungrounded state**, because a summary
  built from four lines out of twenty-six would itself be a guess.

This artboard is the point of the round. If only one thing is right, make it this.

## Artboard 3e — A single ungrounded line selected

The same page, with the user having selected one of the **unexplained** lines.

The meaning panel shows that line's own honest empty state:

- what the line is
- that there isn't enough to explain it — state the shortfall plainly, e.g.
  `2 sources · we need 4`
- the sources that *do* exist, listed, so the bar is visible rather than arbitrary
- `[ Contribute a source ]` and `[ Notify me when it's ready ]`

The rest of the page is untouched — other lines stay explained. That contrast is
the whole point: the product is honest line by line, not only when it has nothing
at all.

Use `--ungrounded` `#C2705A`, muted and never alarm-red, exactly as screen 6
established.

## Artboard 3f — Coverage indicator, states

A small study strip showing the coverage indicator at four levels, so its
behaviour across the catalogue is settled in one place:

| State | Treatment |
|---|---|
| `26 of 26 lines explained` | Fully explained — quiet, `--grounded` |
| `18 of 26 lines explained` | Mostly explained — neutral |
| `4 of 26 lines explained` | Sparse — honest, still not alarming |
| `0 of 26 lines explained` | Nothing clears the bar — links to screen 6 |

Annotate which token each state uses.

---

## Constraints — unchanged from round 1

- **No Arabic or Urdu script anywhere**, including in sample source excerpts.
  Arabic-origin words are set as `Fana` / `फ़ना`.
- Dark theme only.
- Use only the established tokens. Two greys have crept into the canvas that are
  not in the palette — `#1A1A1A` and `#0D0C0B`. Do not use either; if a near-black
  layer is needed, use `--bg-base` `#0A0908` or `--bg-inset` `#070606`.
- Reading measure 62–70 characters.
- Devanagari keeps its +0.1 line-height.

## Deliverable

Three artboards — 3d, 3e, 3f — added to the existing canvas, in the established
theme, positioned with the other song-page screens.

Do not modify screens 1–13. This round only adds.
