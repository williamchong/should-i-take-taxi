<template>
  <div class="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">{{ $t('taxiCalculator.title') }}</h2>
      <div class="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 flex items-center">
        <span class="mr-1">🇭🇰</span>
        <span>{{ $t('taxiCalculator.regionHongKong') }}</span>
      </div>
    </div>

    <form>
      <div class="space-y-6">
        <!-- 地點搜尋 -->
        <div class="grid grid-cols-1 gap-6">
          <!-- 起點搜尋 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <label for="startLocation" class="text-gray-700 font-medium">
              {{ $t('taxiCalculator.startLocation') }}
            </label>
            <div class="flex space-x-2">
              <LocationSearch
                id="startLocation"
                v-model="startLocationSearch"
                class="flex-grow"
                @select="selectStartLocation"
              />
              <!-- 只在支援地理位置時才顯示定位按鈕 -->
              <button
                v-if="isGeolocationSupported"
                type="button"
                class="inline-flex items-center justify-center gap-2 py-2 px-4 border border-transparent shadow-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                :disabled="isGettingLocation"
                :title="$t('taxiCalculator.useCurrentLocation')"
                @click="getCurrentLocation"
              >
                <span v-if="isGettingLocation">
                  <div class="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
                </span>
                <template v-else>
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </template>
              </button>
            </div>
          </div>

          <!-- 終點搜尋 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <label for="endLocation" class="text-gray-700 font-medium">
              {{ $t('taxiCalculator.endLocation') }}
            </label>
            <div class="flex space-x-2">
              <LocationSearch
                id="endLocation"
                v-model="endLocationSearch"
                class="flex-grow"
                @select="selectEndLocation"
              />
              <!-- 交換起終點按鈕 -->
              <button
                type="button"
                class="inline-flex justify-center py-2 px-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!selectedStartLocation || !selectedEndLocation"
                :title="$t('taxiCalculator.swapLocations')"
                @click="swapLocations"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="routeInfo.distance > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div />
            <div class="text-sm text-gray-700">
              <p>{{ $t('taxiCalculator.calculatedDistance') }}: <span class="font-bold">{{ (routeInfo.distance /
                  1000).toFixed(1) }}km</span></p>
              <p>{{ $t('taxiCalculator.estimatedTime') }}: <span class="font-bold">{{ Math.round(routeInfo.time / 60) }}
                  min</span></p>
            </div>
          </div>
        </div>

        <!-- 距離 - Enhanced with inline editing -->
        <div class="border-t border-gray-200 pt-6 grid grid-cols-2 gap-4 items-start">
          <label for="distance" class="text-gray-700 font-medium pt-2">{{ $t('taxiCalculator.distance') }}</label>

          <div class="space-y-2">
            <!-- Read-only display by default -->
            <div v-if="!isEditingDistance" class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-lg">{{ displayDistance }} km</span>

              <!-- Badge: Auto-calculated or Manual -->
              <span v-if="isManualOverride" class="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {{ $t('taxiCalculator.manuallyAdjusted') || '已調整' }}
              </span>
              <span v-else-if="autoCalculatedDistance > 0" class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {{ $t('taxiCalculator.autoCalculated') || '自動' }}
              </span>

              <!-- Edit button -->
              <button
                type="button"
                class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                :title="$t('taxiCalculator.manualAdjust') || '手動調整距離'"
                @click="enableDistanceEdit"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span class="hidden sm:inline">{{ $t('taxiCalculator.manualAdjust') || '手動調整' }}</span>
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
                    class="w-24 px-3 py-2 border-2 border-blue-500 rounded-md font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    @keyup.enter="saveManualDistance"
                    @keyup.esc="cancelDistanceEdit"
                  >
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 text-sm">km</span>
                  </div>
                </div>

                <button
                  type="button"
                  class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  :title="$t('taxiCalculator.confirm') || '確認'"
                  @click="saveManualDistance"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  class="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                  :title="$t('taxiCalculator.cancel') || '取消'"
                  @click="cancelDistanceEdit"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Show auto-calculated reference -->
              <div v-if="autoCalculatedDistance > 0" class="text-xs text-gray-600 flex items-center gap-1 bg-gray-50 p-2 rounded">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ $t('taxiCalculator.autoCalculatedDistance') || '自動計算距離' }}: {{ autoCalculatedDistance }} km</span>
                <button
                  type="button"
                  class="text-blue-600 hover:underline ml-auto flex items-center gap-1"
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

        <!-- 的士類型選擇 -->
        <div class="grid grid-cols-2 gap-4 items-center">
          <label class="text-gray-700 font-medium">{{ $t('taxiCalculator.taxiType') }}</label>
          <div class="flex space-x-4">
            <label class="inline-flex items-center">
              <input
                v-model="taxiType" type="radio" value="urban" class="form-radio text-red-600"
                @change="useTrackEvent('taxi_type_selected')">
              <span class="ml-2 h-4 w-4 rounded-full bg-red-600" :title="$t('taxiCalculator.urban')" />
            </label>
            <label class="inline-flex items-center">
              <input
                v-model="taxiType" type="radio" value="newTerritories" class="form-radio text-green-600"
                @change="useTrackEvent('taxi_type_selected')">
              <span class="ml-2 h-4 w-4 rounded-full bg-green-600" :title="$t('taxiCalculator.newTerritories')" />
            </label>
            <label class="inline-flex items-center">
              <input
                v-model="taxiType" type="radio" value="lantau" class="form-radio text-blue-600"
                @change="useTrackEvent('taxi_type_selected')">
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
                @click="acceptSuggestion"
              >
                {{ $t('taxiCalculator.useSuggested') }}
              </button>
              <button
                type="button"
                class="px-3 py-1 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
                @click="dismissSuggestion"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- 進階選項切換 -->
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

        <!-- 進階選項內容 -->
        <div v-show="showAdvancedOptions" class="space-y-6 mt-6">
          <!-- 隧道費 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <label class="text-gray-700 font-medium pt-1">{{ $t('taxiCalculator.tunnelFee') }}</label>
          <div class="space-y-2">
            <!-- 過海隧道選項 -->
            <div class="flex items-center">
              <input
                id="tunnel-crossHarbour"
                v-model="selectedTunnels"
                type="checkbox"
                value="crossHarbour"
                class="form-checkbox text-blue-600"
                @change="useTrackEvent('taxi_tunnel_selected')"
              >
              <label for="tunnel-crossHarbour" class="ml-2 block text-sm text-gray-700">
                {{ t('taxiCalculator.tunnels.crossHarbour') }} (HK$ 25)
              </label>
            </div>

            <!-- 其他隧道選項（可折疊） -->
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
                    v-model="selectedTunnels"
                    type="checkbox"
                    :value="tunnel.id"
                    class="form-checkbox text-blue-600"
                    @change="useTrackEvent('taxi_tunnel_selected')"
                  >
                  <label :for="`tunnel-${tunnel.id}`" class="ml-2 block text-sm text-gray-700">
                    {{ tunnel.name }} (HK$ {{ tunnel.fee }})
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="hasSelectedCrossHarbourTunnel" class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <label class="text-gray-700 font-medium">{{ $t('taxiCalculator.crossHarbourTaxiStand') }}</label>
          <div>
            <label class="inline-flex items-center">
              <input
                v-model="isCrossHarbourTaxiStand" type="checkbox" class="form-checkbox text-blue-600"
                @change="useTrackEvent('taxi_cross_harbour_stand')">
              <span class="ml-2 text-sm text-gray-700">{{ $t('taxiCalculator.yes') }}</span>
            </label>
          </div>
        </div>

          <!-- 行李數量 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <label class="text-gray-700 font-medium">{{ $t('taxiCalculator.luggage') }}</label>
            <div class="relative rounded-md shadow-sm">
              <input
                v-model.number="luggageCount" type="number" min="0" step="1"
                class="block w-full pl-3 pr-12 py-2 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                @input.once="useTrackEvent('taxi_luggage_input')" @change="useTrackEvent('taxi_luggage_change')">
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">{{ $t('taxiCalculator.pieces') }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- End of 進階選項內容 -->

      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocationSearch } from '../composables/useLocationSearch'
