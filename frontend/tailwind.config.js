/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Void Protocol Theme Defaults
        primary: {
          container: '#4d8eff',
          fixed: '#d8e2ff',
          dim: '#adc6ff',
          DEFAULT: '#3b82f6', // Electric Blue base
        },
        secondary: {
          container: '#00b954',
          fixed: '#6bff8f',
          dim: '#4ae176',
          DEFAULT: '#4ae176', // Neon Green tactical accents
        },
        surface: {
          lowest: '#070d1f',
          low: '#151b2d',
          DEFAULT: '#0c1324', // Infinity Background
          high: '#23293c',
          highest: '#2e3447',
          bright: '#33394c',
          variant: '#2e3447',
        },
        outline: {
          DEFAULT: '#8c909f',
          variant: '#424754'
        },
        // Fallbacks for existing standard color usage
        gray: {
          50: '#2e3447',
          100: '#23293c',
          200: '#191f31',
          300: '#151b2d',
          800: '#dce1fb',
          900: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hacker-grid': 'linear-gradient(to right, #424754 1px, transparent 1px), linear-gradient(to bottom, #424754 1px, transparent 1px)'
      }
    },
  },
  plugins: [],
};