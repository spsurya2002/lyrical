import type { UngroundedReason } from '../domain/grounding.js';
import type { Mode } from '../domain/modeScript.js';

/**
 * The shape of the song page response.
 * specs/001-song-page-trilingual/contracts/song-page-api.md
 *
 * The type that matters most is LineView: `meaning` and `ungrounded` are a
 * discriminated union, so a line with a meaning cannot also carry an ungrounded
 * state and a line without one cannot carry a partial meaning. There is no
 * third shape, because the product has no third answer (FR-025).
 */

export interface SourceView {
  domain: string;
  url: string;
  type: string;
  /**
   * null when the stored excerpt cannot be rendered in this mode — most often
   * because it is in Urdu script, which is normal for these songs' sources.
   * The source is still listed and still counts toward grounding; only its
   * text is withheld (docs/language_policy.md, §2).
   */
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
  /**
   * Words in this line that have their own servable meaning.
   *
   * On the LINE, not on the meaning: a line can be unexplained while a word
   * inside it is explained. Nesting these under `meaning` made grounded word
   * meanings unreachable on exactly those lines — which is the normal case
   * under per-line honesty, not an edge case.
   */
  words: SelectableWord[];
} & ({ meaning: MeaningView; ungrounded: null } | { meaning: null; ungrounded: UngroundedView });

export interface CoverageView {
  linesExplained: number;
  linesTotal: number;
}

export interface ViewerView {
  plan: string;
  quota: { remaining: number; limit: number } | null;
  chatbotAvailable: boolean;
}

export interface SongPageResponse {
  song: {
    slug: string;
    title: string;
    artist: string;
    year: number | null;
    film: string | null;
  };
  mode: Mode;
  /** BCP-47 tag for the `lang` attribute, so screen readers switch voice (FR-034). */
  lang: string;
  coverage: CoverageView;
  /** The first SERVABLE line, or null when nothing on the page is servable. */
  activeLineNo: number | null;
  lines: LineView[];
  summary: MeaningView | null;
  summaryUngrounded: UngroundedView | null;
  /** null when signed out. */
  viewer: ViewerView | null;
}
