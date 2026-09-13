/**
 * Marks a feature as Pro-only.
 *
 * The feature stays VISIBLE and gated rather than hidden, so a Basic reader can
 * see what they would get (FR-029). Hiding it would make the product feel
 * smaller than it is and give them nothing to decide about.
 *
 * This is presentation only. The server refuses the request independently — see
 * `api/routes/chat.ts`. Hiding a control has never been a security boundary.
 */
export function ProBadge() {
  return (
    <span
      data-testid="pro-badge"
      className="rounded-full border border-accent-edge px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-accent"
    >
      Pro
    </span>
  );
}
