---
name: "grounding-check"
description: "Enforce the LyricSense rule that no explanation is ever invented — every word meaning, line meaning, and song summary must trace to retrieved sources, and the no-sources path must say so rather than answer. Load BEFORE writing or changing anything in the RAG/research pipeline, retrieval, embeddings, model prompts, explanation generation or storage, the chatbot, contribution ingestion (feature G), staleness/regeneration (feature C), or any fallback/error path that could substitute model recall for retrieved material."
user-invocable: true
disable-model-invocation: false
---

# Grounding Check

Governing principle: I in
[`.specify/memory/constitution.md`](../../../.specify/memory/constitution.md).
This is the product's entire reason to exist. The owner's stated problem with
ChatGPT was that *"it often invents a meaning that has no grounding in the song's
actual context."* Every shortcut taken here rebuilds the thing being replaced.

## The contract

1. Every meaning served to a user traces to **at least one** retrieved source
   document in the knowledge base.
2. Every generated explanation **stores the source IDs** it was derived from. A
   row with zero linked sources is invalid data and must not be served.
3. Retrieval returning nothing usable produces the **ungrounded state** — *"We
   don't have enough grounded material on this song yet"* plus the contribution
   path — **not** an answer from model recall.
4. Model general knowledge may **rephrase and clarify** retrieved material. It
   may never **supply** material.

## The testable line

> Strip retrieval. The pipeline must produce the ungrounded state, not an answer.

There MUST be a test asserting exactly this. If the pipeline still answers with
retrieval disabled, the product is inventing meanings and the feature is broken
regardless of how good the output reads.

## Failure modes to actively hunt for

These are the ways grounding dies quietly. Look for them in any code you touch,
and report any you find even if they are outside your current task.

- **The helpful fallback.** `if (sources.length === 0) { /* answer anyway */ }`.
  This is the primary violation. Delete it.
- **The soft prompt.** A prompt saying "use the sources below" without saying
  "if the sources do not cover it, say so" — models fill gaps by default.
- **Sources attached, not used.** Source IDs stored, but the prompt never
  actually constrained generation to them. This passes a schema check and fails
  the principle. Citations must be *derived*, not decorative.
- **The chatbot side door.** Feature D's chatbot must obey identical grounding
  rules. It is the easiest place to accidentally ship an ungrounded model.
- **The confident summary.** A song summary synthesised from line meanings is
  fine; one synthesised from the model's knowledge of the song is not.
- **Empty-retrieval masking.** A `catch` around retrieval that returns `[]` turns
  an infrastructure failure into a silent ungrounded answer. Distinguish
  "retrieval failed" (error) from "retrieval found nothing" (ungrounded state).
- **Threshold drift.** A similarity threshold lowered to make results appear is
  ungrounding by degrees. Changing it requires justification in the plan.

## Word identity

The same word can mean different things in two songs, and twice within one song
(objective.md, feature D). Each word occurrence has its own identity and its own
sources. Never let a cached gloss for `ishq` in one song leak into another —
cache keys must include song and occurrence context, not just the surface form.

## Contributions (feature G)

Contributed material is **candidate** source material, not truth.

- It is reviewed for relevance on a schedule before entering the knowledge base.
- Accepted contributions mark affected songs stale; the next request regenerates.
- A contribution is stored with its provenance and is itself citable.
- Out-of-scope submissions are rejected, not stored "just in case".

## Cost interaction

Grounding and cost pull in opposite directions — regenerating is both more
grounded and more expensive. The resolution is already decided (objective.md,
"How C and G work together"): serve from storage, regenerate only on staleness.
Do not re-litigate it in code by adding opportunistic regeneration.

A failed or ungrounded research attempt **refunds the user's quota unit**. They
got nothing; they pay nothing.

## Before saying it works

- [ ] Retrieval-disabled test produces the ungrounded state — run, output quoted
- [ ] Zero-source explanations cannot be written or served
- [ ] Generation prompt explicitly instructs "say so if sources don't cover it"
- [ ] Stored source IDs are the ones generation actually saw
- [ ] Chatbot obeys the same rules — tested separately
- [ ] Retrieval failure and retrieval-empty are distinguishable in logs
- [ ] Ungrounded state refunds quota
- [ ] No fallback to model recall anywhere in the path

Per Principle II: none of these may be reported as passing unless you ran it and
saw the output this session.
