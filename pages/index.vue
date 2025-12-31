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
            <span v-else class="text-2xl font-bold text-blue-600 dark:text-blue-400">HK$ {{ fareData?.totalFare.toFixed(2) }}</span>
          </div>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            @click="scrollToFare"
          >
            {{ $t('taxiCalculator.viewDetails') }}
          </button>
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
              <span>{{ fareData.breakdown.taxiTypeLabel }} {{ $t('taxiCalculator.flagFall') }}:</span>
              <span class="text-right">HK$ {{ fareData.breakdown.flagFall.toFixed(2) }}</span>

              <template v-if="fareData.breakdown.distanceFare > 0">
                <span>{{ $t('taxiCalculator.distanceFare') }}:</span>
                <span class="text-right">HK$ {{ fareData.breakdown.distanceFare.toFixed(2) }}</span>
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
import { useLocationSearch } from '@/composables/useLocationSearch'
import { findLocationByCoordinates } from '@/config/sitemap-routes'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { reverseGeocode } = useLocationSearch()
const { gtag } = useGtag()

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
const observer = ref<IntersectionObserver | null>(null)
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
    tunnelFees: number;
    luggageFees: number;
    returnToll: number;
    taxiTypeLabel: string;
  };
  isCalculating: boolean;
} | null>(null)

const hasSelectedLocations = computed(() =>
  selectedLocations.value.start !== null || selectedLocations.value.end !== null
)

function updateLocations(locations: { start: LocationResult | null; end: LocationResult | null, coordinates: [number, number][] }) {
  selectedLocations.value = locations
}

function updateFare(data: any) {
  fareData.value = data
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
    // Use predefined names for known locations
    return {
      x: lng,
      y: lat,
      nameEN: knownLocation.nameEN,
      nameZH: knownLocation.nameZH,
      addressEN: knownLocation.nameEN,
      addressZH: knownLocation.nameZH,
      districtEN: '',
      districtZH: '',
      displayAddress: locale.value.includes('zh') ? knownLocation.nameZH : knownLocation.nameEN
    }
  }

  // Fallback to generic location for unknown coordinates
  return {
    x: lng,
    y: lat,
    nameEN: 'Custom Location',
    nameZH: '自定義位置',
    addressEN: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    addressZH: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    districtEN: '',
    districtZH: '',
    displayAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
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

// Watch for location changes and update URL
watch(() => selectedLocations.value, (newLocations) => {
  if (!locationsRestoredFromUrl.value || newLocations.start || newLocations.end) {
    updateUrlParams(newLocations)
  }
}, { deep: true })

// Dynamic page title
const dynamicTitle = computed(() => {
  const start = selectedLocations.value.start
  const end = selectedLocations.value.end

  if (start && end) {
    const fromName = start.displayAddress
    const toName = end.displayAddress
    return t('seo.dynamicTitle.fromTo', { from: fromName, to: toName })
  } else if (start) {
    const fromName = start.displayAddress
    return t('seo.dynamicTitle.fromOnly', { from: fromName })
  }

  return t('title') // fallback to static title
})

// Canonical URL
const canonicalUrl = computed(() => {
  const baseUrl = 'https://shoulditake.taxi'
  const localePath = locale.value === 'en-hk' ? '' : `/${locale.value}`

  const url = `${baseUrl}${localePath}/`

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
  ogTitle: dynamicTitle
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

// Setup IntersectionObserver for sticky fare and parse URL params
onMounted(async () => {
  // Parse URL params first (before GPS auto-request in child component)
  await parseQueryParams()

  if (typeof window === 'undefined' || !fareDisplayRef.value) return

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Show sticky header when fare display is out of view
        isFareVisible.value = entry.isIntersecting
      })
    },
    {
      threshold: 0,
      rootMargin: '-60px 0px 0px 0px' // Account for potential header height
    }
  )

  observer.value.observe(fareDisplayRef.value)
})

// Cleanup on unmount
onBeforeUnmount(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
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
