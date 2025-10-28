/** @type {import('tailwindcss').Config} */
const colors = require('./src/config/colors').tailwindColors;

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8b5cf6',
          hover: '#a78bfa',
          dark: '#581c87',
        },
        accent: '#c084fc',
        background: '#18181b',
        card: '#23233a',
        text: {
          light: '#f3f4f6',
          muted: '#a1a1aa',
        },
        // Keep grays for borders and subtle elements, but map to our palette
        gray: {
          400: '#a1a1aa',  // text-muted
          500: '#71717a',  // slightly darker
          600: '#52525b',  // borders
          700: '#3f3f46',  // darker borders/cards
          800: '#23233a',  // card color
          900: '#18181b',  // background
        },
      },
      backgroundColor: {
        DEFAULT: '#18181b',
      },
    },
  },
  plugins: [],
}