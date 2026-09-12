---
name: "plan-entitlements"
description: "Enforce LyricSense Basic vs Pro entitlements, quota semantics, rate limiting, and payment/webhook correctness. Load BEFORE writing or changing anything that gates a feature by plan, counts or resets quota, calls a model from a route, handles subscription state, processes payment webhooks, or renders upgrade/quota UI. Also load when adding any new route that costs money to serve."
user-invocable: true
disable-model-invocation: false
---

# Plan Entitlements

Binding spec: [`docs/subscription_plans.md`](../../../docs/subscription_plans.md).
Governing principle: VI in
[`.specify/memory/constitution.md`](../../../.specify/memory/constitution.md).

## The matrix

| Capability | Basic (free) | Pro (paid) |
|---|---|---|
| View an already-explained song | Unlimited | Unlimited |
| Research a new song | 5 / calendar month | Unlimited *(fair use)* |
| All three language modes | Yes | Yes |
| Word meaning on click | 20 / day | Unlimited |
| In-context chatbot | **No** | Yes |
| Personal library | 20 items | Unlimited |
| Export — PDF, share card | **No** | Yes |
| Contribute knowledge | Yes | Yes |

The paywall sits on **research**, the expensive operation. Reading cached
explanations is free and unlimited — that is deliberate, and gating it would
break the economics the product is designed around.

## Quota semantics — get these exactly right

Ambiguity here becomes billing disputes.

- A unit is consumed **only when research actually runs** — no stored
  explanation exists and the pipeline calls a model.
- **Viewing, re-reading, switching language mode, and sharing consume nothing.**
  Mode switching in particular is a rendering change, not a new explanation.
- **Failed research refunds the unit.** Error, timeout, or the ungrounded state
  (see the `grounding-check` skill) — the user got nothing, so they pay nothing.
- **Stale regeneration consumes nothing.** Staleness is the system's decision,
  not the user's request.
- The month is a **calendar month in the user's timezone**, resetting 00:00 on
  the 1st. Not a rolling window.
- Remaining quota is **always visible**, never discovered at the moment of refusal.

## Enforcement rules

- **One authoritative function**: `getEntitlements(userId)` returns the resolved
  plan and limits. No route re-derives them from a `plan` string of its own.
- Gated routes call it **before doing work** and return `402` with a
  machine-readable reason: `QUOTA_EXHAUSTED`, `PRO_ONLY_FEATURE`, `LIBRARY_FULL`.
- **Client-side gating is presentation only.** There MUST be a test that calls
  each gated route directly with a Basic user's token and asserts refusal.
  Hiding a button is not a security boundary.
- **Quota counters live in Postgres** as the source of truth. Redis may cache
  them for read speed but must never be the only record — eviction would hand
  out free quota.
- Counter increments are **atomic**. Two concurrent requests must not both pass
  a check at the last remaining unit.

## Rate limiting

Per Principle VI: **a model-calling route without a rate limit is an unfinished
feature, not a working one.** No exceptions, including internal and admin routes.

- `express-rate-limit` backed by Redis (see `tech_stack.md`).
- Both plans are limited. Pro gets a higher ceiling, not an absent one.
- Pro's "unlimited" carries a soft ceiling of 100 researches/day: crossing it
  queues at lower priority and flags the account — it does not cut the user off.
- Marketing copy says "unlimited, subject to fair use", never a bare "unlimited".

## Payments

**The payment provider is an open decision** — see §6 of
[`docs/subscription_plans.md`](../../../docs/subscription_plans.md) (Razorpay
recommended for an India-first launch, because UPI autopay decides whether a
₹199/month subscription converts at all). **Do not pick one unilaterally. Ask.**

Whichever is chosen:

- Put it behind a thin internal interface so switching is a new adapter, not a
  rewrite.
- **The webhook is the source of truth** for subscription state — never the
  browser redirect. A user who closes the tab after paying must still become Pro.
- Webhook handlers are **idempotent** and **signature-verified**. Providers
  retry, and an unverified webhook endpoint is a way to grant yourself Pro for
  free.
- Test against the provider's sandbox before launch; record the output.

## Lifecycle

| Event | Behaviour |
|---|---|
| Upgrade mid-month | Pro immediately; unused Basic quota discarded |
| Downgrade | Pro until end of paid period, then Basic |
| Payment fails | 7-day grace at Pro, then automatic downgrade |
| Over library limit after downgrade | Existing saves kept and readable; new saves blocked. **Never silently delete a user's saved items** |
| Account deletion | Subscription cancelled, personal data removed, contributions retained de-identified |

## No hardcoding

Prices, quotas, limits, and the fair-use ceiling are **configuration**. A literal
`199` or `5` in the codebase is a defect. Pricing outside India is undecided, so
currency must not be baked in either.

## UI tone

- Quota meter is neutral until 1 remaining, then `--stale`. **Never red** —
  running out of a free allowance is not an error.
- Pro features are **shown and gated**, not hidden, so users know what they'd get.
- Upgrade prompts appear at the moment of the limit, naming what was attempted.
  One per session. No interstitials.

## Before saying it works

- [ ] Each gated route tested directly with a Basic token — refusal asserted
- [ ] Quota consumed only on actual research; mode switch tested to consume none
- [ ] Failed and ungrounded research refund the unit — tested
- [ ] Concurrent requests at the last unit cannot both pass
- [ ] Every model-calling route has a rate limit
- [ ] Webhook is idempotent and signature-verified — replay tested
- [ ] No hardcoded price, quota, or currency
- [ ] Downgrade preserves over-limit saved items

Per Principle II: run it, quote the output, and report anything still unverified.
