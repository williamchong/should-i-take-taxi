// https://nuxt.com/docs/api/configuration/nuxt-config
import { generateSitemapUrls } from './config/sitemap-routes'

const siteUrl = 'https://shoulditake.taxi'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: process.env.NODE_ENV === 'development' },

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
    baseUrl: siteUrl,
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
      },
      {
        code: 'zh-tw',
        language: 'zh-TW',
        file: 'zh-TW.json'
      },
      {
        code: 'zh-cn',
        language: 'zh-CN',
        file: 'zh-CN.json'
      }
    ],
    lazy: true,
    defaultLocale: 'en-hk',
  },

  gtag: {
    id: 'G-7JBFREKBB0'
  },

  site: {
    url: siteUrl,
    name: 'Hong Kong Taxi Fare Calculator with GPS Auto-Distance',
  },

  sitemap: {
    urls: generateSitemapUrls
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },

        { rel: 'preconnect', href: 'https://www.map.gov.hk', crossorigin: 'anonymous' },
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
