import type { LineView, Mode, SelectableWord } from '../../types.js';

/**
 * ⚠️ THE ONLY COMPONENT THAT RENDERS LYRIC TEXT.
 *
 * R-001 (lyrics licensing) is a knowingly accepted risk. Keeping every lyric
 * character on screen inside this one component is what makes switching to
 * excerpt-only display a contained change rather than a page redesign. Do not
 * render lyric text anywhere else.
 *
 * The line is a focusable row rather than a <button>, because selectable words
 * inside it are buttons and a button cannot legally contain another. The row
 * still behaves like one: tab to it, Enter or Space selects it.
 */

interface Props {
  line: LineView;
  mode: Mode;
  isActive: boolean;
  selectedWordId: string | null;
  onSelect: (lineNo: number) => void;
  onSelectWord: (word: SelectableWord, lineNo: number) => void;
}

export function LyricLine({
  line,
  mode,
  isActive,
  selectedWordId,
  onSelect,
  onSelectWord,
}: Props) {
  const explained = line.meaning !== null;
  const deva = mode === 'hi';

  // Word positions are indexes into the whitespace-split line, which is how the
  // occurrences were recorded.
  const tokens = line.text.split(/(\s+)/);
  const byPosition = new Map<number, SelectableWord>();
  for (const word of line.words) byPosition.set(word.position, word);

  let wordIndex = -1;

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        aria-current={isActive ? 'true' : undefined}
        onClick={() => onSelect(line.lineNo)}
        onKeyDown={(event) => {
          // Only keys pressed on the ROW itself. A word button inside handles
          // its own Enter, and the same keydown bubbles here — so without this
          // check, selecting a word by keyboard immediately deselected it
          // again. Pointer users never saw it: the word's click handler stops
          // propagation, but keydown has no such guard.
          if (event.target !== event.currentTarget) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(line.lineNo);
          }
        }}
        data-testid={`lyric-line-${line.lineNo}`}
        data-explained={explained}
        className={[
          'w-full cursor-pointer rounded-md px-4 text-left transition-colors',
          // 44px touch targets come from padding, never from smaller text (FR-032).
          'py-3',
          deva ? 'font-lyric-deva leading-[1.65]' : 'font-lyric leading-[1.55]',
          'text-lyric-sm',
          isActive
            ? 'border-l-2 border-accent bg-surface text-primary'
            : 'border-l-2 border-transparent',
          // An unexplained line is quiet, not alarming. It is not an error.
          explained ? 'text-primary hover:bg-surface/60' : 'text-muted hover:bg-surface/40',
        ].join(' ')}
      >
        <span>
          {tokens.map((token, i) => {
            if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
            wordIndex += 1;
            const word = byPosition.get(wordIndex);
            if (word === undefined) {
              // No stored meaning here, so it is not offered as selectable (FR-020).
              return <span key={i}>{token}</span>;
            }
            const selected = word.occurrenceId === selectedWordId;
            return (
              <button
                key={i}
                type="button"
                data-testid={`word-${word.occurrenceId}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectWord(word, line.lineNo);
                }}
                className={[
                  // Padding, not smaller text, is what makes the target hittable.
                  '-my-1 rounded-sm px-1 py-1 transition-colors',
                  // A dotted underline is an invitation, not a link.
                  'underline decoration-border-strong decoration-dotted underline-offset-4',
                  selected
                    ? 'bg-accent-wash text-accent decoration-accent'
                    : 'hover:bg-accent-wash hover:text-accent',
                ].join(' ')}
              >
                {token}
              </button>
            );
          })}
        </span>
        {!explained && (
          <span className="ml-3 align-middle text-xs text-faint">not explained yet</span>
        )}
      </div>
    </li>
  );
}
