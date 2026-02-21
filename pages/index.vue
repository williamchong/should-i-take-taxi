<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Theme Toggle -->
    <ClientOnly><ThemeToggle /></ClientOnly>

    <!-- Sticky Fare Summary -->
    <Transition name="slide-down">
      <div v-if="showStickyFare" class="fixed top-0 left-0 right-0 z-[1000] bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-4xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ $t('taxiCalculator.estimatedFare') }}:</span>
            <span v-if="fareData?.isCalculating" class="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <span class="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent"/>
              {{ $t('taxiCalculator.calculatingFare') }}
            </span>
            <button
              v-else
              type="button"
              class="text-2xl font-bold text-blue-600 dark:text-blue-400"
              @click="scrollToFare"
            >
              HK$ {{ fareData?.totalFare.toFixed(2) }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <!-- 2. Map (when locations exist - topmost priority) -->
      <div
        :class="[
          'mb-8',
          showStickyFare ? 'pt-16' : ''
        ]"
      >
        <!-- 1. Title/Logo (only when no locations selected) -->
        <template v-if="!hasSelectedLocations">
          <h1 class="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">{{ $t('title') }}</h1>
          <p class="text-center text-gray-600 dark:text-gray-400 text-lg mb-8">{{ $t('description') }}</p>
          <div class="flex justify-center mb-8">
            <div class="relative">
              <picture>
                <source :srcset="LogoEnWebp" type="image/webp">
                <img
                  :src="LogoEn"
                  alt="Crazy Taxi"
                  :class="[
                    'h-40 w-auto rounded-lg shadow-md transition-opacity',
                    isLoadingFromUrl ? 'opacity-50' : 'opacity-100'
                  ]"
                >
              </picture>
              <!-- Loading overlay -->
              <div
                v-if="isLoadingFromUrl"
                class="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div class="relative w-16 h-16 mb-2">
                  <div class="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full" />
                  <div class="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent" />
                </div>
                <p class="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-md">
                  {{ $t('loading') }}
                </p>
              </div>
            </div>
          </div>
        </template>
        <MapDisplay
          v-else
          :start-location="selectedLocations.start"
          :end-location="selectedLocations.end"
          :route-coordinates="selectedLocations.coordinates"
          :show-bounding-boxes="showBoundingBoxes"
          :is-calculating-distance="fareData?.isCalculating ?? false"
          :focused-input="focusedInput"
          @marker-dragged="handleMarkerDragged"
          @map-clicked="handleMapClick"
        />
        <!-- Hint text for draggable markers -->
        <div v-if="hasSelectedLocations" class="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ $t('taxiCalculator.markerDragHint') }}</span>
        </div>
      </div>
      <!-- 3. TaxiFareCalculator -->
      <TaxiFareCalculator
        ref="taxiFareCalculatorRef"
        class="mb-8"
        :initial-start-location="selectedLocations.start"
        :initial-end-location="selectedLocations.end"
        :skip-gps-auto-request="!!route.query.from"
        @update:locations="updateLocations"
        @update:fare="updateFare"
        @update:focused-input="updateFocusedInput"
        @update:transit-info="updateTransitInfo"
      />

      <!-- 4. Fare Display (prominent, when calculated) -->
      <div v-if="fareData" ref="fareDisplayRef" class="mb-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
        <h3 class="text-xl font-medium text-gray-900 dark:text-gray-100">{{ $t('taxiCalculator.estimatedFare') }}</h3>
        <p v-if="fareData.isCalculating" class="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2 mb-4 flex items-center gap-3">
          <span class="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent"/>
          {{ $t('taxiCalculator.calculatingFare') }}
        </p>
        <p v-else class="text-5xl font-bold text-blue-600 dark:text-blue-400 mt-2 mb-4">HK$ {{ fareData.totalFare.toFixed(2) }}</p>

        <div class="border-t border-blue-200 dark:border-blue-700 pt-4 mt-4">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <div class="grid grid-cols-2 gap-2">
              <template v-if="fareData.breakdown.discount > 0">
                <span>{{ $t('taxiCalculator.meterFare') }}:</span>
                <span class="text-right line-through text-gray-400 dark:text-gray-500">HK$ {{ fareData.breakdown.meterFare.toFixed(2) }}</span>

                <span>{{ $t('taxiCalculator.discountedFare') }}:</span>
                <span class="text-right">HK$ {{ (fareData.breakdown.meterFare - fareData.breakdown.discount).toFixed(2) }}</span>
              </template>

              <template v-else>
                <span>{{ fareData.breakdown.taxiTypeLabel }} {{ $t('taxiCalculator.flagFall') }}:</span>
                <span class="text-right">HK$ {{ fareData.breakdown.flagFall.toFixed(2) }}</span>

                <template v-if="fareData.breakdown.distanceFare > 0">
                  <span>{{ $t('taxiCalculator.distanceFare') }}:</span>
                  <span class="text-right">HK$ {{ fareData.breakdown.distanceFare.toFixed(2) }}</span>
                </template>
              </template>

              <template v-if="fareData.breakdown.tunnelFees > 0">
                <span>{{ $t('taxiCalculator.tunnelTotal') }}:</span>
                <span class="text-right">HK$ {{ fareData.breakdown.tunnelFees.toFixed(2) }}</span>
              </template>

              <template v-if="fareData.breakdown.luggageFees > 0">
                <span>{{ $t('taxiCalculator.luggageTotal') }}:</span>
                <span class="text-right">HK$ {{ fareData.breakdown.luggageFees.toFixed(2) }}</span>
              </template>

              <template v-if="fareData.breakdown.returnToll > 0">
                <span>{{ $t('taxiCalculator.returnToll') }}:</span>
                <span class="text-right">HK$ {{ fareData.breakdown.returnToll.toFixed(2) }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Transit Comparison -->
      <div v-if="transitData" class="mb-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ $t('transitComparison.title') }}</h3>

        <!-- Loading skeleton -->
        <div v-if="transitData.isCalculating" class="animate-pulse space-y-3">
          <div class="grid grid-cols-2 gap-4">
            <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>

        <!-- Comparison content -->
        <template v-else>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <!-- Taxi column -->
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{{ $t('transitComparison.taxi') }}</div>
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ Math.round(transitData.drivingTimeSeconds / 60) }} {{ $t('transitComparison.min') }}</div>
              <div v-if="fareData" class="text-sm text-gray-600 dark:text-gray-400 mt-1">HK$ {{ fareData.totalFare.toFixed(2) }}</div>
            </div>
            <!-- Public Transit column -->
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{{ $t('transitComparison.publicTransit') }}</div>
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ Math.round(transitData.transitDurationSeconds / 60) }} {{ $t('transitComparison.min') }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <template v-if="transitData.transitFareMin === transitData.transitFareMax">
                  HK$ {{ transitData.transitFareMin.toFixed(2) }}
                </template>
                <template v-else>
                  HK$ {{ transitData.transitFareMin.toFixed(2) }} – {{ transitData.transitFareMax.toFixed(2) }}
                </template>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <template v-if="transitMinutesSaved > 0">
              <p class="font-medium text-gray-900 dark:text-gray-100">
                {{ $t('transitComparison.timeSaved', { minutes: transitMinutesSaved }) }}
              </p>
              <p v-if="transitCostPerMinute" class="mt-1">
                {{ $t('transitComparison.costPerMinute', { cost: transitCostPerMinute }) }}
              </p>
            </template>
            <p v-else class="font-medium text-gray-900 dark:text-gray-100">
              {{ $t('transitComparison.noTimeSaved') }}
            </p>
          </div>

          <!-- Attribution -->
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">
            <i18n-t keypath="transitComparison.poweredBy" tag="span">
              <template #link>
                <a href="https://justusewheels.com" target="_blank" rel="noopener noreferrer" class="underline hover:text-gray-600 dark:hover:text-gray-300">Wheels</a>
              </template>
            </i18n-t>
          </p>
        </template>
      </div>

      <!-- 5. Introduction (collapsible) -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <button
          type="button"
          class="w-full flex items-center justify-between text-left"
          @click="showIntroduction = !showIntroduction"
        >
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ $t('intro.showIntroduction') }}</h2>
          <span class="text-gray-600 dark:text-gray-400 text-lg">{{ showIntroduction ? '▼' : '▶' }}</span>
        </button>
        <div v-show="showIntroduction" class="mt-4">
          <IntroductionSection />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LogoEn from '@/assets/images/nobody_got_time.jpg'
