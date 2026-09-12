import type { Mode } from '../../types.js';

/**
 * The language switch. Three modes, no fourth.
 *
 * Each label is written in its own language: a Hindi reader should recognise
 * their option without reading English to find it.
 *
 * Switching is instant and costs nothing — all three renderings are already
 * stored, so this is a rendering change, never a regeneration (FR-015).
 */

const OPTIONS: ReadonlyArray<{ mode: Mode; label: string; lang: string; title: string }> = [
  { mode: 'en', label: 'English', lang: 'en', title: 'Word and meaning in English' },
  { mode: 'hi', label: 'हिंदी', lang: 'hi', title: 'Devanagari script, meaning in Hindi' },
  { mode: 'hi-Latn', label: 'Hinglish', lang: 'en', title: 'Hindi meaning, English letters' },
];

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeSwitch({ mode, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Language"
      data-testid="mode-switch"
      className="inline-flex items-center gap-1 rounded-full border border-border-default bg-surface p-1"
    >
      {OPTIONS.map((option) => {
        const selected = option.mode === mode;
        return (
          <button
            key={option.mode}
            type="button"
            lang={option.lang}
            title={option.title}
            aria-pressed={selected}
            data-testid={`mode-${option.mode}`}
            onClick={() => onChange(option.mode)}
            className={[
              'rounded-full px-4 py-1.5 text-sm transition-colors',
              option.mode === 'hi' ? 'font-ui-deva' : 'font-ui',
              selected
                ? 'bg-accent-wash text-accent'
                : 'text-muted hover:text-primary',
            ].join(' ')}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
