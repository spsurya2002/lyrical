/**
 * Mirrors backend/src/api/types.ts.
 *
 * Duplicated rather than shared through a package: two deployable units
 * (tech_stack.md), and a shared package for one interface is the kind of
 * infrastructure Principle VII says to earn before adding. The contract test on
 * the backend is what keeps these honest.
 */

export type Mode = 'en' | 'hi' | 'hi-Latn';

export type UngroundedReason = 'below_bar' | 'no_material' | 'mode_unavailable';

export interface SourceView {
  domain: string;
  url: string;
  type: string;
  excerpt: string | null;
  excerptWithheld: boolean;
  retrievedAt: string;
  reachable: boolean;
}

export interface SelectableWord {
  occurrenceId: string;
  position: number;
  text: string;
}

export interface MeaningView {
  meaningId: string;
  text: string;
  sourceCount: number;
  status: 'active' | 'stale';
}

export interface UngroundedView {
  reason: UngroundedReason;
  sourceCount: number;
  sourcesRequired: number;
}

export type LineView = {
  lineNo: number;
  text: string;
  /** Words with their own servable meaning — on the LINE, not on the meaning. */
  words: SelectableWord[];
} & ({ meaning: MeaningView; ungrounded: null } | { meaning: null; ungrounded: UngroundedView });

export interface SongPageResponse {
  song: { slug: string; title: string; artist: string; year: number | null; film: string | null };
  mode: Mode;
  lang: string;
  coverage: { linesExplained: number; linesTotal: number };
  activeLineNo: number | null;
  lines: LineView[];
  summary: MeaningView | null;
  summaryUngrounded: UngroundedView | null;
  viewer: {
    plan: string;
    quota: { remaining: number; limit: number } | null;
    chatbotAvailable: boolean;
  } | null;
}
