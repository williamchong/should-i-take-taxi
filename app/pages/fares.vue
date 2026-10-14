<template>
  <div class="min-h-screen bg-muted">
    <ClientOnly><ThemeToggle /></ClientOnly>

    <div class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <header class="text-center">
        <h1 class="text-3xl sm:text-4xl font-bold text-highlighted mb-2">{{ $t('fares.heading') }}</h1>
        <p class="text-muted text-lg">{{ $t('fares.intro') }}</p>
      </header>

      <UCard>
        <h2 class="text-2xl font-bold text-highlighted mb-4">{{ $t('fares.ratesTitle') }}</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-right tabular-nums">
            <thead class="text-muted">
              <tr class="border-b border-default">
                <th scope="col" class="py-2 pr-3 font-medium text-left"><span class="sr-only">{{ $t('fares.colType') }}</span></th>
                <th v-for="taxi in taxiTypes" :key="taxi.type" scope="col" class="py-2 pl-3 font-medium text-highlighted whitespace-nowrap">
                  <span class="inline-block w-2.5 h-2.5 rounded-full mr-1.5" :class="taxi.dotClass" />{{ $t(`taxiCalculator.${taxi.type}`) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rateRows" :key="row.label" class="border-b border-default last:border-0">
                <th scope="row" class="py-2 pr-3 font-normal text-left text-muted">{{ $t(row.label) }}</th>
                <td v-for="taxi in taxiTypes" :key="taxi.type" class="py-2 pl-3 text-default">{{ hkd(TAXI_RATES[taxi.type][row.field]) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UCard>
        <h2 class="text-2xl font-bold text-highlighted mb-4">{{ $t('fares.perKmTitle') }}</h2>
        <ul class="space-y-2">
          <li v-for="taxi in taxiTypes" :key="taxi.type" class="text-default">
            {{ $t('fares.perKmLine', perKmParams(taxi.type)) }}
          </li>
        </ul>
      </UCard>

      <UCard>
        <h2 class="text-2xl font-bold text-highlighted mb-2">{{ $t('fares.distanceTitle') }}</h2>
        <p class="text-sm text-muted mb-4">{{ $t('fares.distanceNote') }}</p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-right tabular-nums">
            <thead class="text-muted">
              <tr class="border-b border-default">
                <th scope="col" class="py-2 pr-3 font-medium text-left">{{ $t('fares.colDistance') }}</th>
                <th v-for="taxi in taxiTypes" :key="taxi.type" scope="col" class="py-2 pl-3 font-medium whitespace-nowrap">
                  {{ $t(`taxiCalculator.${taxi.type}`) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in distanceRows" :key="row.km" class="border-b border-default last:border-0">
                <th scope="row" class="py-1.5 pr-3 font-medium text-left text-highlighted">{{ row.km }} km</th>
                <td v-for="(fare, i) in row.fares" :key="i" class="py-1.5 pl-3 text-default">{{ hkd(fare) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UCard>
        <h2 class="text-2xl font-bold text-highlighted mb-4">{{ $t('fares.surchargesTitle') }}</h2>
        <dl class="space-y-2 text-default mb-6">
          <div v-for="item in surcharges" :key="item.label" class="flex justify-between gap-4">
            <dt>{{ $t(item.label) }}</dt>
            <dd class="font-medium whitespace-nowrap">{{ hkd(item.fee) }}</dd>
          </div>
        </dl>
        <h3 class="font-semibold text-highlighted mb-2">{{ $t('fares.tollsTitle') }}</h3>
        <dl class="space-y-2 text-default">
          <div v-for="(fee, tunnel) in TUNNEL_FEES" :key="tunnel" class="flex justify-between gap-4">
            <dt>{{ $t(`taxiCalculator.tunnels.${tunnel}`) }}</dt>
            <dd class="font-medium whitespace-nowrap">{{ hkd(fee) }}</dd>
          </div>
        </dl>
        <p class="text-sm text-muted mt-4">{{ $t('fares.returnTollNote', { toll: hkd(TUNNEL_FEES.crossHarbour) }) }}</p>
      </UCard>

      <UCard>
        <h2 class="text-xl font-bold text-highlighted mb-4">{{ $t('fares.ctaTitle') }}</h2>
        <UButton :to="localePath('/')" size="lg" icon="i-heroicons-calculator">{{ $t('fares.ctaButton') }}</UButton>
      </UCard>

      <p class="text-sm text-muted">
        {{ $t('fares.source') }}
        <a :href="$t('fares.sourceUrl')" target="_blank" rel="noopener" class="underline hover:text-default">{{ $t('fares.sourceLink') }}</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { calculateMeterFare } from '~/utils/fareCalculation'
import { TAXI_DOT_CLASSES, TAXI_FARE_CONSTANTS, TAXI_RATES, TUNNEL_FEES } from '~/types/constants'
import type { TaxiRate, TaxiType } from '~/types/constants'

// Distances people search for ("12公里的士收費"); every step of the meter up
// to 20 km, then the longer cross-territory trips.
const TABLE_DISTANCES_KM = [...Array.from({ length: 20 }, (_, i) => i + 1), 25, 30, 35, 40]
const STEPS_PER_KM = 1 / TAXI_FARE_CONSTANTS.INCREMENTAL_SEGMENT

const taxiTypes = (Object.keys(TAXI_DOT_CLASSES) as TaxiType[])
  .map(type => ({ type, dotClass: TAXI_DOT_CLASSES[type] }))

const distanceRows = TABLE_DISTANCES_KM.map(km => ({
  km,
  fares: taxiTypes.map(({ type }) => calculateMeterFare(km, type).toFixed(1)),
}))

const rateRows: { label: string, field: keyof TaxiRate }[] = [
  { label: 'fares.colFlagFall', field: 'flagFall' },
  { label: 'fares.colStep', field: 'incrementalRate' },
  { label: 'fares.colThreshold', field: 'thresholdAmount' },
  { label: 'fares.colStepAfter', field: 'incrementalRateAfterThreshold' },
]

const surcharges = [
  { label: 'fares.luggage', fee: TAXI_FARE_CONSTANTS.LUGGAGE_FEE },
  { label: 'fares.animal', fee: TAXI_FARE_CONSTANTS.ADDITIONAL_FEE },
  { label: 'fares.booking', fee: TAXI_FARE_CONSTANTS.ADDITIONAL_FEE },
]

const { t } = useI18n()
const localePath = useLocalePath()
const { url: siteUrl } = useSiteConfig()

const hkd = (amount: number | string) => `HK$${amount}`

function perKmParams(type: TaxiType) {
  const rate = TAXI_RATES[type]
  return {
    type: t(`taxiCalculator.${type}`),
    flagFall: hkd(rate.flagFall),
    perKm: hkd(+(rate.incrementalRate * STEPS_PER_KM).toFixed(1)),
    threshold: hkd(rate.thresholdAmount),
    perKmAfter: hkd(+(rate.incrementalRateAfterThreshold * STEPS_PER_KM).toFixed(1)),
  }
}

const canonicalUrl = computed(() => `${siteUrl}${localePath('/fares')}`)

useSeoMeta({
  title: () => t('fares.seoTitle'),
  ogTitle: () => t('fares.seoTitle'),
  description: () => t('fares.seoDescription'),
  ogDescription: () => t('fares.seoDescription'),
  ogUrl: canonicalUrl,
})

useHead(() => ({
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('schema.breadcrumbHome'), item: `${siteUrl}${localePath('/')}` },
        { '@type': 'ListItem', position: 2, name: t('fares.heading'), item: canonicalUrl.value },
      ],
    }),
  }],
}))
</script>
