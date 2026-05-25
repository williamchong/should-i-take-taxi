<template>
  <div>
    <!-- Advanced Options Toggle -->
    <div class="border-t border-default pt-6 mt-6">
      <UCollapsible v-model:open="showAdvancedOptions">
        <template #default="{ open }">
          <UButton
            variant="ghost"
            color="neutral"
            class="text-sm font-medium"
            :icon="open ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
            @click="onAdvancedTriggerClick"
          >
            {{ $t('taxiCalculator.advancedOptions') }}
            <span class="text-xs text-dimmed">({{ $t('taxiCalculator.tunnelsLuggage') }})</span>
          </UButton>
        </template>

        <template #content>
          <div class="space-y-6 mt-6">
            <!-- Tunnel Fees -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <label class="text-default font-medium pt-1">{{ $t('taxiCalculator.tunnelFee') }}</label>
              <div class="space-y-2">
                <!-- Cross Harbour Tunnel Option -->
                <UCheckbox
                  :model-value="selectedTunnels.includes('crossHarbour')"
                  :label="`${t('taxiCalculator.tunnels.crossHarbour')} (HK$ ${TUNNEL_FEES.crossHarbour})`"
                  @update:model-value="(v) => handleTunnelChange('crossHarbour', v)"
                />

                <!-- Other Tunnels (Collapsible) -->
                <UCollapsible>
                  <template #default="{ open }">
                    <UButton
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      class="text-sm"
                      :icon="open ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                    >
                      {{ $t('taxiCalculator.otherTunnels') }}
                    </UButton>
                  </template>
                  <template #content>
                    <div class="mt-2 ml-4 space-y-2">
                      <UCheckbox
                        v-for="tunnel in otherTunnelOptions"
                        :key="tunnel.id"
                        :model-value="selectedTunnels.includes(tunnel.id)"
                        :label="`${tunnel.name} (HK$ ${tunnel.fee})`"
                        @update:model-value="(v) => handleTunnelChange(tunnel.id, v)"
                      />
                    </div>
                  </template>
                </UCollapsible>
              </div>
            </div>

            <!-- Tunnel Fee Type (One-way / Return) -->
            <div v-if="hasSelectedCrossHarbourTunnel" class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <label class="text-default font-medium">{{ $t('taxiCalculator.tunnelFeeType') }}</label>
              <URadioGroup
                :model-value="tunnelFeeType"
                orientation="horizontal"
                :items="[
                  { value: 'oneWay', label: $t('taxiCalculator.tunnelFeeOneWay') },
                  { value: 'return', label: $t('taxiCalculator.tunnelFeeReturn') },
                ]"
                @update:model-value="(v) => handleTunnelFeeTypeChange(v as 'oneWay' | 'return')"
              />
            </div>

            <!-- 85折 Discount Fare -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <label class="text-default font-medium">{{ $t('taxiCalculator.discountFare') }}</label>
              <UCheckbox
                :model-value="isDiscountFare"
                :label="$t('taxiCalculator.discountFare')"
                @update:model-value="handleDiscountFareChange"
              />
            </div>

            <!-- Luggage Count -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <label class="text-default font-medium">{{ $t('taxiCalculator.luggage') }}</label>
              <UInput
                :model-value="luggageCount"
                type="number"
                min="0"
                step="1"
                class="w-full"
                @update:model-value="handleLuggageInput"
                @change="handleLuggageChange"
              >
                <template #trailing>
                  <span class="text-dimmed text-sm">{{ $t('taxiCalculator.pieces') }}</span>
                </template>
              </UInput>
            </div>
          </div>
        </template>
      </UCollapsible>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TUNNEL_FEES } from '~/types/constants'
import type { TunnelId } from '~/types/constants'

const selectedTunnels = defineModel<TunnelId[]>('selectedTunnels', { required: true })
const tunnelFeeType = defineModel<'oneWay' | 'return'>('tunnelFeeType', { required: true })
const isDiscountFare = defineModel<boolean>('isDiscountFare', { required: true })
const luggageCount = defineModel<number>('luggageCount', { required: true })
const showAdvancedOptions = defineModel<boolean>('showAdvancedOptions', { default: false })

const { t } = useI18n()
const { track } = useAnalytics()

let hasTrackedLuggageInput = false

const tunnelOptions = computed(() => [
  { id: 'crossHarbour' as TunnelId, name: t('taxiCalculator.tunnels.crossHarbour'), fee: TUNNEL_FEES.crossHarbour },
  { id: 'tatesCairn' as TunnelId, name: t('taxiCalculator.tunnels.tatesCairn'), fee: TUNNEL_FEES.tatesCairn },
  { id: 'taiLam' as TunnelId, name: t('taxiCalculator.tunnels.taiLam'), fee: TUNNEL_FEES.taiLam },
  { id: 'lions' as TunnelId, name: t('taxiCalculator.tunnels.lions'), fee: TUNNEL_FEES.lions },
  { id: 'shingMun' as TunnelId, name: t('taxiCalculator.tunnels.shingMun'), fee: TUNNEL_FEES.shingMun },
  { id: 'aberdeen' as TunnelId, name: t('taxiCalculator.tunnels.aberdeen'), fee: TUNNEL_FEES.aberdeen },
  { id: 'shaTinHeights' as TunnelId, name: t('taxiCalculator.tunnels.shaTinHeights'), fee: TUNNEL_FEES.shaTinHeights },
])

const otherTunnelOptions = computed(() =>
  tunnelOptions.value.filter(tunnel => tunnel.id !== 'crossHarbour')
)

const hasSelectedCrossHarbourTunnel = computed(() =>
  selectedTunnels.value.includes('crossHarbour')
)

// UCollapsible flips `showAdvancedOptions` itself; this only reports the
// user-initiated toggle (not the programmatic cross-harbour auto-expand), so we
// report the state we are transitioning into.
const onAdvancedTriggerClick = () => {
  const expanded = !showAdvancedOptions.value
  track('taxi_advanced_options_toggled', {
    expanded,
    tunnel_count: selectedTunnels.value.length,
    luggage_count: luggageCount.value,
    is_discount_fare: isDiscountFare.value,
  })
}

const handleTunnelChange = (tunnelId: TunnelId, checked: boolean | 'indeterminate') => {
  const isChecked = checked === true
  const action = isChecked ? 'added' : 'removed'
  selectedTunnels.value = isChecked
    ? [...selectedTunnels.value, tunnelId]
    : selectedTunnels.value.filter(id => id !== tunnelId)
  track(`taxi_tunnel_${action}`, {
    tunnel: tunnelId,
    tunnel_count: selectedTunnels.value.length,
    has_cross_harbour: selectedTunnels.value.includes('crossHarbour'),
  }, { ga4Event: `taxi_tunnel_${action}_${tunnelId}` })
}

const handleTunnelFeeTypeChange = (value: 'oneWay' | 'return') => {
  tunnelFeeType.value = value
  track('taxi_tunnel_fee_type_changed', {
    type: value,
    has_cross_harbour: selectedTunnels.value.includes('crossHarbour'),
  })
}

const handleDiscountFareChange = (checked: boolean | 'indeterminate') => {
  isDiscountFare.value = checked === true
  track('taxi_discount_fare_toggled', { enabled: isDiscountFare.value })
}

const handleLuggageInput = (value: string | number) => {
  luggageCount.value = Number(value)
  if (!hasTrackedLuggageInput) {
    track('taxi_luggage_input', { luggage_count: luggageCount.value })
    hasTrackedLuggageInput = true
  }
}

const handleLuggageChange = () => {
  track('taxi_luggage_change', { luggage_count: luggageCount.value })
}
</script>
