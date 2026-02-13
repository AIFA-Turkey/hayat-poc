/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        foreground: 'var(--color-text)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'sans-serif'],
        modern: ['var(--font-modern)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
