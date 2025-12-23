<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sticky Fare Summary -->
    <Transition name="slide-down">
      <div v-if="showStickyFare && fareData" class="fixed top-0 left-0 right-0 z-100 bg-white shadow-lg border-b border-gray-200">
        <div class="max-w-4xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600">{{ $t('taxiCalculator.estimatedFare') }}:</span>
            <span class="text-2xl font-bold text-blue-600">HK$ {{ fareData.totalFare.toFixed(2) }}</span>
          </div>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            @click="scrollToFare"
          >
            {{ $t('taxiCalculator.viewDetails') }}
          </button>
        </div>
      </div>
    </Transition>

    <div class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <!-- 1. Title/Logo (only when no locations selected) -->
      <template v-if="!hasSelectedLocations">
        <h1 class="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-2">{{ $t('title') }}</h1>
        <p class="text-center text-gray-600 text-lg mb-8">{{ $t('description') }}</p>
        <div class="flex justify-center mb-8">
          <picture>
            <source :srcset="LogoEnWebp" type="image/webp">
            <img
              :src="LogoEn"
              alt="Crazy Taxi"
              class="h-40 w-auto rounded-lg shadow-md"
            >
          </picture>
        </div>
      </template>

      <!-- 2. Map (when locations exist - topmost priority) -->
      <div
        v-if="hasSelectedLocations"
        :class="[
          'mb-8',
          showStickyFare && fareData ? 'pt-16' : ''
        ]"
      >
        <MapDisplay
          :start-location="selectedLocations.start"
          :end-location="selectedLocations.end"
          :route-coordinates="selectedLocations.coordinates"
        />
      </div>

      <!-- 3. TaxiFareCalculator -->
      <TaxiFareCalculator
        class="mb-8"
        @update:locations="updateLocations"
        @update:fare="updateFare"
      />

      <!-- 4. Fare Display (prominent, when calculated) -->
      <div v-if="fareData && fareData.totalFare > 0" ref="fareDisplayRef" class="mb-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
        <h3 class="text-xl font-medium text-gray-900">{{ $t('taxiCalculator.estimatedFare') }}</h3>
        <p class="text-5xl font-bold text-blue-600 mt-2 mb-4">HK$ {{ fareData.totalFare.toFixed(2) }}</p>

        <div class="border-t border-blue-200 pt-4 mt-4">
          <div class="text-sm text-gray-600">
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
      <div class="bg-white rounded-xl shadow-md p-6">
        <button
          type="button"
          class="w-full flex items-center justify-between text-left"
          @click="showIntroduction = !showIntroduction"
        >
          <h2 class="text-xl font-semibold text-gray-900">{{ $t('intro.showIntroduction') }}</h2>
          <span class="text-gray-600 text-lg">{{ showIntroduction ? '▼' : '▶' }}</span>
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

const showIntroduction = ref(false)
const showStickyFare = ref(false)
const fareDisplayRef = ref<HTMLElement | null>(null)

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

// Scroll to fare display
function scrollToFare() {
  if (fareDisplayRef.value) {
    fareDisplayRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Setup IntersectionObserver for sticky fare
onMounted(() => {
  if (typeof window === 'undefined' || !fareDisplayRef.value) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Show sticky header when fare display is out of view
        showStickyFare.value = !entry.isIntersecting && fareData.value !== null && fareData.value.totalFare > 0
      })
    },
    {
      threshold: 0,
      rootMargin: '-60px 0px 0px 0px' // Account for potential header height
    }
  )

  observer.observe(fareDisplayRef.value)

  // Cleanup on unmount
  onBeforeUnmount(() => {
    observer.disconnect()
  })
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
