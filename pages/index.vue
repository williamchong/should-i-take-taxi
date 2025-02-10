<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-2">{{ $t('title') }}</h1>
      <p class="text-center text-gray-600 text-lg mb-8">{{ $t('description') }}</p>
      <div class="flex justify-center mb-8">
        <img
          v-if="locale === 'zh'"
          :src="LogoZh"
          alt="誰有美國時間管那個啊"
          class="h-40 w-auto rounded-lg shadow-md"
        >
        <img
          v-else
          :src="LogoEn"
          alt="Ain't Nobody Got Time For That"
          class="h-40 w-auto rounded-lg shadow-md"
        >
      </div>

      <div class="bg-white rounded-xl shadow-md p-6 mb-8">
        <div class="space-y-6">
          <div class="pb-4 border-b border-gray-200">
            <div class="space-y-4">
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
      <div class="text-center p-8 bg-white rounded-xl shadow-lg mb-12 border-2 border-gray-100">
        <span class="block text-xs uppercase tracking-wider text-gray-400 mb-4">{{ $t('result.title') }}</span>
        <div v-if="loading" class="text-xl text-gray-600 animate-pulse">
          {{ $t('loading.calculating') }}
        </div>
        <div
          v-else-if="isComplete"
             class="text-3xl font-bold text-blue-600 transform hover:scale-105 transition-transform">
          {{ delayedResult }}
        </div>
        <div v-else class="text-xl text-gray-600">
          {{ $t('error.inputAllValues') }}
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
          <p class="text-gray-600">{{ $t('intro.description') }}</p>
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
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ClockIcon } from '@heroicons/vue/24/outline'
import LogoZh from '@/assets/images/nobody_got_time_zh.jpg'
import LogoEn from '@/assets/images/nobody_got_time.jpg'

const { t, locale } = useI18n()

const salary = ref<number | null>(null)
const salaryPeriod = ref<'monthly' | 'annual'>('monthly')
const eventValue = ref<number | null>(null)
const eventDuration = ref<number>(60)
const delayedResult = ref<string>('')
const loading = ref<boolean>(false)
let delayTimeout: NodeJS.Timeout | null = null

const isComplete = computed(() => {
  return salary.value != null && eventValue.value != null && eventDuration.value != null
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
    const effectiveHourly = salaryPeriod.value === 'annual'
      ? (salary.value as number) / 2080
      : ((salary.value as number) * 12) / 2080
    const eventHourly = (eventValue.value as number) / (eventDuration.value / 60)

    delayedResult.value = eventHourly > effectiveHourly
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