import LocationSearch from './LocationSearch.vue'
import type { LocationResult } from '~/types/location'

const props = defineProps<{
  initialStartLocation?: LocationResult | null
  initialEndLocation?: LocationResult | null
  skipGpsAutoRequest?: boolean
}>()

const emit = defineEmits(['update:locations', 'update:fare'])

const { t } = useI18n()
const { calculateDrivingDistance, reverseGeocode } = useLocationSearch()

const taxiType = ref<'urban' | 'newTerritories' | 'lantau'>('urban')
const suggestedTaxiType = ref<'urban' | 'newTerritories' | 'lantau' | null>(null)
const showSuggestion = ref(false)
const distance = ref(0)
const selectedTunnels = ref([] as string[])
const isCrossHarbourTaxiStand = ref(false)
const luggageCount = ref(0)
const showOtherTunnels = ref(false)
const isGeolocationSupported = ref(false)

// 地點搜尋相關
const startLocationSearch = ref('')
const endLocationSearch = ref('')
const selectedStartLocation = ref<LocationResult | null>(null)
const selectedEndLocation = ref<LocationResult | null>(null)
const isCalculatingDistance = ref(false)
const isGettingLocation = ref(false)
const routeInfo = ref({ distance: 0, time: 0, coordinates: [] as [number, number][] })

