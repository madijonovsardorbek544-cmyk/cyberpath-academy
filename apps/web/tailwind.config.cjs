/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        premium: '0 20px 60px rgba(15, 23, 42, 0.35)'
      },
      backgroundImage: {
        glow: 'radial-gradient(circle at top, rgba(56, 189, 248, 0.16), transparent 35%), radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.18), transparent 25%)'
      }
    }
  },
  plugins: []
};
