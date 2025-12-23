<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div v-if="hasSelectedLocations" class="flex justify-center mb-8">
        <MapDisplay
              :start-location="selectedLocations.start"
              :end-location="selectedLocations.end"
              :route-coordinates="selectedLocations.coordinates"
            />
      </div>
      <template v-else>
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

      <TaxiFareCalculator
        class="mb-6"
        @update:locations="updateLocations"
      />

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

const selectedLocations = ref<{
  start: LocationResult | null;
  end: LocationResult | null;
  coordinates: [number, number][];
}>({
  start: null,
  end: null,
  coordinates: []
})

const hasSelectedLocations = computed(() => 
  selectedLocations.value.start !== null || selectedLocations.value.end !== null
)

function updateLocations(locations: { start: LocationResult | null; end: LocationResult | null, coordinates: [number, number][] }) {
  selectedLocations.value = locations
}
</script>
