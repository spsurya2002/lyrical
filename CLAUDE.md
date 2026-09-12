# CLAUDE.md — LyricSense

Read this before doing anything else in this repository.

**LyricSense** explains what songs mean — word by word, line by line, and as a
whole — grounded in real sources rather than invented by a model. See
[`objective.md`](objective.md) for the product and
[`tech_stack.md`](tech_stack.md) for the stack.

**The owner does not write code.** They cannot catch your mistake by reading the
diff. Every rule below exists because of that. Follow them literally.

---

## 0. Read order

1. [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — governing
   principles. It outranks this file, every spec, and your own judgement.
2. [`objective.md`](objective.md) — what the product is.
3. [`tech_stack.md`](tech_stack.md) — what it is built with.
4. [`docs/language_policy.md`](docs/language_policy.md) — the three-language rule.
5. [`docs/subscription_plans.md`](docs/subscription_plans.md) — Basic vs Pro.
6. The current spec in `specs/`, if one is active.

---

## 1. Never invent. Verify or say you didn't.

This is the rule the project exists under. It applies twice — to what the
product says, and to what you say.

### The product must not invent meanings

- Every meaning served to a user traces to a retrieved source. No sources means
  the product says *"not enough grounded material yet"* — it does not answer
  from model recall.
- Never write a fallback that quietly fills a gap with the model's own
  knowledge. If you find one, remove it and report it.

### You must not invent progress

- **Never report something as working unless you ran it and saw the output in
  this session.** Not "should work", not "this now handles" — say what you ran
  and what it printed.
- **Never invent an API, flag, config key, schema field, or library behaviour.**
  If you are not certain, verify it: read the installed package, run it, or
  fetch the docs. If you cannot verify it, say so in the same sentence you use
  it. A guessed API that looks plausible is the single most expensive failure
  mode here, because the owner cannot see that you guessed.
- **Never invent a file path, function name, or symbol.** Read before you
  reference. If you assumed a file exists, check.
- **Report partial work as partial.** Four of five tasks done is reported as
  four of five, naming the fifth and why.
- **Quote failures.** Paste the actual error. Never summarise a failure into
  something that sounds like progress.
- **Do not agree reflexively.** If the owner proposes something that conflicts
  with the constitution, the stack, or a fact you have verified, say so plainly
  and explain why. Agreeing to be agreeable is a failure mode, not politeness.
- If you notice you were wrong earlier, correct it in one sentence and continue.

### Say these when they are true

> "I haven't verified this — here's how I can."
> "I don't know. Let me check before I answer."
> "That won't work, and here's the reason."
> "I ran X. It failed with Y. I have not fixed it yet."

---

## 2. Language rules (hard constraint)

Three output modes: **English**, **Hindi**, **Hinglish**. No fourth.

| Mode | Word | Meaning | Script |
|---|---|---|---|
| English | Romanized | English | Latin |
| Hindi | Devanagari | Hindi | Devanagari |
| Hinglish | Romanized | Hindi language | Latin |

**Arabic and Urdu script must never reach a user** — not in headwords, lyrics,
glosses, chatbot replies, quoted sources, or metadata. Sources may be *stored*
in Urdu script; the rendering boundary is where it stops.

Every generated payload passes the script validator before being stored or
returned. Full rules and Unicode ranges: [`docs/language_policy.md`](docs/language_policy.md).

---

## 3. Workflow — specs before code

Specs are tracked with **Spec Kit**. Nothing gets built without one.

```
/speckit-specify   → write the feature spec
/speckit-clarify   → resolve ambiguity (don't assume it away)
/speckit-plan      → technical plan + Constitution Check
/speckit-tasks     → ordered, verifiable tasks
/speckit-implement → execute in order
/speckit-analyze   → cross-artifact consistency check
```

- Code with no corresponding task is **out of scope**. Do not write it, however
  obvious the improvement looks.
- Scope discovered mid-implementation becomes a new task in the spec. It does
  not get silently built.
- Each task ends with its verification command actually run.

---

## 4. You run the commands

The owner never runs a terminal command, installs a tool, or pastes output. If
something needs to run, **you run it and report what happened**.

- Prefer the sandbox. Long-running processes go to the background, not a blocked
  foreground.
- Install into the project, not globally, unless asked.
- If a command needs a permission the owner must grant, explain in one line what
  it does and why — don't just retry it.

### Stop and ask before

- spending money — a paid service, a higher infra tier, a costlier model
- destructive operations — dropping tables, `git push --force`, `rm` on files
  you did not create, rewriting history
- changing the tech stack, or adding a dependency that replaces something the
  stack already covers
- changing [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
- anything outward-facing — deploying, publishing, sending, or posting

### Never

- commit a secret, or print one in full
- commit `.env` (commit `.env.example` instead)
- weaken a type, a test, or a check to make something pass
- add `any` to silence a type error
- delete or skip a failing test to get green

---

## 5. Git — a branch per feature, a commit per task

The owner does not read diffs. Git history is the **audit trail** that shows what
you actually did, and the **undo** when something goes wrong. A 40-file commit
called "implement song page" destroys both.

- **One branch per Spec Kit feature**, named for its spec directory:
  `specs/001-song-page-trilingual/` → branch `001-song-page-trilingual`.
  Never commit feature work to `master`. Project-level docs may go to `master`.
- **One commit per task in `tasks.md`, or smaller.** If the message needs an
  "and", it is two commits. Reverting one commit should undo exactly one decision.
- **Commit when verification passed**, not when the code looks finished. A commit
  asserts `npm run verify` was green at that point.
- **Message**: `<type>(<scope>): <what, imperative>`, then why if not obvious,
  then the task id. Types: `feat fix refactor test docs chore spec`.
- **Report commits, not just files.** The commit list is the owner's review
  surface — it should read as a sequence of decisions.

Ask before: `push --force`, rewriting published history, merging to `master`,
deleting unmerged branches, or pushing to a remote the first time.

Full rules and the pre-commit checklist: the **`git-workflow`** skill.

---

## 6. Code conventions

- **TypeScript everywhere**, frontend and backend. `tsc --noEmit` must be clean.
- Match the surrounding file's style — naming, comment density, structure.
  Don't introduce a second idiom for something the codebase already does.
- Comments explain *why*, not *what*. No decorative headers, no restating the
  line below.
- Errors are handled where they can be acted on. No empty `catch`. No swallowing
  an error and returning a default that looks like success.
- Every route that calls a model is rate-limited **before it ships**. Unlimited
  model route = unfinished feature.
- Entitlements resolve through one function server-side. Client gating is
  presentation only, never the security boundary.
- No hardcoded prices, quotas, or limits — configuration, per
  [`docs/subscription_plans.md`](docs/subscription_plans.md).

---

## 7. Tests

Required for: the grounding pipeline (including the no-source path), plan
entitlement checks, the language/script boundary, and payment webhooks.

Elsewhere, test where behaviour is non-obvious. Don't write tests for coverage
numbers.

Run them in-session and quote the output. "Tests pass" without the output is not
a report.

---

## 8. How to report back

The owner reads your message, not the diff. Structure every completion report as:

1. **What I built** — in plain terms, not file names alone.
2. **What I ran** — the actual commands.
3. **What the output was** — quoted, including failures.
4. **What's left** — anything incomplete, skipped, or assumed.
5. **What I need from you** — decisions, credentials, approvals.

Flag assumptions explicitly. If you assumed something and the assumption is
wrong, the owner needs to be able to catch it from your message alone — that
message is the only review this project gets.
