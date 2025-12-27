<template>
  <div>
    <!-- Taxi Type Selection -->
    <div class="grid grid-cols-2 gap-4 items-center">
      <label class="text-gray-700 font-medium">{{ $t('taxiCalculator.taxiType') }}</label>
      <div class="flex space-x-4">
        <label class="inline-flex items-center">
          <input
            :checked="modelValue === 'urban'"
            type="radio"
            value="urban"
            class="form-radio text-red-600"
            @change="handleChange('urban')"
          >
          <span class="ml-2 h-4 w-4 rounded-full bg-red-600" :title="$t('taxiCalculator.urban')" />
        </label>
        <label class="inline-flex items-center">
          <input
            :checked="modelValue === 'newTerritories'"
            type="radio"
            value="newTerritories"
            class="form-radio text-green-600"
            @change="handleChange('newTerritories')"
          >
          <span class="ml-2 h-4 w-4 rounded-full bg-green-600" :title="$t('taxiCalculator.newTerritories')" />
        </label>
        <label class="inline-flex items-center">
          <input
            :checked="modelValue === 'lantau'"
            type="radio"
            value="lantau"
            class="form-radio text-blue-600"
            @change="handleChange('lantau')"
          >
          <span class="ml-2 h-4 w-4 rounded-full bg-blue-600" :title="$t('taxiCalculator.lantau')" />
        </label>
      </div>
    </div>

    <!-- Taxi Type Suggestion Banner -->
    <div v-if="showSuggestion && suggestedTaxiType" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p class="text-sm text-blue-800">
            {{ $t('taxiCalculator.suggestedTaxiType', { type: $t(`taxiCalculator.${suggestedTaxiType}`) }) }}
          </p>
        </div>
        <div class="flex gap-2 ml-4">
          <button
            type="button"
            class="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            @click="handleAcceptSuggestion"
          >
            {{ $t('taxiCalculator.useSuggested') }}
          </button>
          <button
            type="button"
            class="px-3 py-1 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
            @click="handleDismissSuggestion"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaxiType } from '~/types/constants'

const props = defineProps<{
  modelValue: TaxiType
  suggestedTaxiType?: TaxiType | null
  showSuggestion?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TaxiType]
  'accept-suggestion': []
  'dismiss-suggestion': []
}>()

const handleChange = (value: TaxiType) => {
  emit('update:modelValue', value)
  useTrackEvent('taxi_type_selected')
}

const handleAcceptSuggestion = () => {
  if (props.suggestedTaxiType) {
    emit('update:modelValue', props.suggestedTaxiType)
    emit('accept-suggestion')
    useTrackEvent('taxi_type_suggestion_accepted', { suggested: props.suggestedTaxiType })
  }
}

const handleDismissSuggestion = () => {
  emit('dismiss-suggestion')
  useTrackEvent('taxi_type_suggestion_dismissed', { suggested: props.suggestedTaxiType })
}
</script>
