// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/i18n',
    '@nuxt/eslint',
  ],
  i18n: {
    locales: [
      { code: 'en', language: 'en-US' },
      { code: 'zh', language: 'zh-TW' }
    ],
    defaultLocale: 'en',
  }
})
