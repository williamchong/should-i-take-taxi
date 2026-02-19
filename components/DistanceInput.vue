<template>
  <div class="border-t border-gray-200 dark:border-gray-700 pt-6 grid grid-cols-2 gap-4 items-start">
    <label for="distance" class="text-gray-700 dark:text-gray-300 font-medium pt-2">{{ $t('taxiCalculator.distance') }}</label>

    <div class="pt-2 space-y-2">
      <!-- Read-only display by default -->
      <div v-if="!isEditingDistance" class="flex items-center gap-2 flex-wrap">
        <span class="font-bold text-lg text-gray-900 dark:text-gray-100">{{ displayDistance }} km</span>

        <!-- Badge: Auto-calculated or Manual -->
        <button
          v-if="isManualOverride"
          class="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full flex items-center gap-1"
          :title="$t('taxiCalculator.manualAdjust') || '手動調整距離'"
          @click="enableDistanceEdit"
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          {{ $t('taxiCalculator.manuallyAdjusted') || '已調整' }}
        </button>
        <button
          v-else-if="autoCalculatedDistance > 0"
          class="px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 text-xs rounded-full flex items-center gap-1"
          :title="$t('taxiCalculator.manualAdjust') || '手動調整距離'"
          @click="enableDistanceEdit"
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ $t('taxiCalculator.autoCalculated') || '自動' }}
        </button>
      </div>

      <!-- Editable mode -->
      <div v-else class="space-y-2">
        <div class="flex items-center gap-2">
          <div class="relative">
            <input
              ref="distanceInput"
              v-model.number="manualDistance"
              type="number"
              min="0.1"
              max="200"
              step="0.1"
              class="w-24 px-3 py-2 border-2 border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md font-bold focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
              @keyup.enter="saveManualDistance"
              @keyup.esc="cancelDistanceEdit"
            >
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span class="text-gray-500 dark:text-gray-400 text-sm">km</span>
            </div>
          </div>

          <button
            type="button"
            class="px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
            :title="$t('taxiCalculator.confirm') || '確認'"
            :aria-label="$t('taxiCalculator.confirm') || '確認'"
            @click="saveManualDistance"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>

          <button
            type="button"
            class="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors"
            :title="$t('taxiCalculator.cancel') || '取消'"
            :aria-label="$t('taxiCalculator.cancel') || '取消'"
            @click="cancelDistanceEdit"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Show auto-calculated reference -->
        <div v-if="autoCalculatedDistance > 0" class="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ $t('taxiCalculator.autoCalculatedDistance') || '自動計算距離' }}: {{ autoCalculatedDistance }} km</span>
          <button
            type="button"
            class="text-blue-600 dark:text-blue-400 hover:underline ml-auto flex items-center gap-1"
            @click="resetToAutoCalculated"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ $t('taxiCalculator.restore') || '恢復' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { UI_CONSTANTS } from '~/types/constants'

const distance = defineModel<number>({ required: true })
const isManualOverride = defineModel<boolean>('isManualOverride', { required: true })

const props = defineProps<{
  autoCalculatedDistance: number
}>()

const { t } = useI18n()

const isEditingDistance = ref(false)
const manualDistance = ref(0)
const distanceInput = ref<HTMLInputElement | null>(null)

const displayDistance = computed(() => {
  if (isManualOverride.value) {
    return distance.value.toFixed(1)
  }
  if (props.autoCalculatedDistance > 0) {
    return props.autoCalculatedDistance.toFixed(1)
  }
  return distance.value.toFixed(1)
})

const enableDistanceEdit = () => {
  manualDistance.value = distance.value
  isEditingDistance.value = true
  useTrackEvent('taxi_distance_manual_edit_opened')

  // Focus input after Vue updates the DOM
  nextTick(() => {
    distanceInput.value?.focus({ preventScroll: true })
    distanceInput.value?.select()
  })
}

const validateManualDistance = (): boolean => {
  if (!manualDistance.value || manualDistance.value < UI_CONSTANTS.DISTANCE_MIN) {
    alert(t('taxiCalculator.distanceTooSmall') || '距離必須大於 0.1 公里')
    return false
  }

  if (manualDistance.value > UI_CONSTANTS.DISTANCE_MAX) {
    alert(t('taxiCalculator.distanceTooLarge') || '距離不能超過 200 公里。如需計算更長距離，請分段計算。')
    return false
  }

  // Warn if significantly different from auto-calculated
  if (props.autoCalculatedDistance > 0) {
    const diff = Math.abs(manualDistance.value - props.autoCalculatedDistance)
    const percentDiff = (diff / props.autoCalculatedDistance) * 100

    if (percentDiff > UI_CONSTANTS.DISTANCE_WARNING_THRESHOLD) {
      const confirmed = confirm(
        t('taxiCalculator.distanceDifferenceWarning', {
          manual: manualDistance.value,
          auto: props.autoCalculatedDistance,
          percent: Math.round(percentDiff)
        }) ||
        `你輸入的距離 (${manualDistance.value} km) 與建議路線 (${props.autoCalculatedDistance} km) 相差超過 ${Math.round(percentDiff)}%。\n\n確定要使用此距離?`
      )
      return confirmed
    }
  }

  return true
}

const saveManualDistance = () => {
  if (!validateManualDistance()) {
    return
  }

  distance.value = manualDistance.value
  isManualOverride.value = true
  isEditingDistance.value = false
  useTrackEvent('taxi_distance_manually_set', {
    distance: manualDistance.value,
    wasAutoCalculated: props.autoCalculatedDistance > 0
  })
}

const cancelDistanceEdit = () => {
  isEditingDistance.value = false
  useTrackEvent('taxi_distance_edit_cancelled')
}

const resetToAutoCalculated = () => {
  if (props.autoCalculatedDistance > 0) {
    distance.value = props.autoCalculatedDistance
    manualDistance.value = props.autoCalculatedDistance
    isManualOverride.value = false
    isEditingDistance.value = false
    useTrackEvent('taxi_distance_reset_to_auto')
  }
}
</script>
