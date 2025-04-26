<template>
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
      v-if="salary && !loading"
      class="flex-1 p-8 bg-white text-center rounded-xl shadow-lg border-2 border-gray-100"
    >
      <span class="block text-xs uppercase tracking-wider text-gray-400 mb-4">{{ $t('result.explanation.title') }}</span>
      <div class="space-y-2">
        <p v-if="salary" class="text-gray-600">{{ formatExplanation('hourlyRate', effectiveHourlyRate) }}</p>
        <p v-if="isComplete" class="text-gray-600">{{ formatExplanation('eventRate', eventHourlyRate) }}</p>
        <p v-if="isComplete" class="text-gray-600 font-medium">{{ formatConclusion }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  eventDuration: { type: Number, default: 60 },
  eventValue: { type: Number, default: null },
  salary: { type: Number, default: null },
  salaryPeriod: { type: String, default: 'monthly' }
})

const delayedResult = ref<string>('')
const loading = ref<boolean>(false)
let delayTimeout: NodeJS.Timeout | null = null

const isComplete = computed(() => {
  return props.salary != null && props.eventValue != null && props.eventDuration != null
})

const effectiveHourlyRate = computed(() => {
  if (!props.salary) return 0
  return props.salaryPeriod === 'annual'
    ? props.salary / 2080
    : (props.salary * 12) / 2080
})

const eventHourlyRate = computed(() => {
  if (!props.eventValue || !props.eventDuration) return 0
  return (props.eventValue) / (props.eventDuration / 60)
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

watch(() => [props.salary, props.eventValue, props.eventDuration, props.salaryPeriod], () => {
  computeDelayed()
}, { deep: true, immediate: true })

onBeforeUnmount(() => {
  if (delayTimeout) clearTimeout(delayTimeout)
})
</script>
