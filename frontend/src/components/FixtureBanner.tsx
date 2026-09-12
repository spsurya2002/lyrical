/**
 * Development-only warning that the content on screen is seed data.
 *
 * The seed file has carried this warning since it was written, but a warning in
 * a source file is invisible to the person actually looking at the page — which
 * is exactly who needs it. Lyrics and meanings in the fixtures are placeholders
 * that exercise code paths; real ones arrive through the research pipeline.
 *
 * Driven by the dev flag rather than by the data. That is a proxy, and it stops
 * being accurate the moment development runs against real content — at which
 * point this should read a flag on the song itself.
 */
export function FixtureBanner() {
  if (!import.meta.env.DEV) return null;

  return (
    <div
      role="note"
      data-testid="fixture-banner"
      className="mb-6 rounded-md border border-stale/40 bg-stale/10 px-4 py-2 text-xs text-stale"
    >
      <strong className="font-semibold">Seed data.</strong> These lyrics and meanings are
      placeholders for testing, not real transcriptions or explanations.
    </div>
  );
}
