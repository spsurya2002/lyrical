import type { LineView, Mode } from '../../types.js';
import { GroundedMark } from '../grounding/GroundedMark.js';
import { NotifyMe } from '../grounding/NotifyMe.js';
import { SourceStrip } from '../grounding/SourceStrip.js';

interface Props {
  line: LineView | null;
  mode: Mode;
  lang: string;
  slug: string;
}

/**
 * The meaning panel — desktop.
 *
 * `meaning` and `ungrounded` are mutually exclusive in the API type, so there is
 * no branch here that can render a hedged half-answer. That is the point: the
 * product has two states, and so does this component.
 *
 * Visual detail of the ungrounded state is still provisional — artboards 3d–3f
 * (design_prompt_round2.md) will settle it. The behaviour below is what the spec
 * requires either way.
 */
export function MeaningPanel({ line, mode, lang, slug }: Props) {
  if (line === null) {
    return (
      <aside aria-label="Meaning" className="min-w-0">
        <p className="text-sm text-muted">Select a line to read what it means.</p>
      </aside>
    );
  }

  return (
    <aside aria-label="Meaning" data-testid="meaning-panel" className="min-w-0">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xs uppercase tracking-[0.14em] text-muted">
          Meaning · line {line.lineNo}
        </h2>
        {line.meaning !== null && (
          <GroundedMark sourceCount={line.meaning.sourceCount} status={line.meaning.status} />
        )}
      </div>

      <p
        lang={lang}
        className={`mb-5 text-lyric-sm text-primary ${mode === 'hi' ? 'font-lyric-deva leading-[1.65]' : 'font-lyric'}`}
      >
        “{line.text}”
      </p>

      {line.meaning !== null ? (
        <>
          <p
            lang={lang}
            data-testid="meaning-text"
            className={`max-w-measure text-body text-secondary ${mode === 'hi' ? 'font-lyric-deva leading-[1.8]' : 'font-lyric'}`}
          >
            {line.meaning.text}
          </p>
          {line.meaning.status === 'stale' && (
            <p className="mt-3 text-xs text-stale">
              New sources arrived. This stays readable until the new explanation lands.
            </p>
          )}
          <SourceStrip meaningId={line.meaning.meaningId} mode={mode} />
        </>
      ) : (
        <UngroundedNotice line={line} slug={slug} />
      )}
    </aside>
  );
}

function UngroundedNotice({ line, slug }: { line: LineView & { meaning: null }; slug: string }) {
  const { reason, sourceCount, sourcesRequired } = line.ungrounded;

  return (
    <div data-testid="ungrounded-state" className="max-w-measure">
      <p className="text-body text-ungrounded">
        {reason === 'mode_unavailable'
          ? 'This explanation is not available in this language yet.'
          : 'We don’t have enough grounded material for this line yet.'}
      </p>
      <p className="mt-2 text-sm text-muted">
        {reason === 'below_bar'
          ? `${sourceCount} sources · we need ${sourcesRequired}. We’d rather say nothing than make something up.`
          : reason === 'no_material'
            ? 'Nothing reliable has been written about this line that we can find.'
            : 'We’re preparing it. Nothing is lost.'}
      </p>
      {reason !== 'mode_unavailable' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-accent-edge px-3 py-2 text-sm text-accent transition-colors hover:border-accent hover:text-accent-hover"
          >
            Contribute a source
          </button>
          <NotifyMe slug={slug} />
        </div>
      )}
    </div>
  );
}
