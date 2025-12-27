<template>
  <div>
    <!-- Advanced Options Toggle -->
    <div class="border-t border-gray-200 pt-6 mt-6">
      <button
        type="button"
        class="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
        @click="toggleAdvancedOptions"
      >
        <span class="mr-2">{{ showAdvancedOptions ? '▼' : '▶' }}</span>
        {{ $t('taxiCalculator.advancedOptions') }}
        <span class="ml-2 text-xs text-gray-500">({{ $t('taxiCalculator.tunnelsLuggage') }})</span>
      </button>
    </div>

    <!-- Advanced Options Content -->
    <div v-show="showAdvancedOptions" class="space-y-6 mt-6">
      <!-- Tunnel Fees -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <label class="text-gray-700 font-medium pt-1">{{ $t('taxiCalculator.tunnelFee') }}</label>
        <div class="space-y-2">
          <!-- Cross Harbour Tunnel Option -->
          <div class="flex items-center">
            <input
              id="tunnel-crossHarbour"
              :checked="selectedTunnels.includes('crossHarbour')"
              type="checkbox"
              value="crossHarbour"
              class="form-checkbox text-blue-600"
              @change="handleTunnelChange('crossHarbour', $event)"
            >
            <label for="tunnel-crossHarbour" class="ml-2 block text-sm text-gray-700">
              {{ t('taxiCalculator.tunnels.crossHarbour') }} (HK$ {{ TUNNEL_FEES.crossHarbour }})
            </label>
          </div>

          <!-- Other Tunnels (Collapsible) -->
          <div>
            <button
              type="button"
              class="text-sm text-gray-600 hover:text-gray-900 flex items-center"
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
                  class="form-checkbox text-blue-600"
                  @change="handleTunnelChange(tunnel.id, $event)"
                >
                <label :for="`tunnel-${tunnel.id}`" class="ml-2 block text-sm text-gray-700">
                  {{ tunnel.name }} (HK$ {{ tunnel.fee }})
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cross Harbour Taxi Stand Option -->
      <div v-if="hasSelectedCrossHarbourTunnel" class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <label class="text-gray-700 font-medium">{{ $t('taxiCalculator.crossHarbourTaxiStand') }}</label>
        <div>
          <label class="inline-flex items-center">
            <input
              :checked="isCrossHarbourTaxiStand"
              type="checkbox"
              class="form-checkbox text-blue-600"
              @change="handleCrossHarbourStandChange"
            >
            <span class="ml-2 text-sm text-gray-700">{{ $t('taxiCalculator.yes') }}</span>
          </label>
        </div>
      </div>

      <!-- Luggage Count -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <label class="text-gray-700 font-medium">{{ $t('taxiCalculator.luggage') }}</label>
        <div class="relative rounded-md shadow-sm">
          <input
            :value="luggageCount"
            type="number"
            min="0"
            step="1"
            class="block w-full pl-3 pr-12 py-2 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            @input="handleLuggageInput"
            @change="handleLuggageChange"
          >
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span class="text-gray-500 sm:text-sm">{{ $t('taxiCalculator.pieces') }}</span>
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
  isCrossHarbourTaxiStand: boolean
  luggageCount: number
  showAdvancedOptions?: boolean
}>()

const emit = defineEmits<{
  'update:selectedTunnels': [value: TunnelId[]]
  'update:isCrossHarbourTaxiStand': [value: boolean]
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

const handleCrossHarbourStandChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:isCrossHarbourTaxiStand', target.checked)
  useTrackEvent('taxi_cross_harbour_stand')
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