import LogoEnWebp from '@/assets/images/nobody_got_time.webp'
import IntroductionSection from '@/components/IntroductionSection.vue'
import TaxiFareCalculator from '@/components/TaxiFareCalculator.vue'
import MapDisplay from '@/components/MapDisplay.vue'
import type { LocationResult } from '@/types/location'
import { useIntersectionObserver } from '@vueuse/core'
import { useLocationSearch } from '@/composables/useLocationSearch'
import { findLocationByCoordinates } from '@/config/sitemap-routes'
import { createLocationFromCoordinates } from '~/utils/location'
import { calculateTotalFare } from '~/utils/fareCalculation'
import precomputedCache from '~/data/precomputed-cache.json'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { reverseGeocode } = useLocationSearch()
const { gtag } = useGtag()
const { url: siteUrl } = useSiteConfig()

const showIntroduction = ref(false)
const isFareVisible = ref(false)
const showStickyFare = computed(() => {
  return !isFareVisible.value && hasSelectedLocations.value && fareData.value !== null
})

// Show bounding boxes for debugging when debug=1 is in query string
const showBoundingBoxes = computed(() => route.query.debug === '1')
const fareDisplayRef = ref<HTMLElement | null>(null)
const taxiFareCalculatorRef = ref<InstanceType<typeof TaxiFareCalculator> | null>(null)
const locationsRestoredFromUrl = ref(false)
const isLoadingFromUrl = ref(false)
const focusedInput = ref<'start' | 'end' | null>(null)

