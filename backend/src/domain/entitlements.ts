/**
 * What a viewer is allowed to do. docs/subscription_plans.md, constitution VI.
 *
 * THE SINGLE SOURCE. No route may re-derive entitlements from a plan string of
 * its own — the moment two places decide what "Pro" means, they disagree, and
 * the disagreement is a paywall bypass.
 *
 * The client hides Pro controls as PRESENTATION ONLY. Hiding a button is not a
 * security boundary; every gated route calls this and refuses on its own.
 *
 * Pure and synchronous: the caller loads the viewer record, this decides. That
 * keeps the rules readable and testable without a database.
 */

export type Plan = 'anonymous' | 'basic' | 'pro';

/** Cache partition key — a response is only shareable between same-class viewers. */
export type ViewerClass = 'anon' | 'basic' | 'pro';

export interface Viewer {
  readonly userId: string | null;
  readonly plan: Plan;
  /** New-song researches already used this calendar month. */
  readonly researchUsedThisMonth: number;
  readonly librarySavedCount: number;
}

export interface Entitlements {
  readonly plan: Plan;
  readonly viewerClass: ViewerClass;
  /** null means unlimited (subject to the fair-use ceiling). */
  readonly researchLimit: number | null;
  readonly researchRemaining: number | null;
  readonly libraryLimit: number | null;
  readonly chatbotAvailable: boolean;
  readonly exportAvailable: boolean;
  /** Whether to show a quota meter at all — Pro and signed-out viewers do not get one. */
  readonly showQuotaMeter: boolean;
}

export const ANONYMOUS_VIEWER: Viewer = {
  userId: null,
  plan: 'anonymous',
  researchUsedThisMonth: 0,
  librarySavedCount: 0,
};

/**
 * Plan limits.
 *
 * These are the shape of the plans, not their tuning: the numbers a business
 * decision could move (the monthly research allowance, the library cap) come
 * from configuration in the research and library features that enforce them.
 * This feature only reads and displays them, and consumes nothing.
 */
const PLAN_RULES: Record<Plan, Omit<Entitlements, 'plan' | 'researchRemaining'>> = {
  anonymous: {
    viewerClass: 'anon',
    researchLimit: 0,
    libraryLimit: 0,
    chatbotAvailable: false,
    exportAvailable: false,
    showQuotaMeter: false,
  },
  basic: {
    viewerClass: 'basic',
    researchLimit: 5,
    libraryLimit: 20,
    chatbotAvailable: false,
    exportAvailable: false,
    showQuotaMeter: true,
  },
  pro: {
    viewerClass: 'pro',
    researchLimit: null,
    libraryLimit: null,
    chatbotAvailable: true,
    exportAvailable: true,
    showQuotaMeter: false,
  },
};

export function getEntitlements(viewer: Viewer): Entitlements {
  const rules = PLAN_RULES[viewer.plan];

  const researchRemaining =
    rules.researchLimit === null
      ? null
      : // Never report a negative allowance: a plan change mid-month can leave
        // usage above the limit, and "-2 left" is nonsense to a reader.
        Math.max(0, rules.researchLimit - viewer.researchUsedThisMonth);

  return { plan: viewer.plan, researchRemaining, ...rules };
}

/** Reason codes the client maps to an upgrade prompt (contracts/song-page-api.md). */
export type RefusalReason = 'QUOTA_EXHAUSTED' | 'PRO_ONLY_FEATURE' | 'LIBRARY_FULL';

export function refuseChatbot(entitlements: Entitlements): RefusalReason | null {
  return entitlements.chatbotAvailable ? null : 'PRO_ONLY_FEATURE';
}

export function refuseExport(entitlements: Entitlements): RefusalReason | null {
  return entitlements.exportAvailable ? null : 'PRO_ONLY_FEATURE';
}
