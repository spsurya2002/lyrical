import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LyricColumn } from '../components/lyric/LyricColumn.js';
import { MeaningPanel } from '../components/meaning/MeaningPanel.js';
import { MeaningSheet } from '../components/meaning/MeaningSheet.js';
import { WordGloss } from '../components/meaning/WordGloss.js';
import { CoverageIndicator } from '../components/grounding/CoverageIndicator.js';
import { GroundedMark } from '../components/grounding/GroundedMark.js';
import { FixtureBanner } from '../components/FixtureBanner.js';
import { ModeSwitch } from '../components/language/ModeSwitch.js';
import { ChatbotEntry } from '../components/plan/ChatbotEntry.js';
import { QuotaMeter } from '../components/plan/QuotaMeter.js';
import { useIsNarrow } from '../hooks/useIsNarrow.js';
import { useLanguageMode } from '../hooks/useLanguageMode.js';
import { useSongPage } from '../hooks/useSongPage.js';

/**
 * THE MAIN SCREEN. Three zones, per docs/design_system.md §6:
 * header · lyric column + meaning panel · song summary.
 *
 * The panel shows one thing at a time: a line's meaning, a word's meaning, or
 * an honest statement that neither is grounded. There is deliberately no state
 * in which it shows two, and none in which it shows half of one.
 */
export function SongPage() {
  const { slug = '' } = useParams();
  const [mode, setMode] = useLanguageMode();
  const state = useSongPage(slug, mode);
  const [activeLineNo, setActiveLineNo] = useState<number | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const narrow = useIsNarrow();
  const positionedFor = useRef<string | null>(null);

  // The page opens on the first SERVABLE line, not line 1 — landing on an empty
  // panel wastes the only thing the page has to offer.
  //
  // When NOTHING is servable, fall back to the first line so its ungrounded
  // state is visible immediately. FR-022 requires the page to say plainly that
  // it lacks material; making the user click a line to discover that is a
  // quieter form of not saying it.
  useEffect(() => {
    if (state.status !== 'ready') return;
    // Position once per SONG, not per render. Re-running on a mode change would
    // throw the reader back to the opening line, and FR-013 requires the active
    // line and scroll position to survive a switch.
    if (positionedFor.current === slug) return;
    positionedFor.current = slug;
    setActiveLineNo(state.page.activeLineNo ?? state.page.lines[0]?.lineNo ?? null);
    // On a phone the sheet stays shut until the reader taps — opening it on
    // arrival would cover the song before they had seen it.
    //
    // The exception is a song with NOTHING grounded. There, FR-022 requires the
    // page to say plainly that it lacks material, and there is no reading
    // experience to interrupt. Leaving that behind a tap would be the same
    // quiet evasion the desktop panel already had.
    setSheetOpen(state.page.activeLineNo === null);
  }, [state, slug]);

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

  const meaningContent =
    selectedWordId === null ? (
      <MeaningPanel line={activeLine} mode={mode} lang={page.lang} slug={slug} />
    ) : (
      <WordGloss
        slug={slug}
        occurrenceId={selectedWordId}
        mode={mode}
        lang={page.lang}
        onDismiss={() => setSelectedWordId(null)}
      />
    );

  return (
    <Shell>
      <FixtureBanner />
      <header className="border-b border-border-subtle pb-6">
        <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
          {/* Pro and signed-out viewers get no meter — there is nothing to count. */}
          {page.viewer !== null && page.viewer.quota !== null && (
            <QuotaMeter
              remaining={page.viewer.quota.remaining}
              limit={page.viewer.quota.limit}
            />
          )}
          <ModeSwitch mode={mode} onChange={setMode} />
        </div>
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
        <CoverageIndicator linesExplained={linesExplained} linesTotal={linesTotal} />
      </header>

      <div
        className={[
          'grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]',
          // The open sheet covers the bottom of the screen. Without room to
          // scroll past it, the lyric lines underneath cannot be reached at all.
          narrow && sheetOpen ? 'pb-[56vh]' : '',
        ].join(' ')}
      >
        <LyricColumn
          lines={page.lines}
          mode={mode}
          lang={page.lang}
          activeLineNo={activeLineNo}
          selectedWordId={selectedWordId}
          onSelect={(lineNo) => {
            setActiveLineNo(lineNo);
            // Selecting a line clears a word: the panel shows one thing at a time.
            setSelectedWordId(null);
            setSheetOpen(true);
          }}
          onSelectWord={(word, lineNo) => {
            setActiveLineNo(lineNo);
            setSelectedWordId(word.occurrenceId);
            setSheetOpen(true);
          }}
        />
        {/* Panel or sheet, never both — see useIsNarrow. */}
        {!narrow && (
          <div className="min-w-0">
            {meaningContent}
            <ChatbotEntry
              available={page.viewer?.chatbotAvailable ?? false}
              signedIn={page.viewer !== null}
            />
          </div>
        )}
      </div>

      {narrow && (
        <ChatbotEntry
          available={page.viewer?.chatbotAvailable ?? false}
          signedIn={page.viewer !== null}
        />
      )}

      {narrow && (
        <MeaningSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
          {meaningContent}
        </MeaningSheet>
      )}

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