// 距離編輯相關
const isEditingDistance = ref(false)
const manualDistance = ref(0)
const autoCalculatedDistance = ref(0)
const isManualOverride = ref(false)
const distanceInput = ref<HTMLInputElement | null>(null)

// 進階選項
const showAdvancedOptions = ref(false)

// Computed distance: manual if overridden, else auto-calculated or manual input
const displayDistance = computed(() => {
  if (isManualOverride.value) {
    return distance.value
  }
  if (autoCalculatedDistance.value > 0) {
    return autoCalculatedDistance.value
  }
  return distance.value
})

// 距離編輯方法
const enableDistanceEdit = () => {
  manualDistance.value = distance.value
  isEditingDistance.value = true
  useTrackEvent('taxi_distance_manual_edit_opened')

  // Focus input after Vue updates the DOM
  nextTick(() => {
    distanceInput.value?.focus()
    distanceInput.value?.select()
  })
}

const validateManualDistance = (): boolean => {
  if (!manualDistance.value || manualDistance.value < 0.1) {
    alert(t('taxiCalculator.distanceTooSmall') || '距離必須大於 0.1 公里')
    return false
  }

  if (manualDistance.value > 200) {
    alert(t('taxiCalculator.distanceTooLarge') || '距離不能超過 200 公里。如需計算更長距離，請分段計算。')
    return false
  }

  // Warn if significantly different from auto-calculated
  if (autoCalculatedDistance.value > 0) {
    const diff = Math.abs(manualDistance.value - autoCalculatedDistance.value)
    const percentDiff = (diff / autoCalculatedDistance.value) * 100

    if (percentDiff > 50) {
      const confirmed = confirm(
        t('taxiCalculator.distanceDifferenceWarning', {
          manual: manualDistance.value,
          auto: autoCalculatedDistance.value,
          percent: Math.round(percentDiff)
        }) ||
        `你輸入的距離 (${manualDistance.value} km) 與建議路線 (${autoCalculatedDistance.value} km) 相差超過 ${Math.round(percentDiff)}%。\n\n確定要使用此距離?`
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
    wasAutoCalculated: autoCalculatedDistance.value > 0
  })
}

const cancelDistanceEdit = () => {
  isEditingDistance.value = false
  useTrackEvent('taxi_distance_edit_cancelled')
}

const resetToAutoCalculated = () => {
  if (autoCalculatedDistance.value > 0) {
    distance.value = autoCalculatedDistance.value
    manualDistance.value = autoCalculatedDistance.value
    isManualOverride.value = false
    isEditingDistance.value = false
    useTrackEvent('taxi_distance_reset_to_auto')
  }
}

// 進階選項切換
const toggleAdvancedOptions = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value
  useTrackEvent('taxi_advanced_options_toggled', { expanded: showAdvancedOptions.value })
}

// 選擇地點
// Function to detect if a location is on Hong Kong Island
const isOnHongKongIsland = (lat: number, lng: number): boolean => {
  // Hong Kong Island boundaries (approximate)
  // Northern boundary: Victoria Harbour (~22.29°N)
  // Southern boundary: (~22.25°N)
  // Western boundary: (~114.13°E)
  // Eastern boundary: (~114.22°E)
  return lat >= 22.24 && lat <= 22.30 && lng >= 114.12 && lng <= 114.23
}

// Function to auto-select Cross Harbour Tunnel for cross-harbour routes
const autoSelectCrossHarbourTunnel = () => {
  if (!selectedStartLocation.value || !selectedEndLocation.value) return

  const startIsOnHKIsland = isOnHongKongIsland(
    selectedStartLocation.value.y,
    selectedStartLocation.value.x
  )
  const endIsOnHKIsland = isOnHongKongIsland(
    selectedEndLocation.value.y,
    selectedEndLocation.value.x
  )

  // If one location is on HK Island and the other is not, auto-select Cross Harbour Tunnel
  if (startIsOnHKIsland !== endIsOnHKIsland) {
    if (!selectedTunnels.value.includes('crossHarbour')) {
      selectedTunnels.value.push('crossHarbour')
      showAdvancedOptions.value = true // Auto-expand to show the auto-selected tunnel
      useTrackEvent('taxi_cross_harbour_tunnel_auto_selected')
    }
  }
}

