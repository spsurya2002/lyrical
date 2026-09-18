# Roadmap

> **Superseded 2026-09-19 by [`architecture.md`](architecture.md).**
>
> This document sequenced the remaining work on the assumption that the content
> pipeline would be built roughly as `objective.md` described it. A review of the
> `lyrics-finder` prototype and of real LRCLIB data changed that: a song turned
> out to be a *family of performances* rather than one text, the reusable unit
> turned out to be the *concept* rather than the song, and the lyrics layer
> turned out to need reconciliation and transliteration stages this plan did not
> account for.
>
> **The current spec sequence is [`architecture.md` §10](architecture.md).**

The one part of this document that survives unchanged is the framing below, kept
because it is still the right way to think about what is missing.

---

## Where we are

Spec 001 built the **read path**: a song page that shows lyrics, per-line
meanings, word meanings in song context, and the sources behind each, in three
languages, with honest states wherever grounding falls short.

It reads from a contract rather than from content, which is why none of it has to
change when real explanations arrive.

**What is real**: the page, the schema, the grounding rule, the script boundary,
entitlement decisions, 241 tests.

**What is not**: the content itself. Placeholder fixtures with a banner saying
so. No accounts, so quota is hardcoded. No way to find a song that isn't seeded.

## The shape of the gap

Three things stand between here and something a stranger could use:

1. **Real explanations.** The product's entire claim is grounded meaning, and
   there is currently none.
2. **Knowing who is asking.** Quota, library and Pro all need an account.
3. **Getting to a song.** There is no landing page and no search.

Everything else in `objective.md` is an enhancement of a working product. Those
three are the product.

## What stays true regardless of sequencing

Every spec inherits [the constitution](../.specify/memory/constitution.md), and
these four are not renegotiated per feature:

- **Nothing ungrounded reaches a user.** The four-source bar applies to whatever
  the pipeline produces, not only to fixtures.
- **Three languages, no Arabic or Urdu script**, including in anything a
  contributor submits.
- **Entitlements are decided server-side**, whatever new gated feature appears.
- **Reading stays free.** The paywall sits on research, because that is the part
  that costs money.

## What is deliberately not planned

- **Audio playback.** The product explains songs; it does not play them.
- **A fourth language.** Constitution Principle III, and it would need amending.
- **Mobile apps.** The web app is responsive; native is a different project.
- **Recommendations.** No evidence yet that anyone wants them.
