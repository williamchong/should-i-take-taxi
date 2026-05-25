<template>
  <div class="border-t border-default pt-6 grid grid-cols-2 gap-4 items-start">
    <label for="distance" class="text-default font-medium pt-2">{{ $t('taxiCalculator.distance') }}</label>

    <div class="pt-2 space-y-2">
      <!-- Read-only display by default -->
      <div v-if="!isEditingDistance" class="flex items-center gap-2 flex-wrap">
        <span class="font-bold text-lg text-highlighted">{{ displayDistance }} km</span>

        <!-- Badge: Auto-calculated or Manual -->
        <UBadge
          v-if="isManualOverride"
          as="button"
          type="button"
          color="warning"
          variant="soft"
          icon="i-heroicons-pencil-square"
          class="cursor-pointer"
          :title="$t('taxiCalculator.manualAdjust') || '手動調整距離'"
          @click="enableDistanceEdit"
        >
          {{ $t('taxiCalculator.manuallyAdjusted') || '已調整' }}
        </UBadge>
        <UBadge
          v-else-if="autoCalculatedDistance > 0"
          as="button"
          type="button"
          color="primary"
          variant="soft"
          icon="i-heroicons-bolt"
          class="cursor-pointer"
          :title="$t('taxiCalculator.manualAdjust') || '手動調整距離'"
          @click="enableDistanceEdit"
        >
          {{ $t('taxiCalculator.autoCalculated') || '自動' }}
        </UBadge>
      </div>

      <!-- Editable mode -->
      <div v-else class="space-y-2">
        <div class="flex items-center gap-2">
          <UInput
            ref="distanceInput"
            :model-value="manualDistance"
            type="number"
            :min="UI_CONSTANTS.DISTANCE_MIN"
            :max="UI_CONSTANTS.DISTANCE_MAX"
            step="0.1"
            class="w-28"
            @update:model-value="manualDistance = Number($event)"
            @keyup.enter="saveManualDistance"
            @keyup.esc="cancelDistanceEdit"
          >
            <template #trailing>
              <span class="text-dimmed text-sm">km</span>
            </template>
          </UInput>

          <UButton
            icon="i-heroicons-check"
            color="primary"
            :title="$t('taxiCalculator.confirm') || '確認'"
            :aria-label="$t('taxiCalculator.confirm') || '確認'"
            @click="saveManualDistance"
          />
          <UButton
            icon="i-heroicons-x-mark"
            color="neutral"
            variant="subtle"
            :title="$t('taxiCalculator.cancel') || '取消'"
            :aria-label="$t('taxiCalculator.cancel') || '取消'"
            @click="cancelDistanceEdit"
          />
        </div>

        <!-- Show auto-calculated reference -->
        <div v-if="autoCalculatedDistance > 0" class="text-xs text-muted flex items-center gap-1 bg-muted p-2 rounded-sm">
          <UIcon name="i-heroicons-information-circle" class="w-4 h-4 shrink-0" />
          <span>{{ $t('taxiCalculator.autoCalculatedDistance') || '自動計算距離' }}: {{ autoCalculatedDistance }} km</span>
          <UButton
            variant="link"
            size="xs"
            color="primary"
            icon="i-heroicons-arrow-path"
            class="ml-auto"
            @click="resetToAutoCalculated"
          >
            {{ $t('taxiCalculator.restore') || '恢復' }}
          </UButton>
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
const { track } = useAnalytics()

const isEditingDistance = ref(false)
const manualDistance = ref(0)
// UInput exposes the underlying <input> element via `inputRef`.
const distanceInput = ref<{ inputRef?: HTMLInputElement } | null>(null)

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
  track('taxi_distance_manual_edit_opened', {
    auto_calculated_km: props.autoCalculatedDistance,
    current_km: distance.value,
  })

  // Focus input after Vue updates the DOM
  nextTick(() => {
    distanceInput.value?.inputRef?.focus({ preventScroll: true })
    distanceInput.value?.inputRef?.select()
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
  const auto = props.autoCalculatedDistance
  const deviationPercent = auto > 0
    ? Math.round((Math.abs(manualDistance.value - auto) / auto) * 100)
    : null
  track('taxi_distance_manually_set', {
    distance_km: manualDistance.value,
    auto_calculated_km: auto,
    was_auto_calculated: auto > 0,
    deviation_percent: deviationPercent,
  })
}

const cancelDistanceEdit = () => {
  isEditingDistance.value = false
  track('taxi_distance_edit_cancelled')
}

const resetToAutoCalculated = () => {
  if (props.autoCalculatedDistance > 0) {
    distance.value = props.autoCalculatedDistance
    manualDistance.value = props.autoCalculatedDistance
    isManualOverride.value = false
    isEditingDistance.value = false
    track('taxi_distance_reset_to_auto', {
      auto_calculated_km: props.autoCalculatedDistance,
    })
  }
}
</script>
