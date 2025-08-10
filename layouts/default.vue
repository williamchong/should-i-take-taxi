<template>
  <div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t, tm, rt, locale, locales } = useI18n()
const i18nHead = useLocaleHead()

// Helper function to get current page URL for the given locale
const getLocaleUrl = (localeCode: string) => {
  return `https://shoulditake.taxi${localeCode === 'en-hk' ? '' : '/' + localeCode}`
}

// Get all available locale URLs for sameAs
const getAllLocaleUrls = () => {
  return locales.value.map(locale => getLocaleUrl(locale.code))
}

// Helper function to get localized FAQ data from i18n
const getFAQData = () => {
  const faqObj = tm('intro.faq') as { questions?: Array<{ question: string; answer: string }> }
  const faqQuestions = faqObj && Array.isArray(faqObj.questions) ? faqObj.questions : []
  if (!Array.isArray(faqQuestions)) {
    return []
  }
  return faqQuestions.map(faq => ({
    '@type': 'Question',
    name: rt(faq.question),
    acceptedAnswer: {
      '@type': 'Answer',
      text: rt(faq.answer),
    }
  }))
}

// Helper function to get localized feature list from i18n
const getFeatureList = () => {
  const featureObj = tm('intro.features') as { list?: Array<{ title: string; description: string }> }
  const features = featureObj && Array.isArray(featureObj.list) ? featureObj.list : []
  if (!Array.isArray(features)) {
    return []
  }
  return features.map(feature => rt(feature.description))
}

// Helper function to get service name translations from i18n
const getServiceNames = () => {
  return {
    urban: `${t('taxiCalculator.urban')} ${t('taxiCalculator.title')}`,
    newTerritories: `${t('taxiCalculator.newTerritories')} ${t('taxiCalculator.title')}`,
    lantau: `${t('taxiCalculator.lantau')} ${t('taxiCalculator.title')}`,
    urbanDesc: `${t('description')} - ${t('taxiCalculator.urban')}`,
    newTerritoriesDesc: `${t('description')} - ${t('taxiCalculator.newTerritories')}`,
    lantauDesc: `${t('description')} - ${t('taxiCalculator.lantau')}`
  }
}

useHead({
  htmlAttrs: {
    lang: i18nHead.value.htmlAttrs!.lang
  },
  link: [...(i18nHead.value.link || [])],
  meta: [...(i18nHead.value.meta || [])],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: t('title'),
        description: t('description'),
        inLanguage: locale.value,
        url: getLocaleUrl(locale.value),
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        softwareVersion: '1.0',
        releaseNotes: locale.value.startsWith('zh')
          ? '計算準確的香港的士車費，包含路線規劃和全面費用明細。'
          : 'Calculate accurate Hong Kong taxi fares with route planning and comprehensive fee breakdown.',
        featureList: getFeatureList(),
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        author: {
          '@type': 'Person',
          name: 'William Chong',
          url: 'https://blog.williamchong.cloud'
        },
        creator: {
          '@type': 'Person',
          name: 'William Chong',
          url: 'https://blog.williamchong.cloud'
        },
        potentialAction: {
          '@type': 'UseAction',
          target: 'https://shoulditake.taxi',
          result: {
            '@type': 'Thing',
            name: 'Hong Kong Taxi Fare Calculation'
          }
        },
        serviceType: locale.value.startsWith('zh') ? '交通計算器' : 'Transportation Calculator',
        areaServed: {
          '@type': 'Country',
          name: locale.value.startsWith('zh') ? '香港' : 'Hong Kong',
          alternateName: locale.value.startsWith('zh') ? '香港特別行政區' : 'Hong Kong SAR'
        },
        keywords: locale.value.startsWith('zh')
          ? '香港的士車費計算器, 的士車費估算, 香港交通, 市區的士, 新界的士, 大嶼山的士, 海底隧道'
          : 'Hong Kong taxi fare calculator, taxi fare estimation, Hong Kong transportation, urban taxi, new territories taxi, lantau taxi, cross harbour tunnel',
        availableLanguage: locales.value.map(loc => loc.language || loc.code),
        sameAs: getAllLocaleUrls()
      })
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: locale.value,
        mainEntity: getFAQData()
      })
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: locale.value.startsWith('zh') ? '首頁' : 'Home',
            item: getLocaleUrl(locale.value)
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: t('title'),
            item: getLocaleUrl(locale.value)
          }
        ]
      })
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: t('title'),
        description: t('description'),
        inLanguage: locale.value,
        provider: {
          '@type': 'Person',
          name: 'William Chong',
          url: 'https://blog.williamchong.cloud'
        },
        areaServed: {
          '@type': 'Country',
          name: locale.value.startsWith('zh') ? '香港' : 'Hong Kong'
        },
        serviceType: locale.value.startsWith('zh') ? '交通計算器' : 'Transportation Calculator',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: locale.value.startsWith('zh') ? '的士車費計算服務' : 'Taxi Fare Calculation Services',
          itemListElement: (() => {
            const serviceNames = getServiceNames()
            return [
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: serviceNames.urban,
                  description: serviceNames.urbanDesc
                }
              },
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: serviceNames.newTerritories,
                  description: serviceNames.newTerritoriesDesc
                }
              },
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: serviceNames.lantau,
                  description: serviceNames.lantauDesc
                }
              }
            ]
          })()
        }
      })
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: t('title'),
        alternateName: locale.value.startsWith('zh') ? '香港的士車費計算器' : 'Hong Kong Taxi Fare Calculator',
        url: 'https://shoulditake.taxi',
        inLanguage: ['en-HK', 'zh-HK'],
        author: {
          '@type': 'Person',
          name: 'William Chong',
          url: 'https://blog.williamchong.cloud'
        },
        sameAs: getAllLocaleUrls()
      })
    }
  ]
})
useSeoMeta({
  title: () => t('title'),
  description: () => t('description'),
  ogTitle: () => t('title'),
  ogDescription: () => t('description'),
  ogImage: 'https://shoulditake.taxi/images/cover.jpg',
  ogType: 'website',
  ogUrl: () => getLocaleUrl(locale.value),
  ogLocale: () => locale.value,
  ogLocaleAlternate: () => locales.value.filter(loc => loc.code !== locale.value).map(loc => loc.code),
})
</script>
