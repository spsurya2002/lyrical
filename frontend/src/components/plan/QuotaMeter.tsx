interface Props {
  remaining: number;
  limit: number;
}

/**
 * Remaining monthly research allowance (FR-027).
 *
 * Neutral until one is left, then `--stale`. NEVER red: running out of a free
 * allowance is not an error and not a fault. The tone is informative, and the
 * point is that the limit is never a surprise at the moment of refusal.
 *
 * Reading an already-explained song costs nothing, so this number does not move
 * on this page at all (FR-028). It is here so the reader knows where they stand
 * before they ask for something new.
 */
export function QuotaMeter({ remaining, limit }: Props) {
  const used = Math.max(0, limit - remaining);
  const last = remaining <= 1;

  return (
    <div
      data-testid="quota-meter"
      data-remaining={remaining}
      className="inline-flex items-center gap-3 rounded-full border border-border-default px-3 py-1.5"
      title={`${remaining} of ${limit} new songs left this month`}
    >
      <span aria-hidden="true" className="flex gap-1">
        {Array.from({ length: limit }, (_, i) => (
          <span
            key={i}
            className={[
              'h-1 w-4 rounded-full',
              i < used ? 'bg-border-strong' : last ? 'bg-stale' : 'bg-accent',
            ].join(' ')}
          />
        ))}
      </span>
      <span className={`font-mono text-xs ${last ? 'text-stale' : 'text-muted'}`}>
        {remaining} of {limit} new songs left
      </span>
    </div>
  );
}
