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
    '@nuxtjs/leaflet',
    '@sentry/nuxt/module'
  ],

  i18n: {
    baseUrl: 'https://shoulditake.taxi',
    strategy: 'prefix_and_default',
    detectBrowserLanguage: {
      useCookie: false,
      redirectOn: 'root'
    },
    locales: [
      {
        code: 'en-hk',
        language: 'en-HK',
        file: 'en-HK.json'
      },
      {
        code: 'zh-hk',
        language: 'zh-HK',
        file: 'zh-HK.json'
      }
    ],
    lazy: true,
    defaultLocale: 'en-hk',
  },

  gtag: {
    id: 'G-7JBFREKBB0'
  },

  site: {
    url: 'https://shoulditake.taxi',
    name: 'Should I Take Taxi?',
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },

        { rel: 'preconnect', href: 'https://geodata.gov.hk', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://www.geodetic.gov.hk', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://router.project-osrm.org', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://nominatim.openstreetmap.org', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://a.basemaps.cartocdn.com' },
        { rel: 'preconnect', href: 'https://b.basemaps.cartocdn.com' },
        { rel: 'preconnect', href: 'https://c.basemaps.cartocdn.com' },
      ]
    }
  },

  sentry: {
    sourceMapsUploadOptions: {
      org: 'williamchong',
      project: 'should-i-take-taxi'
    }
  },

  sourcemap: {
    client: 'hidden'
  }
})
