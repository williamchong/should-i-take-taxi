<template>
  <div>
    <!-- Taxi Type Selection -->
    <div class="grid grid-cols-2 gap-4 items-center">
      <label class="text-default font-medium">{{ $t('taxiCalculator.taxiType') }}</label>
      <URadioGroup
        :model-value="modelValue"
        :items="taxiItems"
        orientation="horizontal"
        color="primary"
        @update:model-value="(v) => handleChange(v as TaxiType)"
      >
        <template #label="{ item }">
          <span class="inline-flex items-center">
            <span
              class="h-4 w-4 rounded-full"
              :class="(item as TaxiItem).dotClass"
              :title="(item as TaxiItem).label"
            />
            <span class="sr-only">{{ (item as TaxiItem).label }}</span>
          </span>
        </template>
      </URadioGroup>
    </div>

    <!-- Taxi Type Suggestion Banner -->
    <UAlert
      v-if="showSuggestion && suggestedTaxiType"
      color="primary"
      variant="soft"
      class="mt-4"
      :title="$t('taxiCalculator.suggestedTaxiType', { type: $t(`taxiCalculator.${suggestedTaxiType}`) })"
      :actions="[{
        label: $t('taxiCalculator.useSuggested'),
        color: 'primary',
        variant: 'solid',
        onClick: handleAcceptSuggestion,
      }]"
      close
      @update:open="(open) => { if (!open) handleDismissSuggestion() }"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TaxiType } from '~/types/constants'

interface TaxiItem {
  value: TaxiType
  label: string
  dotClass: string
}

const modelValue = defineModel<TaxiType>({ required: true })

const props = defineProps<{
  suggestedTaxiType?: TaxiType | null
  showSuggestion?: boolean
}>()

const emit = defineEmits<{
  'accept-suggestion': []
  'dismiss-suggestion': []
}>()

const { t } = useI18n()
const { track } = useAnalytics()

// Domain colours (red/green/blue = Urban/New Territories/Lantau) stay as literal
// Tailwind classes — they are not theme tokens.
const taxiItems = computed<TaxiItem[]>(() => [
  { value: 'urban', label: t('taxiCalculator.urban'), dotClass: 'bg-red-600' },
  { value: 'newTerritories', label: t('taxiCalculator.newTerritories'), dotClass: 'bg-green-600' },
  { value: 'lantau', label: t('taxiCalculator.lantau'), dotClass: 'bg-blue-600' },
])

const handleChange = (value: TaxiType) => {
  const previous = modelValue.value
  modelValue.value = value
  track('taxi_type_selected', {
    type: value,
    previous_type: previous,
    matches_suggestion: props.suggestedTaxiType === value,
  }, { ga4Event: `taxi_type_selected_${value}` })
}

const handleAcceptSuggestion = () => {
  if (props.suggestedTaxiType) {
    const previous = modelValue.value
    modelValue.value = props.suggestedTaxiType
    emit('accept-suggestion')
    track('taxi_type_suggestion_accepted', {
      suggested: props.suggestedTaxiType,
      previous_type: previous,
    })
  }
}

const handleDismissSuggestion = () => {
  emit('dismiss-suggestion')
  track('taxi_type_suggestion_dismissed', {
    suggested: props.suggestedTaxiType,
    current_type: modelValue.value,
  })
}
</script>
