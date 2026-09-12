# Subscription Plans

Two plans: **Basic** (free) and **Pro** (paid). Structure and feature split
confirmed by the owner on 2026-09-12. Prices and quota numbers below are
proposals and are marked as such — they are the cheapest thing to change and the
easiest to get wrong.

---

## 1. Entitlement matrix

This table is the contract. It maps one-to-one onto the entitlement check in the
backend; when it changes, the code and its tests change with it.

| Capability | Basic (free) | Pro (paid) |
|---|---|---|
| View an already-explained song | Unlimited | Unlimited |
| **Research a new song** (not yet in the knowledge base) | 5 / calendar month | Unlimited *(fair-use ceiling, §4)* |
| All three language modes | Yes | Yes |
| Word-level meaning on click | 20 / day | Unlimited |
| **In-context AI chatbot** (objective.md, feature D) | No | Yes |
| **Personal library** (feature F) | 20 saved items | Unlimited |
| **Export** — PDF + share card | No | Yes |
| Contribute knowledge (feature G) | Yes | Yes |
| Google login | Yes | Yes |

Two deliberate choices worth stating:

- **Contribution is free on both plans.** Feature G exists to grow the knowledge
  base; charging for it would starve the thing that makes the product work.
- **Cached songs are unlimited on Basic.** Serving stored explanations costs
  almost nothing (objective.md, feature C), so the free tier stays genuinely
  useful and the paywall sits on the expensive operation — research.

### Proposed pricing *(owner decision)*

| | Monthly | Yearly |
|---|---|---|
| Basic | ₹0 | ₹0 |
| Pro | ₹199 | ₹1,599 *(~33% off)* |

Not yet decided: whether to sell outside India, and therefore whether a USD
price is needed. Until that is decided, build the price as configuration, not a
constant — a hardcoded `199` in the codebase is a defect.

---

## 2. Quota semantics

Ambiguity here becomes billing disputes, so it is pinned down:

- **A quota unit is consumed only when research actually runs** — i.e. the song
  has no stored explanation and the pipeline calls a model. Viewing, re-reading,
  switching language mode, and sharing consume nothing.
- **A failed research attempt does not consume quota.** If the pipeline errors,
  times out, or ends in the "not enough grounded material" state of Principle I,
  the unit is refunded. The user gets nothing, so the user pays nothing.
- **A stale regeneration does not consume quota.** Staleness (features C + G) is
  the system's decision, not the user's request.
- **The month is a calendar month in the user's timezone**, resetting at 00:00
  on the 1st. Not a rolling 30-day window — rolling windows are harder to explain
  and generate support load.
- **Remaining quota is always visible**, not discovered at the moment of refusal.

---

## 3. Enforcement

Per Principle VI of the constitution, entitlement is a **server-side** check.

- One authoritative function — `getEntitlements(userId)` — returns the resolved
  plan and limits. No route re-derives them from a `plan` string on its own.
- Every gated route calls it before doing work, and returns `402 Payment
  Required` with a machine-readable reason code (`QUOTA_EXHAUSTED`,
  `PRO_ONLY_FEATURE`, `LIBRARY_FULL`) that the UI maps to an upgrade prompt.
- The frontend hides Pro features for Basic users as *presentation*. It is never
  the boundary. There MUST be a test that calls each gated route directly with a
  Basic user's token and asserts refusal.
- Quota counters live in Postgres as the source of truth. Redis may cache them
  for read speed; it may not be the only record, because eviction would hand out
  free quota.

---

## 4. Fair use on Pro

"Unlimited" needs a defined edge, or one scripted account can run up an
unbounded model bill.

- Pro carries a soft ceiling of **100 new-song researches per day**. Crossing it
  does not cut the user off — it queues their requests at lower priority and
  flags the account for review.
- Rate limits (`express-rate-limit` + Redis, per `tech_stack.md`) apply to both
  plans. Pro gets a higher ceiling, not an absent one.
- The ceiling is configuration, and the marketing page says "unlimited, subject
  to fair use" rather than a bare "unlimited".

---

## 5. Lifecycle rules

| Event | Behaviour |
|---|---|
| Upgrade mid-month | Pro applies immediately; unused Basic quota is discarded |
| Downgrade | Pro runs to the end of the paid period, then Basic limits apply |
| Payment fails | 7-day grace period at Pro level, then automatic downgrade |
| Over library limit after downgrade | Existing saves are kept and readable; new saves blocked until under 20. Never silently delete a user's saved items |
| Refunds | Manual, owner-approved. No self-serve refund flow in v1 |
| Account deletion | Subscription cancelled, personal data removed. Contributions to the knowledge base are retained, de-identified |

---

## 6. Open decision — payment provider

**Blocked on the owner.** Subscriptions cannot be built without this, but
nothing else in the project is waiting on it.

| | Razorpay | Stripe |
|---|---|---|
| India domestic | Native; UPI, RuPay, netbanking | Supported but weaker on UPI |
| Recurring UPI mandates | Yes — matters a great deal for ₹199/month in India | Limited |
| International cards | Yes, with extra onboarding | Best in class |
| Fees (India) | ~2% | ~3% domestic, higher international |

**Recommendation: Razorpay**, if the initial market is India. At a ₹199 price
point, UPI autopay is the difference between a subscription that converts and
one that does not — Indian users overwhelmingly do not keep cards on file.

Whichever is chosen, these hold:

- The provider sits behind a thin internal interface, so switching later is a
  new adapter rather than a rewrite.
- **The webhook is the source of truth** for subscription state, never the
  browser redirect. A user closing the tab after paying must still end up Pro.
- Webhook handlers are idempotent and signature-verified. Providers retry, and
  an unverified webhook endpoint is a way to grant yourself Pro for free.
- Payment flows are tested against the provider's sandbox before launch, with
  the output recorded per Principle II.

`tech_stack.md` has an added section flagging this same decision.
