/**
 * Tailwind consumes the CSS custom properties defined in src/styles/tokens.css.
 * No hex value may appear here or in any component — tokens.css is the only
 * place colour is defined.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        inset: 'var(--bg-inset)',
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-strong': 'var(--border-strong)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        faint: 'var(--text-faint)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-press': 'var(--accent-press)',
        'accent-wash': 'var(--accent-wash)',
        'accent-edge': 'var(--accent-edge)',
        grounded: 'var(--grounded)',
        stale: 'var(--stale)',
        ungrounded: 'var(--ungrounded)',
        info: 'var(--info)',
      },
      fontFamily: {
        lyric: 'var(--font-lyric)',
        'lyric-deva': 'var(--font-lyric-deva)',
        ui: 'var(--font-ui)',
        'ui-deva': 'var(--font-ui-deva)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        display: ['44px', { lineHeight: '1.15' }],
        lyric: ['28px', { lineHeight: '1.55' }],
        'lyric-sm': ['21px', { lineHeight: '1.6' }],
        lg: ['18px', { lineHeight: '1.65' }],
        body: ['16px', { lineHeight: '1.7' }],
        sm: ['14px', { lineHeight: '1.6' }],
        xs: ['12.5px', { lineHeight: '1.5' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        float: 'var(--shadow-float)',
      },
      maxWidth: {
        // Reading measure: 62-70 characters. Explanations never run full-bleed.
        measure: '34rem',
      },
    },
  },
  plugins: [],
};
