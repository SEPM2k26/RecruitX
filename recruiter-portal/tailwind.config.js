/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#fdfbf7',
        'paper-light': '#ffffff',
        'paper-dark': '#f4efe6',
        pencil: '#2d2d2d',
        'pencil-light': '#555555',
        'pencil-faint': '#888888',
        erased: '#e5e0d8',
        'erased-dark': '#d4cdc2',
        'marker-red': '#ff4d4d',
        'marker-red-hover': '#e03e3e',
        'pen-blue': '#2d5da1',
        'pen-blue-hover': '#244b82',
        postit: '#fff9c4',
        'postit-dark': '#fef08a',
        'highlighter-green': '#dcfce7',
        'highlighter-yellow': '#fef9c3',
        'highlighter-purple': '#f3e8ff',
      },
      fontFamily: {
        heading: ['"Kalam"', 'cursive', 'sans-serif'],
        hand: ['"Patrick Hand"', 'cursive', 'sans-serif'],
      },
      borderRadius: {
        'wobbly-sm': '180px 10px 160px 10px / 10px 160px 10px 180px',
        wobbly: '255px 15px 225px 15px / 15px 225px 15px 255px',
        'wobbly-md': '225px 15px 255px 15px / 15px 255px 15px 225px',
        'wobbly-lg': '300px 20px 280px 20px / 20px 280px 20px 300px',
        'wobbly-oval': '50% 50% 50% 50% / 60% 60% 40% 40%',
      },
      boxShadow: {
        'hand-xs': '1px 1px 0px 0px #2d2d2d',
        'hand-sm': '2px 2px 0px 0px #2d2d2d',
        hand: '4px 4px 0px 0px #2d2d2d',
        'hand-hover': '6px 6px 0px 0px #2d2d2d',
        'hand-lg': '8px 8px 0px 0px #2d2d2d',
        'hand-flat': '0px 0px 0px 0px #2d2d2d',
        'hand-red': '4px 4px 0px 0px #ff4d4d',
        'hand-blue': '4px 4px 0px 0px #2d5da1',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