const selectStartLocation = async (location: LocationResult | null) => {
  selectedStartLocation.value = location
  routeInfo.value = { distance: 0, time: 0, coordinates: [] }
  useTrackEvent('taxi_start_location_selected')

  // Auto-select Cross Harbour Tunnel if needed
  if (location && selectedEndLocation.value) {
    autoSelectCrossHarbourTunnel()
  }

  if (canCalculateDistance.value) {
    await handleCalculateDistance()
  }
  emitLocations()
}

const selectEndLocation = async (location: LocationResult | null) => {
  selectedEndLocation.value = location
  routeInfo.value = { distance: 0, time: 0, coordinates: [] }
  useTrackEvent('taxi_end_location_selected')

  // Auto-select Cross Harbour Tunnel if needed
  if (location && selectedStartLocation.value) {
    autoSelectCrossHarbourTunnel()
  }

  if (canCalculateDistance.value) {
    await handleCalculateDistance()
  }
  emitLocations()
}

const emitLocations = () => {
  emit('update:locations', {
    start: selectedStartLocation.value,
    end: selectedEndLocation.value,
    coordinates: routeInfo.value?.coordinates || []
  })
}

const canCalculateDistance = computed(() => {
  return selectedStartLocation.value && selectedEndLocation.value
})

// Detect if a location is in Lantau Island
const isLantauLocation = (location: LocationResult | null): boolean => {
  if (!location) return false

  // Lantau Island boundaries (approximate)
  // Covers main Lantau Island, Airport, Disneyland, Tung Chung, Mui Wo, Tai O, Discovery Bay, Ngong Ping
  // Northern boundary: Airport area (~22.35°N)
  // Southern boundary: Southern coast (~22.18°N)
  // Western boundary: Tai O (~113.86°E)
  // Eastern boundary: Discovery Bay/Mui Wo (~114.04°E)
  const lat = location.y
  const lng = location.x

  return lat >= 22.18 && lat <= 22.35 && lng >= 113.86 && lng <= 114.04
}

// Suggest taxi type based on route
const suggestTaxiType = () => {
  const startIsLantau = isLantauLocation(selectedStartLocation.value)
  const endIsLantau = isLantauLocation(selectedEndLocation.value)

  // If either start or end is in Lantau, suggest Lantau taxi
  if (startIsLantau || endIsLantau) {
    if (taxiType.value !== 'lantau') {
      suggestedTaxiType.value = 'lantau'
      showSuggestion.value = true
      useTrackEvent('taxi_type_suggestion_shown', { suggested: 'lantau' })
      return
    }
  }

  // Clear suggestion if not applicable
  suggestedTaxiType.value = null
  showSuggestion.value = false
}

// Accept suggested taxi type
const acceptSuggestion = () => {
  if (suggestedTaxiType.value) {
    taxiType.value = suggestedTaxiType.value
    showSuggestion.value = false
    useTrackEvent('taxi_type_suggestion_accepted', { suggested: suggestedTaxiType.value })
  }
}

// Dismiss suggestion
const dismissSuggestion = () => {
  showSuggestion.value = false
  useTrackEvent('taxi_type_suggestion_dismissed', { suggested: suggestedTaxiType.value })
}

// 重構計算距離函數
const handleCalculateDistance = async () => {
  if (!selectedStartLocation.value || !selectedEndLocation.value) {
    return
  }
  isCalculatingDistance.value = true
  try {
    const result = await calculateDrivingDistance(
      selectedStartLocation.value,
      selectedEndLocation.value
    )
    routeInfo.value = result

    // Update auto-calculated distance
    autoCalculatedDistance.value = parseFloat((result.distance / 1000).toFixed(1))

    // If user hasn't manually overridden, use auto-calculated
    if (!isManualOverride.value) {
      distance.value = autoCalculatedDistance.value
    }

    emitLocations()
    suggestTaxiType()
    useTrackEvent('taxi_distance_auto_calculated')
  } catch (error) {
    console.error('Error handling distance calculation:', error)
  } finally {
    isCalculatingDistance.value = false
  }
}

