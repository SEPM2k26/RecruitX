/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2d2d2d',
        muted: '#525252',
        paper: '#fdfbf7',
        'paper-muted': '#f4efe6',
        line: '#e5e0d8',
        brand: '#ff4d4d',
        'brand-dark': '#2d2d2d',
        'brand-soft': '#fff9c4',
        lime: '#fef08a',
        pencil: '#2d2d2d',
        'pencil-light': '#525252',
        'pencil-faint': '#8a8a8a',
        'pen-blue': '#2d5da1',
        postit: '#fff9c4',
        'postit-dark': '#fef08a',
        erased: '#e5e0d8',
        'highlighter-green': '#dcfce7',
        'highlighter-yellow': '#fef9c3',
        'highlighter-purple': '#f3e8ff',
      },
      fontFamily: {
        sans: ['Patrick Hand', 'cursive', 'sans-serif'],
        heading: ['Kalam', 'cursive', 'sans-serif'],
        hand: ['Patrick Hand', 'cursive', 'sans-serif'],
      },
      borderRadius: {
        'wobbly-sm': '180px 10px 160px 10px / 10px 160px 10px 180px',
        wobbly: '255px 15px 225px 15px / 15px 225px 15px 255px',
        'wobbly-lg': '300px 20px 280px 20px / 20px 280px 20px 300px',
      },
      boxShadow: {
        card: '4px 4px 0 0 #2d2d2d',
        'hand-xs': '1px 1px 0 0 #2d2d2d',
        'hand-sm': '2px 2px 0 0 #2d2d2d',
        hand: '4px 4px 0 0 #2d2d2d',
        'hand-hover': '6px 6px 0 0 #2d2d2d',
        'hand-lg': '8px 8px 0 0 #2d2d2d',
      },
    },
  },
  plugins: [],
};
