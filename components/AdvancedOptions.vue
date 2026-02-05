<template>
  <div>
    <!-- Advanced Options Toggle -->
    <div class="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
      <button
        type="button"
        class="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex items-center"
        @click="toggleAdvancedOptions"
      >
        <span class="mr-2">{{ showAdvancedOptions ? '▼' : '▶' }}</span>
        {{ $t('taxiCalculator.advancedOptions') }}
        <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">({{ $t('taxiCalculator.tunnelsLuggage') }})</span>
      </button>
    </div>

    <!-- Advanced Options Content -->
    <div v-show="showAdvancedOptions" class="space-y-6 mt-6">
      <!-- Tunnel Fees -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <label class="text-gray-700 dark:text-gray-300 font-medium pt-1">{{ $t('taxiCalculator.tunnelFee') }}</label>
        <div class="space-y-2">
          <!-- Cross Harbour Tunnel Option -->
          <div class="flex items-center">
            <input
              id="tunnel-crossHarbour"
              :checked="selectedTunnels.includes('crossHarbour')"
              type="checkbox"
              value="crossHarbour"
              class="form-checkbox text-blue-600 dark:text-blue-400"
              @change="handleTunnelChange('crossHarbour', $event)"
            >
            <label for="tunnel-crossHarbour" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              {{ t('taxiCalculator.tunnels.crossHarbour') }} (HK$ {{ TUNNEL_FEES.crossHarbour }})
            </label>
          </div>

          <!-- Other Tunnels (Collapsible) -->
          <div>
            <button
              type="button"
              class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center"
              @click="showOtherTunnels = !showOtherTunnels"
            >
              <span class="mr-1">{{ showOtherTunnels ? '▼' : '▶' }}</span>
              {{ $t('taxiCalculator.otherTunnels') }}
            </button>
            <div v-show="showOtherTunnels" class="mt-2 ml-4 space-y-2">
              <div
                v-for="tunnel in otherTunnelOptions"
                :key="tunnel.id"
                class="flex items-center"
              >
                <input
                  :id="`tunnel-${tunnel.id}`"
                  :checked="selectedTunnels.includes(tunnel.id)"
                  type="checkbox"
                  :value="tunnel.id"
                  class="form-checkbox text-blue-600 dark:text-blue-400"
                  @change="handleTunnelChange(tunnel.id, $event)"
                >
                <label :for="`tunnel-${tunnel.id}`" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {{ tunnel.name }} (HK$ {{ tunnel.fee }})
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tunnel Fee Type (One-way / Return) -->
      <div v-if="hasSelectedCrossHarbourTunnel" class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <label class="text-gray-700 dark:text-gray-300 font-medium">{{ $t('taxiCalculator.tunnelFeeType') }}</label>
        <div class="flex items-center space-x-4">
          <label class="inline-flex items-center">
            <input
              :checked="tunnelFeeType === 'oneWay'"
              type="radio"
              name="tunnelFeeType"
              value="oneWay"
              class="form-radio text-blue-600 dark:text-blue-400"
              @change="handleTunnelFeeTypeChange('oneWay')"
            >
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{{ $t('taxiCalculator.tunnelFeeOneWay') }}</span>
          </label>
          <label class="inline-flex items-center">
            <input
              :checked="tunnelFeeType === 'return'"
              type="radio"
              name="tunnelFeeType"
              value="return"
              class="form-radio text-blue-600 dark:text-blue-400"
              @change="handleTunnelFeeTypeChange('return')"
            >
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{{ $t('taxiCalculator.tunnelFeeReturn') }}</span>
          </label>
        </div>
      </div>

      <!-- 85折 Discount Fare -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <label class="text-gray-700 dark:text-gray-300 font-medium">{{ $t('taxiCalculator.discountFare') }}</label>
        <div>
          <label class="inline-flex items-center">
            <input
              :checked="isDiscountFare"
              type="checkbox"
              class="form-checkbox text-blue-600 dark:text-blue-400"
              @change="handleDiscountFareChange"
            >
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{{ $t('taxiCalculator.discountFare') }}</span>
          </label>
        </div>
      </div>

      <!-- Luggage Count -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <label class="text-gray-700 dark:text-gray-300 font-medium">{{ $t('taxiCalculator.luggage') }}</label>
        <div class="relative rounded-md shadow-sm">
          <input
            :value="luggageCount"
            type="number"
            min="0"
            step="1"
            class="block w-full pl-3 pr-12 py-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
            @input="handleLuggageInput"
            @change="handleLuggageChange"
          >
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span class="text-gray-500 dark:text-gray-400 sm:text-sm">{{ $t('taxiCalculator.pieces') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TUNNEL_FEES } from '~/types/constants'
import type { TunnelId } from '~/types/constants'

const props = defineProps<{
  selectedTunnels: TunnelId[]
  tunnelFeeType: 'oneWay' | 'return'
  isDiscountFare: boolean
  luggageCount: number
  showAdvancedOptions?: boolean
}>()

const emit = defineEmits<{
  'update:selectedTunnels': [value: TunnelId[]]
  'update:tunnelFeeType': [value: 'oneWay' | 'return']
  'update:isDiscountFare': [value: boolean]
  'update:luggageCount': [value: number]
  'update:showAdvancedOptions': [value: boolean]
}>()

const { t } = useI18n()

const showOtherTunnels = ref(false)
const showAdvancedOptions = ref(props.showAdvancedOptions ?? false)
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
  props.selectedTunnels.includes('crossHarbour')
)

const toggleAdvancedOptions = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value
  emit('update:showAdvancedOptions', showAdvancedOptions.value)
  useTrackEvent('taxi_advanced_options_toggled', { expanded: showAdvancedOptions.value })
}

const handleTunnelChange = (tunnelId: TunnelId, event: Event) => {
  const target = event.target as HTMLInputElement
  const newSelectedTunnels = target.checked
    ? [...props.selectedTunnels, tunnelId]
    : props.selectedTunnels.filter(id => id !== tunnelId)

  emit('update:selectedTunnels', newSelectedTunnels)
  useTrackEvent('taxi_tunnel_selected')
}

const handleTunnelFeeTypeChange = (value: 'oneWay' | 'return') => {
  emit('update:tunnelFeeType', value)
  useTrackEvent('taxi_tunnel_fee_type_changed', { type: value })
}

const handleDiscountFareChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:isDiscountFare', target.checked)
  useTrackEvent('taxi_discount_fare_toggled', { enabled: target.checked })
}

const handleLuggageInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  emit('update:luggageCount', value)
  if (!hasTrackedLuggageInput) {
    useTrackEvent('taxi_luggage_input')
    hasTrackedLuggageInput = true
  }
}

const handleLuggageChange = () => {
  useTrackEvent('taxi_luggage_change')
}

// Watch for prop changes to sync internal state
watch(() => props.showAdvancedOptions, (newValue) => {
  if (newValue !== undefined) {
    showAdvancedOptions.value = newValue
  }
})
</script>
