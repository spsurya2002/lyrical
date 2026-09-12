---
name: "git-workflow"
description: "LyricSense branching and micro-commit discipline. Load BEFORE starting any feature, before the first code change of a task, and before any commit, branch, merge, or push. Also load when the owner asks what changed, asks to undo something, asks to review history, or when a task from tasks.md is completed. Governs branch naming, commit granularity, commit message format, and what must never be committed."
user-invocable: true
disable-model-invocation: false
---

# Git Workflow

The owner does not read diffs. Git history is therefore not a developer
convenience here — it is the **audit trail** that lets them see what an agent
actually did, and the **undo mechanism** when something goes wrong.

A 40-file commit called "implement song page" destroys both. That is the failure
this skill exists to prevent.

## Branch per feature

One branch per Spec Kit feature, named for its spec directory:

```
specs/001-song-page-trilingual/  →  branch  001-song-page-trilingual
```

- Branch from `master`, at the point the spec is approved.
- **Never commit feature work directly to `master`.** Project-level documents
  (constitution, CLAUDE.md, tech_stack.md, docs/) may be committed to `master`
  when they are not part of a feature.
- The branch lives until the feature is complete and verified, then merges.
- Create it before the first task, not after the third.

```bash
git checkout -b 001-song-page-trilingual
```

## Micro-commits

**One commit per task in `tasks.md`**, or smaller. Never larger.

A commit should be small enough that its message fully describes it, and that
reverting it undoes exactly one decision. If you cannot describe a commit in one
line without "and", it is two commits.

| Commit this | Not this |
|---|---|
| the script validator | "the domain layer" |
| the script validator's tests | "validator + tests + migration" |
| one migration | "database setup" |
| one component | "the frontend" |

Related code and its tests may share a commit when the tests exist only to prove
that code — but prefer splitting when either stands alone.

**Commit when a task's verification passed, not when the code looks finished.**
A commit is a claim that `npm run verify` was green at that point.

## Message format

```
<type>(<scope>): <what changed, imperative, lowercase>

<why, when it is not obvious from the what>
<the task id from tasks.md>
```

**Types**: `feat` · `fix` · `refactor` · `test` · `docs` · `chore` · `spec`

**Scope**: the feature number (`001`) for feature work, or the area (`docs`,
`ci`, `deps`) otherwise.

```
feat(001): reject Arabic and Urdu script at the output boundary

Constitution Principle III. The validator runs on read as well as write,
because the pipeline that writes this data is out of scope for this
feature and cannot be assumed to have validated.

T014
```

Good subject lines say what changed and, where useful, why. `fix stuff`,
`updates`, `wip` and `address feedback` say nothing and are not acceptable.

### Attribution

End every commit message with:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

## Never commit

- **Secrets.** `.env`, API keys, tokens, credentials. `.env.example` is what
  gets committed. If a secret is ever committed, say so immediately — rotating
  the key matters more than the embarrassment.
- **`node_modules/`**, build output, `dist/`, coverage, `playwright-report/`.
- **A failing state**, unless the commit message says so explicitly and says why.
- **Unrelated changes swept in.** If you noticed and fixed something else,
  that is its own commit.
- **Generated or reformatted files mixed with logic changes** — a formatting
  commit and a behaviour commit are never the same commit.

## Never do without asking

Per constitution Principle V:

- `git push --force` (or `--force-with-lease`) to a shared branch
- rewriting published history — rebase, amend, reset on anything pushed
- deleting a branch that has unmerged work
- merging to `master`
- pushing to a remote at all, the first time

Amending your own last unpushed commit is fine.

## Reporting

When reporting completed work, give the owner the commits, not just the files:

```
3 commits on 001-song-page-trilingual:
  a1b2c3d  feat(001): mode to script mapping                    T013
  d4e5f6a  feat(001): reject Arabic and Urdu at the boundary    T014
  b7c8d9e  test(001): script validator fixtures                 T015
```

That list is the owner's review surface. It should read as a sequence of
decisions someone could follow without opening a single file.

## Before saying it works

- [ ] On the feature branch, not `master`
- [ ] One task per commit, or smaller
- [ ] Every message names what changed and its task id
- [ ] `npm run verify` was green at each commit
- [ ] No secret, no `node_modules`, no build output in the diff
- [ ] `git status` clean — nothing left uncommitted and unmentioned

Per Principle II: run `git log --oneline` and `git status` and quote them. Do not
report a commit you have not seen in the log.
