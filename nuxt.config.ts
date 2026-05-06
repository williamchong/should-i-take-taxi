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
    '@nuxtjs/leaflet',
    '@sentry/nuxt/module',
    '@vite-pwa/nuxt',
    '@nuxt/scripts',
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

  scripts: {
    registry: {
      googleAnalytics: {
        trigger: 'onNuxtReady',
        bundle: false,
        proxy: false,
        id: 'G-7JBFREKBB0',
      },
      posthog: {
        trigger: 'onNuxtReady',
        bundle: false,
        proxy: false,
        apiKey: 'phc_rPtJYrgSEf3tpmddVVRKXjQ6NwQ8xDPrpFGqCg7iMWnn',
        apiHost: 'https://us.i.posthog.com',
        autocapture: false,
        capturePageview: true,
        capturePageleave: true,
        disableSessionRecording: true,
      },
    },
  },

  site: {
    url: siteUrl,
    name: 'Hong Kong Taxi Fare Calculator',
  },

  sitemap: {
    urls: generateSitemapUrls
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },

        { rel: 'preconnect', href: 'https://www.map.gov.hk', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://www.geodetic.gov.hk', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://router.project-osrm.org', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://nominatim.openstreetmap.org', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://a.basemaps.cartocdn.com' },
        { rel: 'preconnect', href: 'https://b.basemaps.cartocdn.com' },
        { rel: 'preconnect', href: 'https://c.basemaps.cartocdn.com' },
        { rel: 'preconnect', href: 'https://www.googletagmanager.com', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://us.i.posthog.com', crossorigin: 'anonymous' },
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
  },

  // Tree-shake Sentry's tracing and debug code from the client bundle.
  // https://docs.sentry.io/platforms/javascript/configuration/tree-shaking/
  vite: {
    define: {
      __SENTRY_DEBUG__: false,
      __SENTRY_TRACING__: false,
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Should I Take Taxi?',
      short_name: 'Taxi Fare',
      description: 'Hong Kong taxi fare calculator with real-time route planning and fare estimation.',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
      cleanupOutdatedCaches: true,
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
  },
})
