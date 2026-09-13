import type { UngroundedView } from '../../types.js';
import { NotifyMe } from './NotifyMe.js';

interface Props {
  ungrounded: UngroundedView;
  slug: string;
}

/**
 * What the product says when it does not know.
 *
 * This is not an error state. It is the visible proof of the product's central
 * promise — the thing that separates it from a chatbot that would have answered
 * anyway — so it is designed as a moment rather than a failure.
 *
 * Hence `--ungrounded`, which is deliberately a muted clay rather than an alarm
 * red: nothing is broken, and the reader has done nothing wrong. The one firm
 * sentence is the product's own reasoning, said plainly.
 */
export function UngroundedState({ ungrounded, slug }: Props) {
  const { reason, sourceCount, sourcesRequired } = ungrounded;

  // A missing translation is a different situation from missing knowledge: the
  // meaning exists and is grounded, it just is not in this language yet. Saying
  // "we don't have enough material" there would be untrue.
  if (reason === 'mode_unavailable') {
    return (
      <div data-testid="ungrounded-state" data-reason={reason} className="max-w-measure">
        <p className="text-body text-stale">Not available in this language yet.</p>
        <p className="mt-2 text-sm text-muted">
          We have this line’s meaning and we’re preparing it. Nothing is lost — try another
          language, or come back shortly.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="ungrounded-state" data-reason={reason} className="max-w-measure">
      <p className="text-body text-ungrounded">
        We don’t have enough grounded material for this line yet.
      </p>

      {reason === 'below_bar' ? (
        <>
          <p className="mt-3 flex items-baseline gap-2 font-mono text-sm text-muted">
            <span className="text-secondary">{sourceCount} sources</span>
            <span aria-hidden="true">·</span>
            <span>we need {sourcesRequired}</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            Two forum posts and a lyrics page can’t tell you what a line means. We’d rather say
            nothing than make something up.
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">
          Nothing reliable has been written about this line that we can find. We’d rather say
          nothing than make something up.
        </p>
      )}

      {/* Both paths out are offered: give us material, or wait for it. */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-accent-edge px-3 py-2 text-sm text-accent transition-colors hover:border-accent hover:text-accent-hover"
        >
          Contribute a source
        </button>
        <NotifyMe slug={slug} />
      </div>
    </div>
  );
}
