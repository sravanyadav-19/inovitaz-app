/** @type {import('tailwindcss').Config} */
//
// Inovitaz design tokens — Phase 0 of UX-AUDIT.md.
// Canon: color-system (tonal scales + semantic roles + AA), dark-mode-design
// (elevation by lightness, off-white text), typography-scale (1.25).
// Colors keep their old KEY names so pages compile untouched; the values
// (and therefore the look) are what changed.
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary (electric blue) — DEFAULT is a FILL: white text on it = 4.6:1 (AA).
        // For TEXT on dark surfaces use primary.dim (7.7:1). Never mix the roles.
        primary: {
          DEFAULT: '#2E6FE9',
          container: '#2458C9', // hover/pressed fill
          fixed: '#D8E4FF',     // text on light-blue surfaces
          dim: '#84A9FF',       // text/links on dark surfaces (AA)
        },
        // Secondary (circuit green) — desaturated ~15% vs old neon (dark-mode skill).
        secondary: {
          DEFAULT: '#2FBF63',
          container: '#1F9E50',
          fixed: '#0A3D21',
          dim: '#5EE38D',       // text-safe on dark (9:1)
        },
        // Surfaces — elevation = lighter, not shadow (dark-mode-design).
        surface: {
          lowest: '#0A0F1D',  // page background
          low: '#111A2E',     // cards
          DEFAULT: '#0D1526', // bands
          high: '#182338',    // inputs, modals
          highest: '#202D47', // dropdowns, tooltips
          bright: '#273754',
          variant: '#1C2941', // hairlines/dividers
        },
        // outline = secondary text (AA on cards, 5.6:1); outline.variant = borders.
        outline: {
          DEFAULT: '#97A3BC',
          variant: '#26334E',
        },
        // Semantic roles — DEFAULT = fill, fg = text/icon on dark.
        success: { DEFAULT: '#1FA35C', fg: '#3ED28B' },
        warning: { DEFAULT: '#B45309', fg: '#FBBF24' },
        danger:  { DEFAULT: '#DC2626', fg: '#F87171' },
        info:    { DEFAULT: '#0369A1', fg: '#38BDF8' },
        // Legacy compat keys, re-valued.
        gray: {
          50: '#202D47',
          100: '#182338',
          200: '#141D33',
          300: '#111A2E',
          800: '#C6CFDF',
          900: '#E8ECF4',
        },
        white: '#E8ECF4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hacker-grid': 'linear-gradient(to right, #26334E 1px, transparent 1px), linear-gradient(to bottom, #26334E 1px, transparent 1px)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
