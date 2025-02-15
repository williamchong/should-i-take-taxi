<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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

      <div class="bg-white rounded-xl shadow-md p-6 mb-8">
        <div class="space-y-6">
          <div class="pb-4 border-b border-gray-200">
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <label class="text-gray-700 font-medium">{{ $t('label.eventDuration') }}</label>
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <ClockIcon class="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    v-model.number="eventDuration"
                    type="number"
                    :placeholder="$t('placeholder.eventDuration')"
                    class="block w-full pl-7 pr-12 py-2 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span class="text-gray-500 sm:text-sm">{{ $t('label.minutes') }}</span>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <label class="text-gray-700 font-medium">{{ $t('label.eventValue') }}</label>
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <span class="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    v-model.number="eventValue"
                    type="number"
                    :placeholder="$t('placeholder.eventValue')"
                    class="block w-full pl-7 pr-3 py-2 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="pt-2">
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <label class="text-gray-700 font-medium">{{ $t('label.salaryPeriod') }}</label>
                <div class="flex space-x-4 pl-2">
                  <label class="inline-flex items-center">
                    <input v-model="salaryPeriod" type="radio" value="annual" class="form-radio text-blue-600">
                    <span class="ml-2 text-gray-700">{{ $t('option.annual') }}</span>
                  </label>
                  <label class="inline-flex items-center">
                    <input v-model="salaryPeriod" type="radio" value="monthly" class="form-radio text-blue-600">
                    <span class="ml-2 text-gray-700">{{ $t('option.monthly') }}</span>
                  </label>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <label class="text-gray-700 font-medium">{{ $t('label.salary') }}</label>
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <span class="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    v-model.number="salary"
                    type="number"
                    :placeholder="$t('placeholder.salary')"
                    class="block w-full pl-7 pr-3 py-2 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row gap-4 mb-12">
        <!-- Result Card -->
        <div class="flex-1 text-center p-8 bg-white rounded-xl shadow-lg border-2 border-gray-100">
          <span class="block text-xs uppercase tracking-wider text-gray-400 mb-4">{{ $t('result.title') }}</span>
          <div v-if="loading" class="text-xl text-gray-600 animate-pulse">
            {{ $t('loading.calculating') }}
          </div>
          <div
            v-else-if="isComplete"
            :class="[
              'text-3xl font-bold transform hover:scale-105 transition-transform',
              isWorthIt ? 'text-blue-600' : 'text-red-600'
            ]"
          >
            {{ delayedResult }}
          </div>
          <div v-else class="text-xl text-gray-600">
            {{ $t('error.inputAllValues') }}
          </div>
        </div>

        <!-- Explanation Card -->
        <div
          v-if="isComplete && !loading"
          class="flex-1 p-8 bg-white rounded-xl shadow-lg border-2 border-gray-100"
        >
          <div class="space-y-2">
            <p class="text-gray-600">{{ formatExplanation('hourlyRate', effectiveHourlyRate) }}</p>
            <p class="text-gray-600">{{ formatExplanation('eventRate', eventHourlyRate) }}</p>
            <p class="text-gray-600 font-medium">{{ formatConclusion }}</p>
          </div>
        </div>
      </div>

      <div class="relative mb-12">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"/>
        </div>
        <div class="relative flex justify-center">
          <span class="px-4 bg-gray-50 text-lg text-gray-500">{{ $t('intro.divider') }}</span>
        </div>
      </div>

      <section class="space-y-8">
        <div class="bg-white rounded-xl shadow-md p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ $t('intro.title') }}</h2>
          <p class="text-gray-600">
            <i18n-t keypath="intro.description" scope="global">
              <template #taxiCalculator>
                <a
                  href="https://shouldispendtimeon.work/"
                  target="_blank"
                  rel="noopener"
                  class="text-blue-600 hover:text-blue-800"
                >{{ $t('intro.taxiCalculator') }}</a>
              </template>
            </i18n-t>
          </p>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ $t('intro.concept.title') }}</h2>
          <p class="text-gray-600 mb-4">{{ $t('intro.concept.description') }}</p>
          <ul class="space-y-2">
            <li
                v-for="(benefit, index) in $tm('intro.concept.benefits')" :key="index"
                class="flex items-start">
              <span class="text-blue-500 mr-2">•</span>
              <span class="text-gray-600">{{ $rt(benefit) }}</span>
            </li>
          </ul>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ $t('intro.usage.title') }}</h2>
          <ol class="space-y-2">
            <li
              v-for="(step, index) in $tm('intro.usage.steps')" :key="index"
                class="flex">
              <span class="font-bold text-blue-500 mr-2">{{ index + 1 }}.</span>
              <span class="text-gray-600">{{ $rt(step) }}</span>
            </li>
          </ol>
          <p class="mt-4 text-gray-600">{{ $t('intro.concept.conclusion') }}</p>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ $t('intro.openSource.title') }}</h2>
          <p class="text-gray-600 mb-4">{{ $t('intro.openSource.description') }}</p>
          <p class="text-gray-600 mb-4">{{ $t('intro.openSource.contribute') }}</p>
          <a
            href="https://github.com/williamchong/should-i-take-taxi"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            {{ $t('intro.openSource.repository') }}
          </a>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ClockIcon } from '@heroicons/vue/24/outline'
import LogoEn from '@/assets/images/nobody_got_time.jpg'
import LogoEnWebp from '@/assets/images/nobody_got_time.webp'
import { useLocalStorage } from '@/composables/useLocalStorage'

const { t } = useI18n()

const salary = useLocalStorage<number | null>('salary', null)
const salaryPeriod = useLocalStorage<'monthly' | 'annual'>('salaryPeriod', 'monthly')
const eventValue = ref<number | null>(null)
const eventDuration = ref<number>(60)
const delayedResult = ref<string>('')
const loading = ref<boolean>(false)
let delayTimeout: NodeJS.Timeout | null = null

const isComplete = computed(() => {
  return salary.value != null && eventValue.value != null && eventDuration.value != null
})

const effectiveHourlyRate = computed(() => {
  if (!salary.value) return 0
  return salaryPeriod.value === 'annual'
    ? salary.value / 2080
    : (salary.value * 12) / 2080
})

const eventHourlyRate = computed(() => {
  if (!eventValue.value || !eventDuration.value) return 0
  return (eventValue.value) / (eventDuration.value / 60)
})

const isWorthIt = computed(() => {
  return effectiveHourlyRate.value > eventHourlyRate.value
})

const formatExplanation = (key: string, rate: number) => {
  return t(`result.explanation.${key}`, {
    rate: rate.toFixed(2)
  })
}

const formatConclusion = computed(() => {
  return t('result.explanation.conclusion', {
    worth: t(`result.explanation.${isWorthIt.value ? 'worth' : 'notWorth'}`)
  })
})

const computeDelayed = () => {
  if (!isComplete.value) {
    delayedResult.value = ''
    loading.value = false
    if (delayTimeout) clearTimeout(delayTimeout)
    return
  }

  loading.value = true
  if (delayTimeout) clearTimeout(delayTimeout)

  delayTimeout = setTimeout(() => {
    delayedResult.value = isWorthIt.value
      ? t('result.justDoIt')
      : t('result.notWorthIt')
    loading.value = false
  }, 500)
}

watch([salary, eventValue, eventDuration, salaryPeriod], () => {
  computeDelayed()
})

onBeforeUnmount(() => {
  if (delayTimeout) clearTimeout(delayTimeout)
})
</script>
