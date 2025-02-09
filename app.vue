<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold text-center mb-4">{{ $t('title') }}</h1>
    <table class="table-auto w-full max-w-lg mx-auto border-collapse border border-gray-300">
      <tbody>
        <tr>
          <td class="border px-4 py-2">{{ $t('label.eventValue') }}</td>
          <td class="border px-4 py-2">
            <div class="flex items-center">
              <span>$</span>
              <input
                v-model.number="eventValue" type="number" :placeholder="$t('placeholder.eventValue')"
                class="border rounded px-2 py-1 w-full">
            </div>
          </td>
        </tr>
        <tr>
          <td class="border px-4 py-2">{{ $t('label.eventDuration') }}</td>
          <td class="border px-4 py-2">
            <div class="flex items-center">
              <input
                v-model.number="eventDuration" type="number" :placeholder="$t('placeholder.eventDuration')"
                class="border rounded px-2 py-1 w-full">
              <span class="ml-2">{{ $t('minutes') }}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td class="border px-4 py-2">{{ $t('label.salaryPeriod') }}</td>
          <td class="border px-4 py-2">
            <label class="inline-flex items-center mr-4">
              <input v-model="salaryPeriod" type="radio" value="annual" class="form-radio">
              <span class="ml-2">{{ $t('option.annual') }}</span>
            </label>
            <label class="inline-flex items-center">
              <input v-model="salaryPeriod" type="radio" value="monthly" class="form-radio">
              <span class="ml-2">{{ $t('option.monthly') }}</span>
            </label>
          </td>
        </tr>
        <tr>
          <td class="border px-4 py-2">{{ $t('label.salary') }}</td>
          <td class="border px-4 py-2">
            <div class="flex items-center">
              <span>$</span>
              <input
                v-model.number="salary" type="number" :placeholder="$t('placeholder.salary')"
                class="border rounded px-2 py-1 w-full">
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-5 text-center">
      <span v-if="loading" class="text-xl font-medium text-gray-500">{{ $t('loading.calculating') }}</span>
      <span v-else-if="isComplete" class="text-2xl font-bold">{{ delayedResult }}</span>
      <span v-else class="text-xl font-medium text-gray-500">{{ $t('error.inputAllValues') }}</span>
    </div>
    <hr class="my-8 border-t border-gray-300">
    <section class="mt-10 space-y-10">
      <div class="text-center px-4">
        <h2 class="text-2xl font-bold mb-4">{{ $t('intro.title') }}</h2>
        <div class="max-w-lg mx-auto">
          <p>{{ $t('intro.description') }}</p>
        </div>
      </div>
      <div class="text-center px-4">
        <h2 class="text-2xl font-bold mb-4">{{ $t('intro.concept.title') }}</h2>
        <div class="max-w-lg mx-auto">
          <p>{{ $t('intro.concept.description') }}</p>
          <ul class="list-disc list-inside mt-4">
            <li v-for="(benefit, index) in $tm('intro.concept.benefits')" :key="index">
              {{ $rt(benefit) }}
            </li>
          </ul>
        </div>
      </div>
      <div class="text-center px-4">
        <h2 class="text-2xl font-bold mb-4">{{ $t('intro.usage.title') }}</h2>
        <div class="max-w-lg mx-auto">
          <ol class="list-decimal list-inside mt-4">
            <li v-for="(step, index) in $tm('intro.usage.steps')" :key="index">
              {{ $rt(step) }}
            </li>
          </ol>
          <p class="mt-4">{{ $t('intro.concept.conclusion') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

useSeoMeta({
  title: t('title'),
  description: t('description'),
  ogTitle: t('title'),
  ogDescription: t('description'),
  ogUrl: 'http://shouldispendtimeon.work'
})

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