const selectedLocations = ref<{
  start: LocationResult | null;
  end: LocationResult | null;
  coordinates: [number, number][];
}>({
  start: null,
  end: null,
  coordinates: []
})

const fareData = ref<{
  totalFare: number;
  breakdown: {
    flagFall: number;
    distanceFare: number;
    meterFare: number;
    discount: number;
    tunnelFees: number;
    luggageFees: number;
    returnToll: number;
    taxiTypeLabel: string;
  };
  isCalculating: boolean;
} | null>(null)

const transitData = ref<{
  transitDurationSeconds: number;
  transitFareMin: number;
  transitFareMax: number;
  drivingTimeSeconds: number;
  isCalculating: boolean;
} | null>(null)

const hasSelectedLocations = computed(() =>
  selectedLocations.value.start !== null || selectedLocations.value.end !== null
)

const transitMinutesSaved = computed(() => {
  if (!transitData.value || transitData.value.isCalculating) return 0
  return Math.round((transitData.value.transitDurationSeconds - transitData.value.drivingTimeSeconds) / 60)
})

const transitCostPerMinute = computed(() => {
  if (!fareData.value || !transitData.value || transitMinutesSaved.value <= 0) return null
  const taxiFareDiff = fareData.value.totalFare - transitData.value.transitFareMin
  if (taxiFareDiff <= 0) return null
  return (taxiFareDiff / transitMinutesSaved.value).toFixed(1)
})

function updateLocations(locations: { start: LocationResult | null; end: LocationResult | null, coordinates: [number, number][] }) {
  selectedLocations.value = locations
}

function updateFare(data: any) {
  fareData.value = data
}

function updateTransitInfo(data: any) {
  transitData.value = data
}

// Handle marker dragged event from MapDisplay
function handleMarkerDragged(event: { type: 'start' | 'end', latitude: number, longitude: number }) {
  // Call the exposed method on TaxiFareCalculator
  if (taxiFareCalculatorRef.value) {
    taxiFareCalculatorRef.value.handleMarkerDragged(event)
  }
}

// Handle map click event from MapDisplay
function handleMapClick(event: { latitude: number, longitude: number }) {
  // Call the exposed method on TaxiFareCalculator
  if (taxiFareCalculatorRef.value) {
    taxiFareCalculatorRef.value.handleMapClick(event.latitude, event.longitude)
  }
}

// Update focused input state from TaxiFareCalculator
function updateFocusedInput(input: 'start' | 'end' | null) {
  focusedInput.value = input
}

// Helper function to create basic location from coordinates
function createBasicLocation(lat: number, lng: number): LocationResult {
  // Try to find a known location from sitemap routes
  const knownLocation = findLocationByCoordinates(lat, lng)

  if (knownLocation) {
    const displayAddress = locale.value.includes('zh') ? knownLocation.nameZH : knownLocation.nameEN
    return {
      ...createLocationFromCoordinates(lat, lng, displayAddress),
      nameEN: knownLocation.nameEN,
      nameZH: knownLocation.nameZH,
      addressEN: knownLocation.nameEN,
      addressZH: knownLocation.nameZH,
    }
  }

  return createLocationFromCoordinates(lat, lng)
}

