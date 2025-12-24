/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // ENDS column urgency colors (dynamically generated)
    'text-red-500',
    'text-orange-400',
    'text-yellow-500',
    'text-green-500',
  ],
  theme: {
    extend: {
      colors: {
        // DexScreener-inspired dark theme
        background: '#0d0e14',
        surface: '#13141b',
        'surface-hover': '#1a1b23',
        border: '#1e2029',
        'border-light': '#2a2b35',

        // Text colors
        'text-primary': '#ffffff',
        'text-secondary': '#6b7280',
        'text-muted': '#4b5563',

        // Accent colors
        accent: '#00d4aa',
        'accent-hover': '#00e6b8',

        // Status colors
        positive: '#22c55e',
        'positive-bg': 'rgba(34, 197, 94, 0.1)',
        negative: '#ef4444',
        'negative-bg': 'rgba(239, 68, 68, 0.1)',

        // Platform colors
        polymarket: '#0066FF',
        'polymarket-bg': 'rgba(0, 102, 255, 0.15)',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
