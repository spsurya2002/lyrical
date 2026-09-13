interface Props {
  linesExplained: number;
  linesTotal: number;
}

/**
 * How much of this song is explained (FR-026).
 *
 * Exists because per-line honesty (D-001) makes partial coverage the normal
 * case, not an edge case. Without this, a song with four explained lines out of
 * twenty-six looks complete until you scroll.
 *
 * Four states, and none of them scold. A sparsely covered song is not a broken
 * one — it is a song nobody has written enough about yet, which is a fact about
 * the internet rather than a fault of the reader or the product.
 */
export function CoverageIndicator({ linesExplained, linesTotal }: Props) {
  const ratio = linesTotal === 0 ? 0 : linesExplained / linesTotal;

  const tone =
    ratio === 1
      ? { dot: 'bg-grounded', text: 'text-muted', label: 'complete' }
      : ratio === 0
        ? { dot: 'bg-ungrounded', text: 'text-ungrounded', label: 'none' }
        : ratio >= 0.5
          ? { dot: 'bg-grounded', text: 'text-muted', label: 'most' }
          : { dot: 'bg-stale', text: 'text-muted', label: 'sparse' };

  return (
    <div className="mt-3 flex items-center gap-2" data-coverage={tone.label}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />

      {/* A bar, not a percentage: the shape of the gap reads faster than a number. */}
      <span
        aria-hidden="true"
        className="h-1 w-20 overflow-hidden rounded-full bg-border-subtle"
      >
        <span
          className={`block h-full rounded-full ${ratio === 0 ? '' : tone.dot}`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </span>

      {/* The testid carries exactly the sentence, so the text can be asserted whole. */}
      <span data-testid="coverage" className={`text-xs ${tone.text}`}>
        {linesExplained} of {linesTotal} lines explained
      </span>
    </div>
  );
}
