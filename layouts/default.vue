<template>
  <div>
    <NuxtPwaManifest />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t, tm, rt, locale, locales } = useI18n()
const i18nHead = useLocaleHead()
const { url: siteUrl } = useSiteConfig()

// Helper function to get current page URL for the given locale
const getLocaleUrl = (localeCode: string) => {
  return `${siteUrl}${localeCode === 'en-hk' ? '' : '/' + localeCode}`
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
        releaseNotes: t('schema.releaseNotes'),
        featureList: getFeatureList(),
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        author: {
          '@type': 'Person',
          name: t('schema.authorName'),
          url: t('schema.authorUrl')
        },
        creator: {
          '@type': 'Person',
          name: t('schema.authorName'),
          url: t('schema.authorUrl')
        },
        potentialAction: {
          '@type': 'UseAction',
          target: siteUrl,
          result: {
            '@type': 'Thing',
            name: t('schema.potentialActionResult')
          }
        },
        serviceType: t('schema.serviceType'),
        areaServed: {
          '@type': 'Country',
          name: t('schema.areaServedName'),
          alternateName: t('schema.areaServedAlternateName')
        },
        keywords: t('schema.keywords'),
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
            name: t('schema.breadcrumbHome'),
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
          name: t('schema.authorName'),
          url: t('schema.authorUrl')
        },
        areaServed: {
          '@type': 'Country',
          name: t('schema.areaServedName')
        },
        serviceType: t('schema.serviceType'),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: t('schema.offerCatalogName'),
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
        alternateName: t('taxiCalculator.title'),
        url: siteUrl,
        inLanguage: locales.value.map(loc => loc.language || loc.code),
        author: {
          '@type': 'Person',
          name: t('schema.authorName'),
          url: t('schema.authorUrl')
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
  ogImage: `${siteUrl}/images/cover.jpg`,
  ogType: 'website',
  ogUrl: () => getLocaleUrl(locale.value),
  ogLocale: () => locale.value,
  ogLocaleAlternate: () => locales.value.filter(loc => loc.code !== locale.value).map(loc => loc.code),
})
</script>