// Parse query parameters from URL and restore locations
async function parseQueryParams() {
  const fromParam = route.query.from as string | undefined
  const toParam = route.query.to as string | undefined

  if (!fromParam && !toParam) return

  isLoadingFromUrl.value = true

  try {
    // Parse coordinates synchronously
    const fromCoords = parseCoordinates(fromParam)
    const toCoords = parseCoordinates(toParam)

    // Create basic locations immediately for fast distance calculation
    let startLocation: LocationResult | null = null
    let endLocation: LocationResult | null = null

    if (fromCoords) {
      startLocation = createBasicLocation(fromCoords.lat, fromCoords.lng)
    }

    if (toCoords) {
      endLocation = createBasicLocation(toCoords.lat, toCoords.lng)
    }

    // Set locations immediately so distance calculation can start
    if (startLocation || endLocation) {
      selectedLocations.value = {
        start: startLocation,
        end: endLocation,
        coordinates: []
      }
      locationsRestoredFromUrl.value = true

      // Analytics tracking
      gtag('event', 'seo_url_restored_from_query', {
        has_start: !!startLocation,
        has_end: !!endLocation
      })
    }

    // Run reverse geocoding in parallel to get proper addresses
    const geocodePromises: Promise<LocationResult | null>[] = []

    if (fromCoords) {
      geocodePromises.push(reverseGeocode(fromCoords.lat, fromCoords.lng))
    } else {
      geocodePromises.push(Promise.resolve(null))
    }

    if (toCoords) {
      geocodePromises.push(reverseGeocode(toCoords.lat, toCoords.lng))
    } else {
      geocodePromises.push(Promise.resolve(null))
    }

    // Wait for all reverse geocoding to complete
    const [fromGeocodedResult, toGeocodedResult] = await Promise.all(geocodePromises)

    // Update locations with proper addresses if reverse geocoding succeeded
    if (fromGeocodedResult || toGeocodedResult) {
      selectedLocations.value = {
        start: fromGeocodedResult || startLocation,
        end: toGeocodedResult || endLocation,
        coordinates: selectedLocations.value.coordinates // Preserve coordinates from distance calc
      }
    }
  } catch (error) {
    console.error('Error parsing query parameters:', error)
  } finally {
    isLoadingFromUrl.value = false
  }
}

// Update URL with current locations
function updateUrlParams(locations: { start: LocationResult | null; end: LocationResult | null }) {
  const params = new URLSearchParams(route.query as Record<string, string>)

  if (locations.start) {
    const { y, x } = locations.start
    params.set('from', `${y.toFixed(6)},${x.toFixed(6)}`)
  }

  if (locations.end) {
    const { y, x } = locations.end
    params.set('to', `${y.toFixed(6)},${x.toFixed(6)}`)
  }

  const queryString = params.toString()
  const newPath = queryString ? `?${queryString}` : route.path

  // Only update if different to avoid unnecessary navigation
  if (route.fullPath !== newPath) {
    router.replace(newPath)

    // Analytics tracking
    gtag('event', 'seo_url_updated', {
      has_start: !!locations.start,
      has_end: !!locations.end
    })
  }
}

watch(
  [() => selectedLocations.value.start, () => selectedLocations.value.end],
  () => {
    const locations = selectedLocations.value
    if (!locationsRestoredFromUrl.value || locations.start || locations.end) {
      updateUrlParams(locations)
    }
  }
)

// Precompute fare map once at module load (avoids recalculating on every reactive evaluation)
const precomputedFares: Record<string, number> = {}
for (const [key, route] of Object.entries(precomputedCache.routes)) {
  precomputedFares[key] = calculateTotalFare({
    distance: (route as { distance: number }).distance,
    taxiType: 'urban',
    selectedTunnels: [],
    tunnelFeeType: 'oneWay',
    isDiscountFare: false,
    luggageCount: 0,
  }).totalFare
}

const dynamicTitle = computed(() => {
  const start = selectedLocations.value.start
  const end = selectedLocations.value.end

  if (start && end) {
    return t('seo.dynamicTitle.fromTo', { from: start.displayAddress, to: end.displayAddress })
  } else if (start) {
    return t('seo.dynamicTitle.fromOnly', { from: start.displayAddress })
  }

  return t('title')
})

