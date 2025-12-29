import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
