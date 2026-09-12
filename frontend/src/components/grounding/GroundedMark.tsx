interface Props {
  sourceCount: number;
  status: 'active' | 'stale';
}

/**
 * The grounded mark. Quiet, and always present on anything the product asserts.
 *
 * Colour never carries the meaning alone — the dot is always paired with text,
 * so it reads the same to someone who cannot distinguish the hues.
 */
export function GroundedMark({ sourceCount, status }: Props) {
  const stale = status === 'stale';
  return (
    <span
      data-testid="grounded-mark"
      className="inline-flex items-center gap-2 text-xs text-muted"
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${stale ? 'bg-stale' : 'bg-grounded'}`}
      />
      {stale ? (
        <span>
          updating · {sourceCount} sources
        </span>
      ) : (
        <span>grounded · {sourceCount} sources</span>
      )}
    </span>
  );
}
