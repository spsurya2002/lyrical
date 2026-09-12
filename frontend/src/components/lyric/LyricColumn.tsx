import type { LineView, Mode } from '../../types.js';
import { LyricLine } from './LyricLine.js';

interface Props {
  lines: LineView[];
  mode: Mode;
  lang: string;
  activeLineNo: number | null;
  onSelect: (lineNo: number) => void;
}

/**
 * The lyric column. Scrolls independently of the meaning panel so a reader can
 * move through the song without losing the explanation they are reading.
 *
 * A list of buttons rather than divs, so the whole song is keyboard navigable
 * with no extra work (FR-033).
 */
export function LyricColumn({ lines, mode, lang, activeLineNo, onSelect }: Props) {
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
            onSelect={onSelect}
          />
        ))}
      </ol>
    </section>
  );
}
