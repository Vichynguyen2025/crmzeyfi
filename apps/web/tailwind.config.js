/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4f46e5', 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#4f46e5', 600: '#4338ca' },
        surface: '#f8fafc', ink: '#171717', muted: '#6b7280', faint: '#9ca3af', border: '#e6e9f2',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      fontSize: {
        'table-header': ['var(--font-table-header)', { lineHeight: '20px', fontWeight: '600' }],
        'table-sub': ['var(--font-table-sub)', { lineHeight: '18px', fontWeight: '500' }],
        'table-body': ['var(--font-table-body)', { lineHeight: '20px' }],
      },
      borderRadius: {
        'design-sm': 'var(--radius-sm)',
        'design-md': 'var(--radius-md)',
        'design-lg': 'var(--radius-lg)',
        'design-xl': 'var(--radius-xl)',
      },
      boxShadow: {
        'design-card': 'var(--shadow-card)',
        'design-elevated': 'var(--shadow-elevated)',
        'design-modal': 'var(--shadow-modal)',
      },
    },
  },
  plugins: [],
};