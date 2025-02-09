// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
    'nuxt-gtag',
  ],
  i18n: {
    baseUrl: 'https://shouldispendtimeon.work',
    strategy: 'prefix_and_default',
    detectBrowserLanguage: {
      useCookie: false,
      redirectOn: 'root'
    },
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'en-US.json'
      },
      {
        code: 'ja',
        language: 'ja-JP',
        file: 'ja-JP.json'
      },
      {
        code: 'zh',
        language: 'zh-TW',
        file: 'zh-TW.json'
      }
    ],
    lazy: true,
    defaultLocale: 'en',
  },
  gtag: {
    id: 'G-E271J81V0J'
  },
  site: {
    url: 'https://shouldispendtimeon.work',
    name: 'Should I Spend Time On This?'
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  }
})