const dynamicDescription = computed(() => {
  const start = selectedLocations.value.start
  const end = selectedLocations.value.end

  if (start && end) {
    const key = `${start.x.toFixed(6)},${start.y.toFixed(6)},${end.x.toFixed(6)},${end.y.toFixed(6)}`
    const fare = precomputedFares[key]
    if (fare) {
      return t('seo.dynamicDescription.fromTo', { from: start.displayAddress, to: end.displayAddress, fare: fare.toFixed(0) })
    }
    return t('seo.dynamicDescription.fromToNoFare', { from: start.displayAddress, to: end.displayAddress })
  } else if (start) {
    return t('seo.dynamicDescription.fromOnly', { from: start.displayAddress })
  }

  return t('description')
})

// Canonical URL
const canonicalUrl = computed(() => {
  const localePath = locale.value === 'en-hk' ? '' : `/${locale.value}`

  const url = `${siteUrl}${localePath}/`

  const params = new URLSearchParams()
  if (selectedLocations.value.start) {
    const { y, x } = selectedLocations.value.start
    params.set('from', `${y.toFixed(6)},${x.toFixed(6)}`)
  }
  if (selectedLocations.value.end) {
    const { y, x } = selectedLocations.value.end
    params.set('to', `${y.toFixed(6)},${x.toFixed(6)}`)
  }

  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
})

// Page-level SEO (overrides layout)
useSeoMeta({
  title: dynamicTitle,
  ogTitle: dynamicTitle,
  description: dynamicDescription,
  ogDescription: dynamicDescription,
})

// API preloading when from/to coordinates are in URL
const shouldPreloadApis = computed(() => {
  return !!(route.query.from || route.query.to)
})

// Helper function to parse coordinate string
function parseCoordinates(coordStr: string | undefined): { lat: number; lng: number } | null {
  if (!coordStr || typeof coordStr !== 'string') return null

  const [latStr, lngStr] = coordStr.split(',')
  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null
  }

  return { lat, lng }
}

useHead(() => {
  const links: any[] = [
    {
      rel: 'canonical',
      href: canonicalUrl.value
    }
  ]

  // Add DNS prefetch and preconnect for APIs when coordinates are in URL
  if (shouldPreloadApis.value) {
    // Nominatim API (reverse geocoding)
    links.push(
      { rel: 'dns-prefetch', href: 'https://nominatim.openstreetmap.org' },
      { rel: 'preconnect', href: 'https://nominatim.openstreetmap.org', crossorigin: 'anonymous' as const }
    )

    // Preload specific Nominatim reverse geocoding requests
    const fromCoords = parseCoordinates(route.query.from as string)
    const toCoords = parseCoordinates(route.query.to as string)

    if (fromCoords) {
      const nominatimFromUrl = `https://nominatim.openstreetmap.org/reverse?lat=${fromCoords.lat}&lon=${fromCoords.lng}&format=json&accept-language=${locale.value}`
      links.push({
        rel: 'preload',
        as: 'fetch',
        href: nominatimFromUrl,
        crossorigin: 'anonymous' as const
      })
    }

    if (toCoords) {
      const nominatimToUrl = `https://nominatim.openstreetmap.org/reverse?lat=${toCoords.lat}&lon=${toCoords.lng}&format=json&accept-language=${locale.value}`
      links.push({
        rel: 'preload',
        as: 'fetch',
        href: nominatimToUrl,
        crossorigin: 'anonymous' as const
      })
    }

    // OSRM routing API (only if both from and to are present)
    if (fromCoords && toCoords) {
      links.push(
        { rel: 'dns-prefetch', href: 'https://router.project-osrm.org' },
        { rel: 'preconnect', href: 'https://router.project-osrm.org', crossorigin: 'anonymous' as const }
      )

      // Preload specific OSRM routing request
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}?overview=full&geometries=geojson`
      links.push({
        rel: 'preload',
        as: 'fetch',
        href: osrmUrl,
        crossorigin: 'anonymous' as const
      })
    }
  }

  return { link: links }
})

// Scroll to fare display
function scrollToFare() {
  if (fareDisplayRef.value) {
    fareDisplayRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

useIntersectionObserver(
  fareDisplayRef,
  ([{ isIntersecting }]) => {
    isFareVisible.value = isIntersecting
  },
  { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
)

onMounted(async () => {
  window.addEventListener('appinstalled', () => {
    useTrackEvent('pwa_app_installed')
  })
  await parseQueryParams()
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>
