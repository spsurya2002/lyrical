import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LyricColumn } from '../components/lyric/LyricColumn.js';
import { MeaningPanel } from '../components/meaning/MeaningPanel.js';
import { GroundedMark } from '../components/grounding/GroundedMark.js';
import { FixtureBanner } from '../components/FixtureBanner.js';
import { useSongPage } from '../hooks/useSongPage.js';
import type { Mode } from '../types.js';

/**
 * THE MAIN SCREEN. Three zones, per docs/design_system.md §6:
 * header · lyric column + meaning panel · song summary.
 *
 * The language switch lands in Phase 4 (US2); mode is fixed to English here so
 * the MVP is one story, demonstrable on its own.
 */
export function SongPage() {
  const { slug = '' } = useParams();
  // State rather than a constant: Phase 4 (US2) replaces the initial value with
  // the segmented mode switch, and everything below already reads from here.
  const [mode] = useState<Mode>('en');
  const state = useSongPage(slug, mode);
  const [activeLineNo, setActiveLineNo] = useState<number | null>(null);

  // The page opens on the first SERVABLE line, not line 1 — landing on an empty
  // panel wastes the only thing the page has to offer.
  //
  // When NOTHING is servable, fall back to the first line so its ungrounded
  // state is visible immediately. FR-022 requires the page to say plainly that
  // it lacks material; making the user click a line to discover that is a
  // quieter form of not saying it.
  useEffect(() => {
    if (state.status !== 'ready') return;
    setActiveLineNo(state.page.activeLineNo ?? state.page.lines[0]?.lineNo ?? null);
  }, [state]);

  if (state.status === 'loading') {
    return <Shell>{null}</Shell>;
  }

  if (state.status === 'missing') {
    return (
      <Shell>
        <p className="text-body text-secondary">We don’t have that song.</p>
      </Shell>
    );
  }

  if (state.status === 'error') {
    return (
      <Shell>
        <p className="text-body text-ungrounded">Something went wrong: {state.message}</p>
      </Shell>
    );
  }

  const { page } = state;
  const activeLine = page.lines.find((l) => l.lineNo === activeLineNo) ?? null;
  const { linesExplained, linesTotal } = page.coverage;

  return (
    <Shell>
      <FixtureBanner />
      <header className="border-b border-border-subtle pb-6">
        <h1
          lang={page.lang}
          className={`text-display ${mode === 'hi' ? 'font-lyric-deva' : 'font-lyric'} text-primary`}
        >
          {page.song.title}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>{page.song.artist}</span>
          {page.song.year !== null && <span>· {page.song.year}</span>}
          {page.song.film !== null && <span>· {page.song.film}</span>}
        </p>
        {/* FR-026: a sparsely covered song must not look like a complete one. */}
        <p data-testid="coverage" className="mt-3 text-xs text-muted">
          {linesExplained} of {linesTotal} lines explained
        </p>
      </header>

      <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <LyricColumn
          lines={page.lines}
          mode={mode}
          lang={page.lang}
          activeLineNo={activeLineNo}
          onSelect={setActiveLineNo}
        />
        <MeaningPanel line={activeLine} mode={mode} lang={page.lang} />
      </div>

      <section
        aria-label="What the song means"
        className="border-t border-border-subtle py-8"
      >
        <h2 className="mb-4 flex items-baseline justify-between gap-4 text-xs uppercase tracking-[0.14em] text-muted">
          <span>What the song means</span>
          {page.summary !== null && (
            <GroundedMark sourceCount={page.summary.sourceCount} status={page.summary.status} />
          )}
        </h2>
        {page.summary !== null ? (
          <p
            lang={page.lang}
            data-testid="song-summary"
            className={`max-w-measure text-lg text-secondary ${mode === 'hi' ? 'font-lyric-deva leading-[1.8]' : 'font-lyric'}`}
          >
            {page.summary.text}
          </p>
        ) : (
          <p data-testid="summary-ungrounded" className="max-w-measure text-body text-ungrounded">
            We don’t have enough grounded material to say what this song means as a whole.
          </p>
        )}
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6">{children}</main>;
}
