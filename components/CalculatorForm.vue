<template>
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
                v-model.number="eventDurationInput"
                type="number"
                :placeholder="$t('placeholder.eventDuration')"
                :class="[
                  'block w-full pl-7 pr-12 py-2 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                  missingFields.eventDuration ? 'bg-yellow-50' : ''
                ]"
                @input.once="useTrackEvent('input_event_duration')"
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
                v-model.number="eventValueInput"
                type="number"
                :placeholder="$t('placeholder.eventValue')"
                :class="[
                  'block w-full pl-7 pr-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                  missingFields.eventValue ? 'bg-yellow-50' : ''
                ]"
                @input.once="useTrackEvent('input_event_value')"
              >
            </div>
          </div>
        </div>
      </div>

      <div class="pt-2">
        <div class="space-y-4">
          <button
            v-show="!showSalarySection"
            class="w-full flex justify-between items-center py-2 text-gray-700 hover:text-gray-900"
            @click="toggleSalarySection"
          >
            <span class="font-medium">{{ $t('label.salary') }}</span>
            <ChevronDownIcon
              :class="[
                'w-5 h-5 transform transition-transform',
                showSalarySection ? 'rotate-180' : ''
              ]"
            />
          </button>
        </div>
        <div
          v-show="showSalarySection"
          class="space-y-4"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <label class="text-gray-700 font-medium">{{ $t('label.salaryPeriod') }}</label>
            <div class="flex space-x-4 pl-2">
              <label class="inline-flex items-center">
                <input v-model="salaryPeriodInput" type="radio" value="annual" class="form-radio text-blue-600" @input.once="useTrackEvent('input_salary_period')">
                <span class="ml-2 text-gray-700">{{ $t('option.annual') }}</span>
              </label>
              <label class="inline-flex items-center">
                <input v-model="salaryPeriodInput" type="radio" value="monthly" class="form-radio text-blue-600" @input.once="useTrackEvent('input_salary_period')">
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
                v-model.number="salaryInput"
                type="number"
                :placeholder="$t('placeholder.salary')"
                :class="[
                  'block w-full pl-7 pr-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                  missingFields.salary ? 'bg-yellow-50' : ''
                ]"
                @input.once="useTrackEvent('input_salary')"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ClockIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useLocalStorage } from '@/composables/useLocalStorage'

const emit = defineEmits(['update:values'])

// Local storage for salary information
const salaryStorage = useLocalStorage<number | null>('salary', null)
const salaryPeriodStorage = useLocalStorage<'monthly' | 'annual'>('salaryPeriod', 'monthly')

// Local refs for binding to inputs
const eventDurationInput = ref<number| null>(null)
const eventValueInput = ref<number | null>(null)
const salaryInput = ref<number | null>(salaryStorage.value)
const salaryPeriodInput = ref<'monthly' | 'annual'>(salaryPeriodStorage.value)

// UI state
const showSalarySection = ref(!salaryStorage.value)

// 檢查必填欄位是否有填寫
const missingFields = computed(() => {
  return {
    eventDuration: !eventDurationInput.value,
    eventValue: !eventValueInput.value,
    salary: showSalarySection.value && !salaryInput.value
  }
})

onMounted(() => {
  if (salaryStorage.value) {
    showSalarySection.value = false
    salaryInput.value = salaryStorage.value
    salaryPeriodInput.value = salaryPeriodStorage.value
    useTrackEvent('restore_salary')
  }

  // Initial emission
  emitValues()
})

const toggleSalarySection = () => {
  showSalarySection.value = !showSalarySection.value
  useTrackEvent('toggle_salary_section')
}

// Update the parent component whenever relevant values change
watch([eventDurationInput, eventValueInput, salaryInput, salaryPeriodInput], () => {
  emitValues()

  // Update local storage for salary-related values
  salaryStorage.value = salaryInput.value
  salaryPeriodStorage.value = salaryPeriodInput.value
})

function emitValues() {
  emit('update:values', {
    eventDuration: eventDurationInput.value,
    eventValue: eventValueInput.value,
    salary: salaryInput.value,
    salaryPeriod: salaryPeriodInput.value
  })
}
</script>
