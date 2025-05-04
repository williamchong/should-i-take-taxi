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
        v-if="isSupportedLocale"
        class="mb-6"
        @update:fare="updateFareAsEventValue"
        @update:locations="updateLocations"
      />

      <CalculatorForm
        :taxi-fare="formValues.eventValue"
        @update:values="updateValues"
      />

      <ResultDisplay
        :event-duration="formValues.eventDuration"
        :event-value="formValues.eventValue"
        :salary="formValues.salary"
        :salary-period="formValues.salaryPeriod"
      />

      <div class="relative mb-12">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"/>
        </div>
        <div class="relative flex justify-center">
          <span class="px-4 bg-gray-50 text-lg text-gray-500">{{ $t('intro.divider') }}</span>
        </div>
      </div>

      <IntroductionSection
        :show-calculator-section="isSupportedLocale"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LogoEn from '@/assets/images/nobody_got_time.jpg'
import LogoEnWebp from '@/assets/images/nobody_got_time.webp'
import CalculatorForm from '@/components/CalculatorForm.vue'
import ResultDisplay from '@/components/ResultDisplay.vue'
import IntroductionSection from '@/components/IntroductionSection.vue'
import TaxiFareCalculator from '@/components/TaxiFareCalculator.vue'
import MapDisplay from '@/components/MapDisplay.vue'
import type { LocationResult } from '@/types/location'

interface FormValues {
  eventDuration: number;
  eventValue: number | undefined;
  salary: number | undefined;
  salaryPeriod: 'monthly' | 'annual';
}

const formValues = ref<FormValues>({
  eventDuration: 60,
  eventValue: undefined,
  salary: undefined,
  salaryPeriod: 'monthly'
})

const { locale } = useI18n()

const isSupportedLocale = computed(() => {
  return locale.value.includes('HK') || locale.value.includes('hk')
})

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

function updateValues(values: FormValues) {
  formValues.value = values
}

function updateFareAsEventValue(fare: number) {
  formValues.value = {
    ...formValues.value,
    eventValue: fare
  }
}

function updateLocations(locations: { start: LocationResult | null; end: LocationResult | null, coordinates: [number, number][] }) {
  selectedLocations.value = locations
}
</script>
