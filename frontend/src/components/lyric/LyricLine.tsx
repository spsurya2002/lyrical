import type { LineView, Mode } from '../../types.js';

/**
 * ⚠️ THE ONLY COMPONENT THAT RENDERS LYRIC TEXT.
 *
 * R-001 (lyrics licensing) is a knowingly accepted risk. Keeping every lyric
 * character on screen inside this one component is what makes switching to
 * excerpt-only display a contained change rather than a page redesign. Do not
 * render lyric text anywhere else.
 */

interface Props {
  line: LineView;
  mode: Mode;
  isActive: boolean;
  onSelect: (lineNo: number) => void;
}

export function LyricLine({ line, mode, isActive, onSelect }: Props) {
  const explained = line.meaning !== null;
  const deva = mode === 'hi';

  return (
    <li>
      <button
        type="button"
        aria-current={isActive ? 'true' : undefined}
        onClick={() => onSelect(line.lineNo)}
        data-testid={`lyric-line-${line.lineNo}`}
        data-explained={explained}
        className={[
          'w-full rounded-md px-4 text-left transition-colors',
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
        <span>{line.text}</span>
        {!explained && (
          <span className="ml-3 align-middle text-xs text-faint">not explained yet</span>
        )}
      </button>
    </li>
  );
}
