import { useEffect, useState } from 'react';
import type { Mode, SourceView } from '../../types.js';

interface Props {
  meaningId: string;
  mode: Mode;
}

/**
 * The source strip — the product's signature element.
 *
 * This is what separates LyricSense from asking a chatbot, so it is a designed
 * part of every explanation rather than a footnote. Clicking a source opens the
 * excerpt that was actually used to build the meaning.
 *
 * Two states that look like edge cases and are not:
 *   · a source whose page has died is still listed, marked — it still counts
 *   · a source whose excerpt cannot be rendered (Urdu script, the normal case
 *     for these songs) is still listed and attributed, with its text withheld
 */
export function SourceStrip({ meaningId, mode }: Props) {
  const [sources, setSources] = useState<SourceView[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSources(null);
    setOpen(null);
    fetch(`/api/meanings/${meaningId}/sources?mode=${mode}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { sources: SourceView[] }) => {
        if (!cancelled) setSources(data.sources);
      })
      .catch(() => {
        if (!cancelled) setSources([]);
      });
    return () => {
      cancelled = true;
    };
  }, [meaningId, mode]);

  if (sources === null) return null;

  return (
    <div data-testid="source-strip" className="mt-6 border-t border-border-subtle pt-4">
      <h3 className="mb-3 text-xs uppercase tracking-[0.14em] text-muted">Sources</h3>
      <ul className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <li key={source.url}>
            <button
              type="button"
              onClick={() => setOpen(open === source.url ? null : source.url)}
              className="rounded-sm border border-border-default px-3 py-1.5 text-xs text-secondary transition-colors hover:border-border-strong hover:text-primary"
            >
              <span>{source.domain}</span>
              <span className="ml-2 text-faint">{source.type}</span>
              {!source.reachable && <span className="ml-2 text-stale">link gone</span>}
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <blockquote className="mt-3 max-w-measure border-l-2 border-accent-edge bg-inset px-4 py-3 text-sm text-secondary">
          {(() => {
            const source = sources.find((s) => s.url === open);
            if (source === undefined) return null;
            if (source.excerptWithheld) {
              return (
                <span className="text-muted">
                  This source is in a script we do not display. It still counts toward the
                  explanation — open it at {source.domain} to read it there.
                </span>
              );
            }
            return source.excerpt;
          })()}
        </blockquote>
      )}
    </div>
  );
}
