/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lacivert: { 50: '#EEF2F9', 100: '#D5DEEE', 200: '#A9BADB', 400: '#4D6699', 600: '#1F3563', 800: '#14213D', 900: '#0B1426', 950: '#070D19' },
        nozul: { 50: '#FFF3EA', 100: '#FFDFC7', 300: '#FFA35C', 500: '#EA6A12', 600: '#C9560A', 700: '#9E4308' },
        zemin: '#F5F7FA',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Manrope"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
