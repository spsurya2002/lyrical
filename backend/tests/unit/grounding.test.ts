import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The four-source bar (D-003) and per-line honesty (D-001).
 *
 * `config` is mocked so the bar can be moved — proving it is genuinely
 * configuration and not a constant that happens to equal 4.
 */
const mockConfig = { GROUNDING_MIN_SOURCES: 4 };
vi.mock('../../src/config/index.js', () => ({ config: mockConfig }));

const { assessGrounding, isServable, minSources } = await import('../../src/domain/grounding.js');
const { computeCoverage, firstServableLineNo } = await import('../../src/domain/coverage.js');

beforeEach(() => {
  mockConfig.GROUNDING_MIN_SOURCES = 4;
});

describe('assessGrounding — the bar', () => {
  it('serves at exactly the bar', () => {
    const state = assessGrounding(4);
    expect(state.servable).toBe(true);
    expect(state.reason).toBeNull();
  });

  it('serves above the bar', () => {
    expect(assessGrounding(11).servable).toBe(true);
  });

  it('refuses one below the bar, and says why', () => {
    const state = assessGrounding(3);
    expect(state.servable).toBe(false);
    expect(state.reason).toBe('below_bar');
  });

  it('refuses two sources — the case the design screen shows', () => {
    const state = assessGrounding(2);
    expect(state.servable).toBe(false);
    expect(state.reason).toBe('below_bar');
    // FR-037: the shortfall must be disclosable, not merely refused.
    expect(state.sourceCount).toBe(2);
    expect(state.sourcesRequired).toBe(4);
  });

  it('distinguishes no material at all from falling short', () => {
    expect(assessGrounding(0).reason).toBe('no_material');
    expect(assessGrounding(1).reason).toBe('below_bar');
  });

  it('never serves a zero-source meaning — Principle I, no exception', () => {
    expect(isServable(0)).toBe(false);
    mockConfig.GROUNDING_MIN_SOURCES = 1;
    expect(isServable(0)).toBe(false);
  });
});

describe('assessGrounding — the bar is configuration, not a constant', () => {
  it('follows the configured value upward', () => {
    mockConfig.GROUNDING_MIN_SOURCES = 6;
    expect(minSources()).toBe(6);
    expect(isServable(5)).toBe(false);
    expect(isServable(6)).toBe(true);
  });

  it('follows the configured value downward', () => {
    mockConfig.GROUNDING_MIN_SOURCES = 2;
    expect(isServable(2)).toBe(true);
    expect(isServable(1)).toBe(false);
  });
});

describe('assessGrounding — missing language rendering (R-02)', () => {
  it('refuses when grounded but the rendering is absent', () => {
    const state = assessGrounding(6, false);
    expect(state.servable).toBe(false);
    expect(state.reason).toBe('mode_unavailable');
  });

  it('reports below_bar rather than mode_unavailable when both are true', () => {
    // Not enough sources is the more fundamental problem; backfilling a
    // rendering would not make it servable.
    expect(assessGrounding(2, false).reason).toBe('below_bar');
  });
});

describe('computeCoverage — FR-026', () => {
  const line = (servable: boolean) => ({ servable });

  it('counts a partly grounded song', () => {
    const lines = [...Array(4).fill(line(true)), ...Array(22).fill(line(false))];
    const coverage = computeCoverage(lines);
    expect(coverage.linesExplained).toBe(4);
    expect(coverage.linesTotal).toBe(26);
  });

  it('handles a fully grounded song', () => {
    const coverage = computeCoverage(Array(26).fill(line(true)));
    expect(coverage.ratio).toBe(1);
  });

  it('handles a song with nothing grounded', () => {
    const coverage = computeCoverage(Array(26).fill(line(false)));
    expect(coverage.linesExplained).toBe(0);
    expect(coverage.ratio).toBe(0);
  });

  it('returns 0 rather than NaN for a song with no lines', () => {
    expect(computeCoverage([]).ratio).toBe(0);
  });
});

describe('firstServableLineNo — where the page opens', () => {
  it('picks the first grounded line, not line 1', () => {
    const lines = [
      { lineNo: 1, servable: false },
      { lineNo: 2, servable: false },
      { lineNo: 3, servable: true },
      { lineNo: 4, servable: true },
    ];
    // Landing on line 1 would show an empty panel while line 3 is explained.
    expect(firstServableLineNo(lines)).toBe(3);
  });

  it('picks line 1 when line 1 is grounded', () => {
    expect(firstServableLineNo([{ lineNo: 1, servable: true }])).toBe(1);
  });

  it('returns null when nothing is grounded, so the caller shows the song-level state', () => {
    expect(firstServableLineNo([{ lineNo: 1, servable: false }])).toBeNull();
  });

  it('returns null for a song with no lines', () => {
    expect(firstServableLineNo([])).toBeNull();
  });
});
