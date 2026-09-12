import { config } from '../config/index.js';

/**
 * The grounding rule. Constitution Principle I, spec decision D-003.
 *
 * An explanation is served only when it rests on at least `GROUNDING_MIN_SOURCES`
 * sources — four by default, and configuration rather than a constant so the bar
 * can be tuned as the catalogue grows (research.md R-04).
 *
 * Servability is DERIVED on every read, never stored (research.md R-05). A stored
 * boolean would go stale the moment a contribution landed or a source went
 * unreachable, and a stale flag means serving an under-grounded explanation —
 * exactly what the constitution forbids. Deriving it makes that bug impossible.
 *
 * Below-bar meanings are still stored. That is what lets the page disclose
 * "2 sources · we need 4" (FR-037), and lets a contribution push a song over the
 * bar with no regeneration.
 */

export type UngroundedReason = 'below_bar' | 'no_material' | 'mode_unavailable';

export interface GroundingState {
  readonly servable: boolean;
  readonly sourceCount: number;
  readonly sourcesRequired: number;
  readonly reason: UngroundedReason | null;
}

export function minSources(): number {
  return config.GROUNDING_MIN_SOURCES;
}

/**
 * @param sourceCount   how many sources back this meaning
 * @param hasRendering  whether the requested language rendering exists (R-02)
 */
export function assessGrounding(sourceCount: number, hasRendering = true): GroundingState {
  const sourcesRequired = minSources();

  if (sourceCount <= 0) {
    return { servable: false, sourceCount: 0, sourcesRequired, reason: 'no_material' };
  }

  if (sourceCount < sourcesRequired) {
    return { servable: false, sourceCount, sourcesRequired, reason: 'below_bar' };
  }

  // Grounded, but not in the language asked for. The meaning exists; this
  // rendering does not yet. Backfill is enqueued elsewhere; we never fall back
  // to another language, because that would have the reader believe English was
  // all that existed.
  if (!hasRendering) {
    return { servable: false, sourceCount, sourcesRequired, reason: 'mode_unavailable' };
  }

  return { servable: true, sourceCount, sourcesRequired, reason: null };
}

export function isServable(sourceCount: number, hasRendering = true): boolean {
  return assessGrounding(sourceCount, hasRendering).servable;
}
