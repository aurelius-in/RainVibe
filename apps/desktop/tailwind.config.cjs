/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/index.html',
    './src/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#FFFFFF',
      }
    },
  },
  plugins: [],
};