// 獲取當前位置
const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    alert(t('taxiCalculator.geolocationNotSupported'))
    return
  }

  isGettingLocation.value = true
  useTrackEvent('taxi_get_current_location_attempt')

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
    })

    const { latitude, longitude } = position.coords

    // 先用座標創建一個簡單的 LocationResult
    let location: LocationResult = {
      x: longitude,
      y: latitude,
      addressEN: "",
      addressZH: "",
      nameEN: t('taxiCalculator.currentLocation'),
      nameZH: t('taxiCalculator.currentLocation'),
      districtEN: "",
      districtZH: "",
      displayAddress: t('taxiCalculator.currentLocation')
    }

    // 嘗試反向地理編碼獲取地址
    try {
      const geoLocation = await reverseGeocode(latitude, longitude)
      if (geoLocation) {
        location = geoLocation
      }
    } catch (error) {
      console.error("Error getting address from coordinates:", error)
      // 繼續使用基本位置信息
    }

    // 更新位置
    startLocationSearch.value = location.displayAddress
    await selectStartLocation(location)
    useTrackEvent('taxi_get_current_location_success')
  } catch (error) {
    console.error("Error getting current location:", error)
    alert(t('taxiCalculator.geolocationError'))
    useTrackEvent('taxi_get_current_location_error')
  } finally {
    isGettingLocation.value = false
  }
}

// 交換起終點位置
const swapLocations = async () => {
  if (!selectedStartLocation.value || !selectedEndLocation.value) {
    return
  }

  // 交換選定的位置對象
  const tempLocation = selectedStartLocation.value
  selectedStartLocation.value = selectedEndLocation.value
  selectedEndLocation.value = tempLocation

  // 交換搜尋框的顯示文字
  const tempSearch = startLocationSearch.value
  startLocationSearch.value = endLocationSearch.value
  endLocationSearch.value = tempSearch

  // 清除舊的路線資訊
  routeInfo.value = { distance: 0, time: 0, coordinates: [] }

  // Auto-select Cross Harbour Tunnel if needed after swapping
  autoSelectCrossHarbourTunnel()

  // 重新計算路線
  if (canCalculateDistance.value) {
    await handleCalculateDistance()
  }

  // 發送位置更新事件
  emitLocations()

  // 追蹤交換事件
  useTrackEvent('taxi_locations_swapped')
}

// Watch for initial location props from parent (URL restoration)
watch(() => props.initialStartLocation, (newLocation) => {
  if (newLocation && !selectedStartLocation.value) {
    selectedStartLocation.value = newLocation
    startLocationSearch.value = newLocation.displayAddress
    if (selectedEndLocation.value) {
      handleCalculateDistance()
    }
    emitLocations()
  }
}, { immediate: true })

watch(() => props.initialEndLocation, (newLocation) => {
  if (newLocation && !selectedEndLocation.value) {
    selectedEndLocation.value = newLocation
    endLocationSearch.value = newLocation.displayAddress
    if (selectedStartLocation.value) {
      handleCalculateDistance()
    }
    emitLocations()
  }
}, { immediate: true })

// 在組件掛載時追蹤計程車計算器打開事件，並嘗試獲取用戶位置
onMounted(() => {
  emit('update:fare', {
    totalFare: totalFare.value,
    breakdown: fareBreakdown.value
  })
  // 檢查瀏覽器是否支援地理定位API
  isGeolocationSupported.value = Boolean(navigator.geolocation)
  useTrackEvent('taxi_calculator_opened')

  // 自動檢測並請求 GPS 定位（如果設備支援且未從 URL 恢復位置）
  if (isGeolocationSupported.value && !selectedStartLocation.value && !props.skipGpsAutoRequest) {
    getCurrentLocation()
  }
})

// 獲取出租車類型標籤的計算屬性
const getTaxiTypeLabel = computed(() => {
  const typeMap: Record<'urban' | 'newTerritories' | 'lantau', string> = {
    'urban': t('taxiCalculator.urban'),
    'newTerritories': t('taxiCalculator.newTerritories'),
    'lantau': t('taxiCalculator.lantau')
  };
  return typeMap[taxiType.value]
})

// 獲取隧道費總額
const getTunnelFees = computed(() =>
  selectedTunnels.value.reduce((total, tunnelId) => {
    const tunnel = tunnelOptions.value.find(t => t.id === tunnelId);
    return total + (tunnel?.fee || 0);
  }, 0)
)

