import { useEffect, useState } from 'react';
import type { Mode } from '../../types.js';
import { GroundedMark } from '../grounding/GroundedMark.js';
import { SourceStrip } from '../grounding/SourceStrip.js';

interface WordMeaning {
  occurrenceId: string;
  surface: string;
  lineNo: number;
  meaning: { meaningId: string; text: string; sourceCount: number };
  otherOccurrences: Array<{ occurrenceId: string; lineNo: number; differs: boolean }>;
  hasDivergentUses: boolean;
}

interface Props {
  slug: string;
  occurrenceId: string;
  mode: Mode;
  lang: string;
  onDismiss: () => void;
}

/**
 * One word's meaning, as used in this song.
 *
 * Rendered in the meaning panel, never a tooltip: these are paragraphs, and a
 * tooltip cannot hold one or be read on a touch screen.
 *
 * When the same word means something else elsewhere in the song, that is stated
 * plainly. It is the detail nobody can get anywhere else, and the reason word
 * identity is modelled per occurrence rather than per spelling.
 */
export function WordGloss({ slug, occurrenceId, mode, lang, onDismiss }: Props) {
  const [word, setWord] = useState<WordMeaning | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    fetch(`/api/songs/${encodeURIComponent(slug)}/words/${occurrenceId}?mode=${mode}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: WordMeaning) => {
        if (!cancelled) setWord(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, occurrenceId, mode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  if (failed) {
    return (
      <div data-testid="word-gloss" className="max-w-measure">
        <p className="text-body text-ungrounded">
          We don’t have a grounded reading for that word in this song yet.
        </p>
      </div>
    );
  }

  if (word === null) return null;

  const divergent = word.otherOccurrences.filter((o) => o.differs);

  return (
    <div data-testid="word-gloss" className="max-w-measure">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xs uppercase tracking-[0.14em] text-muted">
          Word · line {word.lineNo}
        </h2>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-muted transition-colors hover:text-primary"
        >
          Back to the line
        </button>
      </div>

      <p
        lang={lang}
        className={`mb-4 text-lyric text-primary ${mode === 'hi' ? 'font-lyric-deva leading-[1.65]' : 'font-lyric'}`}
      >
        {word.surface}
      </p>

      <div className="mb-3">
        <GroundedMark sourceCount={word.meaning.sourceCount} status="active" />
      </div>

      <p
        lang={lang}
        data-testid="word-meaning-text"
        className={`text-body text-secondary ${mode === 'hi' ? 'font-lyric-deva leading-[1.8]' : 'font-lyric'}`}
      >
        {word.meaning.text}
      </p>

      {word.hasDivergentUses && (
        <p data-testid="divergent-uses" className="mt-4 text-sm text-stale">
          This word appears again in this song meaning something different —{' '}
          {divergent.length === 1
            ? `see line ${divergent[0]?.lineNo}.`
            : `see lines ${divergent.map((o) => o.lineNo).join(', ')}.`}
        </p>
      )}

      <SourceStrip meaningId={word.meaning.meaningId} mode={mode} />
    </div>
  );
}
