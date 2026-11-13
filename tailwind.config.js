/*
 * Fieldwork theme — semantic tokens exposed to Tailwind.
 * Every colour resolves to a CSS variable so the Paper (:root) and Ink
 * (.dark) themes switch without any `dark:` variant in component code.
 */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        /*
         * Height-based density tiers. `compact` and `short` are max-height
         * queries emitted after the base utilities (and short after compact),
         * so later tiers win when both match.
         */
        compact: { raw: '(max-height: 999px)' },
        short: { raw: '(max-height: 759px)' },
      },
      colors: {
        paper: 'var(--c-paper)',
        panel: 'var(--c-panel)',
        surface: 'var(--c-surface)',
        subtle: 'var(--c-subtle)',
        line: 'var(--c-line)',
        control: 'var(--c-control)',
        ink: 'var(--c-ink)',
        muted: 'var(--c-muted)',
        signal: 'var(--c-signal)',
        'signal-soft': 'var(--c-signal-soft)',
        'signal-edge': 'var(--c-signal-edge)',
        'signal-text': 'var(--c-signal-text)',
        'on-signal': 'var(--c-on-signal)',
        danger: 'var(--c-danger)',
        warning: 'var(--c-warning)',
        success: 'var(--c-success)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      transitionTimingFunction: {
        fieldwork: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
