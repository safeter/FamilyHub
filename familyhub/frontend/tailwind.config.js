/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F8EF7',
        secondary: '#F7724F',
        surface: '#1e293b',
        base: '#0f172a',
      },
    },
  },
  plugins: [],
}
