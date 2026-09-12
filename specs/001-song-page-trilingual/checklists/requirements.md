# Specification Quality Checklist: Song Page — Trilingual Explanation Viewer

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-12
**Last validated**: 2026-09-12 (iteration 3, after the design audit and D-003)
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain — both resolved, recorded as D-001 and D-002
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Constitution Compliance

Checked against [`.specify/memory/constitution.md`](../../../.specify/memory/constitution.md):

- [x] **I — No ungrounded meaning**: FR-005, FR-006 forbid unattributed content;
      FR-022 to FR-026 make the ungrounded state mandatory at both line and song
      level; User Story 4 covers it; SC-001 makes it measurable.
- [x] **III — Three languages, no Arabic/Urdu**: FR-008 to FR-012 encode the
      contract; SC-002 makes the script prohibition measurable.
- [x] **V — Owner approves**: both escalated decisions answered and recorded with
      rationale (D-001, D-002). The licensing trade-off was raised before the
      decision, not after.
- [x] **VI — Cost is a feature**: FR-015 and FR-028 forbid allowance consumption
      for mode switching and viewing; SC-004 measures it.
- [x] **VII — Simple until proven otherwise**: audio, sharing, export, competing
      interpretations, and light theme explicitly excluded.

## Design Audit — 2026-09-12

Audited the Claude Design canvas (`design/UI mockups_ Screens 3–7/`) against
[`design_prompt.md`](../../../design_prompt.md) and this spec, by reading the
canvas source rather than screenshots.

| Check | Result |
|---|---|
| Arabic/Urdu script, all files | **0 codepoints** — passes |
| Devanagari content | 1,403 codepoints, 52 distinct runs — real, not fallback |
| Fonts | All 5 loaded from Google Fonts with `display=swap`; 3b explicitly sets Tiro Devanagari Hindi at +0.1 line-height |
| Colour tokens | 15 of 18 exact. Absent: `accent-hover`, `accent-press`, `info` — hover/press don't render statically and no info notices appear in these screens. Not defects |
| Off-palette | 5 distinct values, low count. `#1A1A1A` (×16) and `#0D0C0B` (×23) should be removed in a later round |
| Screens | All 13 present (1, 2, 3a/3b/3c, 4, 6–13) |
| Grounding UI | Source counts, grounded marks, excerpts, stale/updating, honest empty state — all present |

**Gaps found** — both traced to `design_prompt.md` predating decision D-001, not
to the design round:

- **FR-026** coverage indicator — absent from every artboard.
- **FR-023** per-line ungrounded state — the canvas has song-level (screen 6) and
  word-level (screen 11), but never one unexplained line inside an otherwise
  explained song.

Both are addressed by [`design_prompt_round2.md`](../../../design_prompt_round2.md),
which adds artboards 3d, 3e and 3f. **Re-audit after that round before
`/speckit-plan`.**

**Conflict found and resolved**: the design proposed a four-source minimum where
the spec required one. Escalated; owner chose four. Recorded as D-003 and encoded
in FR-005, FR-036, FR-037, FR-038.

## Notes

**Status: ready for `/speckit-plan` once the round-2 design gaps are closed.**
All checklist items pass as of iteration 3.

Two things for the planner to carry forward:

1. **R-001 (lyrics licensing)** is a knowingly accepted risk, not an oversight.
   The plan MUST keep lyric rendering in a single component so that switching to
   excerpt-only display later is a contained change rather than a page redesign.
   The spec names the conditions that would trigger that revisit.

2. **Per-line grounding (D-001)** means grounded status is a property of each
   line, each word occurrence, and the summary independently — not of the song.
   The data model in the plan must reflect that, and the "coverage" figure in
   FR-026 derives from it.

Still open project-wide, but **not** blocking this feature: the payment provider
choice (see `docs/subscription_plans.md` §6).
