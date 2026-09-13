# Roadmap

How [`objective.md`](../objective.md) becomes a working product, broken into specs.

Written 2026-09-13, after spec 001 (the song page) shipped. It sequences the
remaining work, says what each piece unlocks, and — more usefully — says what
cannot start until something else exists.

This is a plan, not a promise. Later specs will be rewritten as earlier ones
teach us things.

---

## Where we are

Spec 001 built the **read path**: a song page that shows lyrics, per-line
meanings, word meanings in song context, and the sources behind each, in three
languages, with honest states wherever grounding falls short.

It reads from a contract rather than from content, which is why none of it has
to change when real explanations arrive.

**What is real**: the page, the schema, the grounding rule, the script boundary,
entitlement decisions, 241 tests.

**What is not**: the content itself. Five placeholder fixtures with a banner
saying so. No accounts, so quota is hardcoded. No way to find a song that isn't
already seeded.

---

## The shape of the gap

Three things stand between here and something a stranger could use:

1. **Real explanations.** The product's entire claim is grounded meaning, and
   there is currently none.
2. **Knowing who is asking.** Quota, library and Pro all need an account.
3. **Getting to a song.** There is no landing page and no search — you can only
   reach a song by typing its slug.

Everything else in `objective.md` is an enhancement of a working product.
Those three are the product.

---

## Sequence

### 002 — Research pipeline *(the keystone)*

**Covers**: objective.md A, B, C.

Retrieve real sources for a song, generate explanations grounded in them, store
them with their source links, and serve them forever after.

Built first because **nothing else matters without it**. Accounts guard a quota
for a feature that does not exist; search finds songs it cannot explain; the
chatbot has no knowledge base to answer from.

Runs as a job to begin with — research a catalogue offline, and the existing
song page starts showing real content with no change to it at all.

**Hard parts**: deciding a source is worth trusting; refusing to generate when
four good ones are not there; the staleness rule where C and G meet.

**Depends on**: nothing. **Unlocks**: everything.

---

### 003 — Accounts

**Covers**: objective.md E.

Google login, sessions, a real `user` table, and the monthly research counter
that `getEntitlements` already expects.

Small, and it turns three things from shapes into facts: the quota meter shows a
real number, Pro means something, and a library has somewhere to live.

**Depends on**: nothing. **Unlocks**: 004, 005, 006, 007.

---

### 004 — Discovery

**Covers**: the landing page, search, disambiguation, and research on demand.

Paste a song name, a URL, or whatever you remember. If it is already explained,
it appears instantly. If it is not, research runs — and *that* is where a quota
unit is finally spent.

This is the step that makes the product usable by someone who is not us. After
it, the loop in `objective.md` is closed end to end.

**Depends on**: 002 (to research) and 003 (to charge). **Unlocks**: a shippable
product.

> **002 + 003 + 004 is the minimum shippable product.** Everything below is
> improvement, not completion.

---

### 005 — Contributions

**Covers**: objective.md G.

Paste a URL or an image that explains a song well. Reviewed on a schedule for
genuine relevance, then folded into the knowledge base — which marks affected
songs stale so the next reader gets a better answer.

Worth doing early despite being "extra": it is the only thing that makes the
ungrounded state *actionable* rather than just honest. Every song sitting below
the four-source bar is a prompt to contribute, and the page already asks.

**Depends on**: 002, 003. **Unlocks**: a knowledge base that grows without us.

---

### 006 — Personal library

**Covers**: objective.md F.

Save songs and words. The word view is the interesting half — the same word
means different things in different songs, so a saved word carries its song
with it.

**Depends on**: 003.

---

### 007 — Subscriptions

**Covers**: the paid half of objective.md I.

Razorpay or Stripe, the webhook as source of truth, upgrade and downgrade
lifecycle. The entitlement logic already exists and is tested; this connects it
to money.

Deliberately late. There is no point charging for a product before the thing
being charged for is good, and the free tier is what grows the catalogue.

**Depends on**: 003. **Blocked on**: the provider decision, still open in
[`subscription_plans.md`](subscription_plans.md) §6.

---

### 008 — In-context chatbot

**Covers**: objective.md D.

A chatbot that knows the open song and answers only from its stored sources,
and says so when a question falls outside them. Its entitlement gate already
exists and returns 501.

Late because it is the easiest place in the whole product to accidentally ship
an ungrounded model, and it should be built when the knowledge base is good
enough to answer from.

**Depends on**: 002, 003, 007.

---

### 009 — Export and share

**Covers**: the Pro export from objective.md I — PDF and share cards.

Small, visible, and the best organic growth path the product has: a share card
is one lyric line, its meaning, and its sources.

**Depends on**: 003, 007.

---

## Dependency graph

```
002 research ──┬──────────────► 004 discovery ──► SHIPPABLE
               │                     ▲
003 accounts ──┴─────────────────────┘
      │
      ├──► 005 contributions ──► knowledge base grows
      ├──► 006 library
      └──► 007 subscriptions ──┬──► 008 chatbot
                               └──► 009 export
```

---

## What stays true throughout

Every spec inherits [the constitution](../.specify/memory/constitution.md), and
these four in particular are not renegotiated per feature:

- **Nothing ungrounded reaches a user.** The four-source bar applies to whatever
  the research pipeline produces, not only to fixtures.
- **Three languages, no Arabic or Urdu script**, including in anything a
  contributor submits.
- **Entitlements are decided server-side**, whatever new gated feature appears.
- **Reading stays free.** The paywall sits on research, because that is the part
  that costs money. This is the shape the whole business rests on.

## What is deliberately not planned

- **Audio playback.** The product explains songs; it does not play them.
- **A fourth language.** Constitution Principle III, and it would need amending.
- **Mobile apps.** The web app is responsive; native is a different project.
- **Recommendations.** No evidence yet that anyone wants them.
