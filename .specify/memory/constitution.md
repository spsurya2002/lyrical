# LyricSense Constitution

This document governs every specification, plan, task, and line of code in this
project. Where this document conflicts with a spec, a plan, a convenience, or a
model's own judgement, **this document wins**.

The project owner does not write code. Every principle here exists so that the
owner can trust what an agent reports without reading the diff.

---

## Core Principles

### I. No Ungrounded Meaning (NON-NEGOTIABLE)

The product explains songs. It must never invent an explanation.

- Every word meaning, line meaning, and song summary served to a user MUST be
  traceable to at least one retrieved source document stored in the knowledge
  base.
- A generated explanation MUST store the source IDs it was derived from. An
  explanation row with zero linked sources is invalid data and MUST NOT be
  served.
- When retrieval returns nothing usable, the product says so — *"We don't have
  enough grounded material on this song yet"* — and offers the contribution
  path (feature G). It does not fall back to the model's own recall.
- Model general knowledge may be used to *rephrase and clarify* retrieved
  material. It may never be used to *supply* material.
- The distinction is testable: strip retrieval, and the pipeline must produce
  the "not enough material" state, not an answer. There MUST be a test asserting
  exactly this.

### II. No Ungrounded Agent Claims (NON-NEGOTIABLE)

The same rule, applied to the agent building the product.

- An agent MUST NOT report a feature as working, a test as passing, or a bug as
  fixed unless it has run the command and seen the output in that session.
- "Should work", "this will now handle", and "I've fixed it" without an
  execution result are prohibited phrasings. State what was run and what it
  printed.
- When an agent does not know — an API shape, a library's behaviour, a version's
  syntax — it MUST verify (read the installed source, run it, or fetch the docs)
  or say plainly that it is unverified. Guessing an API and moving on is the
  single most costly failure mode in this project.
- Partial completion is reported as partial. If four of five tasks are done, the
  report says four of five and names the fifth.
- Errors and failing output are quoted, not summarised away.

### III. Three Languages, Three Scripts, No Others

LyricSense supports exactly three output languages: **English**, **Hindi**, and
**Hinglish**. This is a product constraint, not a default.

- The full rules live in [`docs/language_policy.md`](../../docs/language_policy.md)
  and are binding.
- **Arabic and Urdu script (Nastaʿlīq, Perso-Arabic) MUST NOT appear anywhere in
  user-facing output**, including source quotations, word headwords, and
  chatbot replies. Content in those scripts is transliterated or dropped at the
  boundary — never passed through.
- No spec may add a fourth language without amending this constitution first.

### IV. Specs Before Code

- No implementation begins without a spec in `specs/` produced by the Spec Kit
  flow (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks`).
- Code that has no corresponding task in a `tasks.md` is out of scope and MUST
  NOT be written, however obvious the improvement seems.
- Scope discovered mid-implementation goes back into the spec as a new task. It
  does not get silently built.

### V. The Owner Approves, The Agent Executes

- The agent runs every command. The owner is never asked to run a terminal
  command, install a tool, or paste output — if something must run, the agent
  runs it and reports the result.
- The agent MUST stop and ask before: spending money (new paid service, model
  upgrade, infra tier), destructive operations (dropping tables, force-push,
  deleting files it did not create), changing the tech stack, or changing
  anything in this constitution.
- Secrets are never committed, never printed in full, and never sent to an
  external service. `.env` stays local; `.env.example` is what gets committed.

### VI. Cost Is A Feature

Every AI call costs money and the product's margin lives or dies here.

- Cached explanations are served from storage, never regenerated (objective.md
  feature C). Regeneration happens only when a song is explicitly marked stale.
- Every route that calls a model MUST be rate-limited before it ships. A model
  route without a rate limit is an incomplete feature, not a working one.
- Plan entitlements are enforced server-side. Client-side gating is presentation
  only and is never the security boundary.

### VII. Simple Until Proven Otherwise

- Build for the requirement in the spec, not the requirement imagined for
  version 3. `tech_stack.md` already states what scale is being designed for.
- New infrastructure (a service, a database, a queue, a vendor) requires written
  justification in the plan and owner approval. Adding a dependency to avoid
  writing twenty lines is usually the wrong trade.

### VIII. History Is The Audit Trail

The owner does not read diffs. Git history is how they see what was actually
done, and how a mistake gets undone.

- **One branch per feature**, named for its spec directory. Feature work never
  lands directly on `master`.
- **One commit per task**, or smaller. A commit whose message needs an "and" is
  two commits. Reverting one commit must undo exactly one decision.
- A commit asserts that verification was green at that point. Committing a known
  failing state requires saying so in the message, and why.
- Work is reported as a list of commits, not a list of files. That list is the
  owner's review surface.
- Secrets, `node_modules`, and build output are never committed. A secret that
  reaches a commit is reported immediately — rotating the key matters more than
  the embarrassment.

Operational detail lives in the `git-workflow` skill and [`CLAUDE.md`](../../CLAUDE.md) §5.

---

## Quality Gates

Work is not "done" until all of the following hold. An agent claiming completion
is asserting that it has checked each one.

| Gate | Requirement |
|---|---|
| Grounding | Explanations carry source links; the no-source path is tested |
| Language | Output passes the language policy check; no Arabic/Urdu script |
| Entitlement | Plan limits enforced server-side and tested |
| Rate limit | Every model-calling route is limited |
| Types | `tsc --noEmit` clean — no `any` added to silence an error |
| Tests | Test command run in-session; output quoted in the report |
| Secrets | No credential in the diff |
| History | On a feature branch, one commit per task, messages name what and why |

---

## Development Workflow

1. **Specify** — `/speckit-specify` writes the feature spec. Ambiguity is
   resolved with `/speckit-clarify`, not with an assumption.
2. **Plan** — `/speckit-plan` produces the technical plan, checked against this
   constitution. A plan that violates a principle is rewritten, not excused.
3. **Tasks** — `/speckit-tasks` decomposes into ordered, verifiable tasks.
4. **Implement** — `/speckit-implement` executes tasks in order. Each task ends
   with its verification command actually run.
5. **Report** — the owner receives: what was built, what was run, what the
   output was, and what remains.

Tests are required for: the grounding pipeline, plan entitlement checks, the
language policy boundary, and payment/webhook handling. Elsewhere, tests are
written where behaviour is non-obvious, not for coverage theatre.

---

## Governance

- This constitution supersedes all other practice in this repository.
- Amendments require the owner's explicit approval, a version bump below, and a
  note of what changed and why.
- Every plan produced by `/speckit-plan` MUST include a Constitution Check
  section confirming compliance, with any deviation named and justified in
  writing.
- Runtime working rules for agents live in [`CLAUDE.md`](../../CLAUDE.md); that
  file implements this constitution and may not relax it.

**Version**: 1.1.0 | **Ratified**: 2026-09-12 | **Last Amended**: 2026-09-12

### Amendment log

- **1.1.0** — Added Principle VIII (History Is The Audit Trail): branch per
  feature, commit per task. Requested by the owner after observing that a long
  run of uncommitted work leaves them nothing to review or revert.
