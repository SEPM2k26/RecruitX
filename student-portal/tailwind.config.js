/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#202c27',
        muted: '#76817b',
        paper: '#f6f7f3',
        line: '#e8ebe5',
        brand: '#2f6d57',
        'brand-dark': '#21523f',
        'brand-soft': '#e9f2ec',
        lime: '#d8f27a',
      },
      boxShadow: { card: '0 8px 24px rgba(32,44,39,.045)' },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
