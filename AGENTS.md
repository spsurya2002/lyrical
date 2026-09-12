# AGENTS.md — LyricSense

For any coding agent working in this repository (Cursor, Codex, Copilot, Gemini,
Claude Code, or otherwise).

## Canonical rules

**[`CLAUDE.md`](CLAUDE.md) is the full operating manual. Read it first — all of
it — regardless of which agent you are.** It is not Claude-specific; it has that
name because Claude Code loads it automatically.

Above it sits [`.specify/memory/constitution.md`](.specify/memory/constitution.md),
which outranks every spec, plan, and instruction in this repo, including your
own judgement.

This file exists so the rules are discoverable under the cross-tool `AGENTS.md`
convention. It deliberately does **not** restate the full rules — two copies
drift, and a drifted rule is worse than no rule. What follows is only the set
that must never be got wrong, reproduced so that an agent which somehow reads
only this file still cannot cause harm.

## Non-negotiables

1. **The product never invents meaning.** Every explanation traces to a
   retrieved source. No sources → the product says it lacks grounded material.
   Never add a fallback to model recall.

2. **You never invent progress.** Do not claim something works unless you ran it
   and saw the output this session. Do not invent APIs, flags, config keys,
   schema fields, file paths, or library behaviour — verify, or say plainly that
   you did not. Quote failures instead of summarising them into progress. Report
   partial work as partial.

3. **Three languages only** — English, Hindi, Hinglish. **Arabic and Urdu script
   must never reach a user**, anywhere, including quoted sources. Storing it is
   fine; rendering it is not. See [`docs/language_policy.md`](docs/language_policy.md).

4. **Specs before code.** Work flows through Spec Kit (specify → clarify → plan
   → tasks → implement). Code with no corresponding task is out of scope.

5. **Stop and ask** before: spending money, destructive operations, changing the
   tech stack, editing the constitution, or anything outward-facing (deploy,
   publish, send, post).

6. **Never** commit a secret or `.env`, weaken a type or test to get green, add
   `any` to silence an error, or ship a model-calling route without a rate limit.

7. **One branch per feature, one commit per task.** Feature work never lands on
   `master`. The owner reads commits, not diffs — a 40-file commit called
   "implement feature" destroys their only review surface.

8. **Entitlements are enforced server-side.** Client-side gating is presentation
   only, never the security boundary.

## Project map

| File | What it holds |
|---|---|
| [`objective.md`](objective.md) | What the product is and why |
| [`tech_stack.md`](tech_stack.md) | Stack and hosting decisions |
| [`docs/language_policy.md`](docs/language_policy.md) | The three-language rule, enforced |
| [`docs/subscription_plans.md`](docs/subscription_plans.md) | Basic vs Pro entitlements |
| [`docs/design_system.md`](docs/design_system.md) | Tokens, type, components |
| [`design_prompt.md`](design_prompt.md) | Visual brief — Claude Design, "UI mockups" |
| [`design_prompt_wireframe.md`](design_prompt_wireframe.md) | Structure brief — Claude Design, "Wireframe" |
| `specs/` | Spec Kit feature specs |

## Reporting

The owner does not write code and will not read the diff. Your message is the
only review this project gets. Report: what you built, what you ran, what it
printed (failures included), what's left, and what you need from them.