// 獲取行李費總額
const getLuggageFees = computed(() => Number(luggageCount.value) * rates.value.luggageFee)

// 檢查是否選擇了過海隧道
const hasSelectedCrossHarbourTunnel = computed(() => selectedTunnels.value.includes('crossHarbour'))

// 計算回程收費
const getReturnTollFee = computed(() =>
  (hasSelectedCrossHarbourTunnel.value && !isCrossHarbourTaxiStand.value) ? 25 : 0
)

const tunnelOptions = computed(() => [
  { id: 'crossHarbour', name: t('taxiCalculator.tunnels.crossHarbour'), fee: 25 },
  { id: 'tatesCairn', name: t('taxiCalculator.tunnels.tatesCairn'), fee: 20 },
  { id: 'taiLam', name: t('taxiCalculator.tunnels.taiLam'), fee: 58 },
  { id: 'lions', name: t('taxiCalculator.tunnels.lions'), fee: 8 },
  { id: 'shingMun', name: t('taxiCalculator.tunnels.shingMun'), fee: 5 },
  { id: 'aberdeen', name: t('taxiCalculator.tunnels.aberdeen'), fee: 5 },
  { id: 'shaTinHeights', name: t('taxiCalculator.tunnels.shaTinHeights'), fee: 8 },
])

const otherTunnelOptions = computed(() =>
  tunnelOptions.value.filter(tunnel => tunnel.id !== 'crossHarbour')
)

const rates = computed(() => {
  const rateMap = {
    'urban': {
      flagFall: 29,
      firstTierDistance: 2,
      incrementalRate: 2.1,
      incrementalRateAfterThreshold: 1.4,
      thresholdAmount: 102.5,
      luggageFee: 6,
      additionalFee: 5,
    },
    'newTerritories': {
      flagFall: 25.5,
      firstTierDistance: 2,
      incrementalRate: 1.9,
      incrementalRateAfterThreshold: 1.4,
      thresholdAmount: 82.5,
      luggageFee: 6,
      additionalFee: 5,
    },
    'lantau': {
      flagFall: 24,
      firstTierDistance: 2,
      incrementalRate: 1.9,
      incrementalRateAfterThreshold: 1.6,
      thresholdAmount: 195,
      luggageFee: 6,
      additionalFee: 5,
    }
  };

  return rateMap[taxiType.value] || rateMap.urban;
})

// 使用 computed 計算距離費用
const distanceFare = computed(() => {
  // 如果距離為0或未填寫，不計算距離費用
  if (!distance.value || distance.value <= 0 || distance.value <= rates.value.firstTierDistance) {
    return 0;
  }

  const additionalDistance = distance.value - rates.value.firstTierDistance;
  const additionalSegments = Math.ceil(additionalDistance / 0.2);
  const { incrementalRate, incrementalRateAfterThreshold, thresholdAmount } = rates.value;
  const baseFare = rates.value.flagFall;

  const segmentsToThreshold = Math.floor((thresholdAmount - baseFare) / incrementalRate);

  return additionalSegments <= segmentsToThreshold
    ? additionalSegments * incrementalRate // 所有距離費用都在閾值之前
    : (segmentsToThreshold * incrementalRate) + // 閾值之前的部分
    ((additionalSegments - segmentsToThreshold) * incrementalRateAfterThreshold); // 閾值之後的部分
});

// 使用 computed 計算總費用
const totalFare = computed(() => {
  let fare = rates.value.flagFall + distanceFare.value;

  // 加入所有費用(隧道費、行李費、回程費)
  fare += getTunnelFees.value + getLuggageFees.value + getReturnTollFee.value;

  // 四捨五入至小數點後一位 (按運輸署規定)
  return Math.round(fare * 10) / 10;
})

// 車費明細 (for emitting to parent)
const fareBreakdown = computed(() => ({
  flagFall: rates.value.flagFall,
  distanceFare: distanceFare.value,
  tunnelFees: getTunnelFees.value,
  luggageFees: getLuggageFees.value,
  returnToll: getReturnTollFee.value,
  taxiTypeLabel: getTaxiTypeLabel.value
}))

// 監視 totalFare 的變化並追蹤和發送更新
watch(totalFare, (newValue) => {
  if (newValue > 0) {
    useTrackEvent('taxi_fare_calculated')
  }
  // Emit fare data to parent component
  emit('update:fare', {
    totalFare: newValue,
    breakdown: fareBreakdown.value
  })
})

</script>
