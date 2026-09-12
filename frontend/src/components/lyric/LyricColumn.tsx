import type { LineView, Mode, SelectableWord } from '../../types.js';
import { LyricLine } from './LyricLine.js';

interface Props {
  lines: LineView[];
  mode: Mode;
  lang: string;
  activeLineNo: number | null;
  selectedWordId: string | null;
  onSelect: (lineNo: number) => void;
  onSelectWord: (word: SelectableWord, lineNo: number) => void;
}

/**
 * The lyric column. Scrolls independently of the meaning panel so a reader can
 * move through the song without losing the explanation they are reading.
 *
 * Each line is a focusable row rather than a button, because selectable words
 * inside it are buttons and a button cannot legally contain another. Tab order
 * still runs line, then the words within it (FR-033).
 */
export function LyricColumn({
  lines,
  mode,
  lang,
  activeLineNo,
  selectedWordId,
  onSelect,
  onSelectWord,
}: Props) {
  return (
    <section aria-label="Lyrics" className="min-w-0">
      <h2 className="mb-4 text-xs uppercase tracking-[0.14em] text-muted">Lyric</h2>
      <ol lang={lang} className="space-y-1">
        {lines.map((line) => (
          <LyricLine
            key={line.lineNo}
            line={line}
            mode={mode}
            isActive={line.lineNo === activeLineNo}
            selectedWordId={selectedWordId}
            onSelect={onSelect}
            onSelectWord={onSelectWord}
          />
        ))}
      </ol>
    </section>
  );
}
