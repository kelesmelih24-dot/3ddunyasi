/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Nötr tonlar + logodaki lacivert (metin rengi)
        lacivert: { 50: '#F7F5F2', 100: '#EDEAE5', 200: '#DCD8D1', 400: '#6B7080', 600: '#35415C', 800: '#13254A', 900: '#0D1A35', 950: '#080F1E' },
        // Marka turuncusu
        nozul: { 50: '#FFF5ED', 100: '#FFE6D2', 300: '#FFA15C', 500: '#E8620C', 600: '#C95209', 700: '#9C3F07' },
        zemin: '#FFFFFF',
        krem: '#FBF7F3',
      },
      fontFamily: {
        display: ['"Unbounded"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: { etiket: '0.14em' },
    },
  },
  plugins: [],
};
