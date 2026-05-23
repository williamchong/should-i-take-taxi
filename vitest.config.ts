import { defineVitestConfig } from '@nuxt/test-utils/config'

// Uses Nuxt's resolved Vite config (aliases like ~ and @ → app/, ~~ and @@ → root)
// so we never hardcode srcDir paths here. defineVitestConfig sets up two projects:
// a Nuxt-env one for *.nuxt.test.ts (none yet) and a default one. We leave `include`
// unset so our tests/**/*.test.ts files run once in happy-dom — setting it here would
// leak into the Nuxt project and double-run every test.
export default defineVitestConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
  },
})
