<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sm:p-8 mb-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ $t('taxiCalculator.title') }}</h2>
      <div class="flex items-center gap-2">
        <div class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300 flex items-center">
          <span>🇭🇰</span>
        </div>
        <!-- 重新整理按鈕 -->
        <button
          type="button"
          class="inline-flex justify-center p-1.5 border border-gray-200 dark:border-gray-700 shadow-sm text-sm font-medium rounded-full text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-600 dark:hover:text-gray-400 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
          :title="$t('taxiCalculator.refreshCalculation')"
          @click="handleRefresh"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <form>
      <div class="space-y-6">
        <!-- 地點搜尋 -->
        <div class="grid grid-cols-1 gap-6">
          <!-- 起點搜尋 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <label for="startLocation" class="text-gray-700 dark:text-gray-300 font-medium">
              {{ $t('taxiCalculator.startLocation') }}
            </label>
            <div class="flex space-x-2">
              <LocationSearch
                id="startLocation"
                v-model="startLocationSearch"
                class="flex-grow"
                @select="selectStartLocation"
                @focus="focusedInput = 'start'"
                @blur="focusedInput = null"
              />
              <!-- 只在支援地理位置時才顯示定位按鈕 -->
              <button
                v-if="isGeolocationSupported"
                type="button"
                class="inline-flex items-center justify-center gap-2 py-2 px-4 border border-transparent shadow-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                :disabled="isGettingLocation"
                :title="$t('taxiCalculator.useCurrentLocation')"
                @click="getCurrentLocation"
              >
                <span v-if="isGettingLocation">
                  <div class="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                </span>
                <template v-else>
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </template>
              </button>
            </div>
          </div>

          <!-- 終點搜尋 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <label for="endLocation" class="text-gray-700 dark:text-gray-300 font-medium">
              {{ $t('taxiCalculator.endLocation') }}
            </label>
            <div class="flex space-x-2">
              <LocationSearch
                id="endLocation"
                ref="endLocationSearchRef"
                v-model="endLocationSearch"
                class="flex-grow"
                @select="selectEndLocation"
                @focus="focusedInput = 'end'"
                @blur="focusedInput = null"
              />
              <!-- 交換起終點按鈕 -->
              <button
                type="button"
                class="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <div class="text-sm text-gray-700 dark:text-gray-300">
              <p>{{ $t('taxiCalculator.calculatedDistance') }}: <span class="font-bold">{{ (routeInfo.distance /
                  1000).toFixed(1) }}km</span></p>
              <p>{{ $t('taxiCalculator.estimatedTime') }}: <span class="font-bold">{{ Math.round(routeInfo.time / 60) }}
                  min</span></p>
            </div>
          </div>
        </div>

        <!-- 距離 - Enhanced with inline editing -->
        <DistanceInput
          v-model="distance"
          v-model:is-manual-override="isManualOverride"
          :auto-calculated-distance="autoCalculatedDistance"
        />

        <!-- 的士類型選擇 -->
        <TaxiTypeSelector
          v-model="taxiType"
          :suggested-taxi-type="suggestedTaxiType"
          :show-suggestion="showSuggestion"
          @accept-suggestion="showSuggestion = false"
          @dismiss-suggestion="dismissSuggestion"
        />

        <!-- 進階選項 -->
        <AdvancedOptions
          v-model:selected-tunnels="selectedTunnels"
          v-model:is-cross-harbour-taxi-stand="isCrossHarbourTaxiStand"
          v-model:luggage-count="luggageCount"
          v-model:show-advanced-options="showAdvancedOptions"
        />

      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocationSearch } from '../composables/useLocationSearch'
import { useLocationDetection } from '../composables/useLocationDetection'
import LocationSearch from './LocationSearch.vue'
import TaxiTypeSelector from './TaxiTypeSelector.vue'
import DistanceInput from './DistanceInput.vue'
import AdvancedOptions from './AdvancedOptions.vue'
import type { LocationResult } from '~/types/location'
import type { TaxiType, TunnelId } from '~/types/constants'
import {
  TAXI_RATES,
  TAXI_FARE_CONSTANTS,
  TUNNEL_FEES,
  GEOLOCATION_CONSTANTS,
} from '~/types/constants'

const props = defineProps<{
  initialStartLocation?: LocationResult | null
  initialEndLocation?: LocationResult | null
  skipGpsAutoRequest?: boolean
}>()

const emit = defineEmits(['update:locations', 'update:fare', 'update:focusedInput'])

const { t } = useI18n()
const { calculateDrivingDistance, reverseGeocode } = useLocationSearch()
const { shouldAutoSelectCrossHarbour, suggestTaxiType: detectTaxiType } = useLocationDetection()

const taxiType = ref<TaxiType>('urban')
const suggestedTaxiType = ref<TaxiType | null>(null)
const showSuggestion = ref(false)
const distance = ref(0)
const selectedTunnels = ref<TunnelId[]>([])
const isCrossHarbourTaxiStand = ref(false)
const luggageCount = ref(0)
const showAdvancedOptions = ref(false)
const isGeolocationSupported = ref(false)

// 地點搜尋相關
const startLocationSearch = ref('')
const endLocationSearch = ref('')
const selectedStartLocation = ref<LocationResult | null>(null)
const selectedEndLocation = ref<LocationResult | null>(null)
const isCalculatingDistance = ref(false)
const isGettingLocation = ref(false)
const routeInfo = ref({ distance: 0, time: 0, coordinates: [] as [number, number][] })
const focusedInput = ref<'start' | 'end' | null>(null)

// 距離編輯相關
const autoCalculatedDistance = ref(0)
const isManualOverride = ref(false)

// Template refs
const endLocationSearchRef = ref<{ focus: () => void } | null>(null)

// Helper function to create fallback location when reverse geocoding fails
const createFallbackLocation = (latitude: number, longitude: number): LocationResult => {
  const coordsLabel = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

  return {
    x: longitude,
    y: latitude,
    nameEN: 'Custom Location',
    nameZH: '自訂位置',
    addressEN: coordsLabel,
    addressZH: coordsLabel,
    districtEN: '',
    districtZH: '',
    displayAddress: `${t('taxiCalculator.customLocation')} (${coordsLabel})`
  }
}

// Auto-select Cross Harbour Tunnel for cross-harbour routes
const autoSelectCrossHarbourTunnel = () => {
  if (!selectedStartLocation.value || !selectedEndLocation.value) return

  if (shouldAutoSelectCrossHarbour(selectedStartLocation.value, selectedEndLocation.value)) {
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

  // Reset distance and auto-calculated distance when location is cleared
  if (!location) {
    distance.value = 0
    autoCalculatedDistance.value = 0
    isManualOverride.value = false
  }

  useTrackEvent('taxi_start_location_selected')

  // Auto-select Cross Harbour Tunnel if needed
  if (location && selectedEndLocation.value) {
    autoSelectCrossHarbourTunnel()
  }

  if (canCalculateDistance.value) {
    await handleCalculateDistance()
  }
  emitLocations()

  // Auto-focus end location input if start location is set but end is not
  if (location && !selectedEndLocation.value) {
    nextTick(() => {
      endLocationSearchRef.value?.focus()
    })
  }
}

const selectEndLocation = async (location: LocationResult | null) => {
  selectedEndLocation.value = location
  routeInfo.value = { distance: 0, time: 0, coordinates: [] }

  // Reset distance and auto-calculated distance when location is cleared
  if (!location) {
    distance.value = 0
    autoCalculatedDistance.value = 0
    isManualOverride.value = false
  }

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

// Suggest taxi type based on route
const suggestTaxiType = () => {
  const suggested = detectTaxiType(selectedStartLocation.value, selectedEndLocation.value)

  if (suggested && taxiType.value !== suggested) {
    suggestedTaxiType.value = suggested
    showSuggestion.value = true
    useTrackEvent('taxi_type_suggestion_shown', { suggested })
    return
  }

  // Clear suggestion if not applicable
  suggestedTaxiType.value = null
  showSuggestion.value = false
}

// Handle suggestion dismissal
const dismissSuggestion = () => {
  showSuggestion.value = false
}

// Handle marker dragged events
const handleMarkerDragged = async ({ type, latitude, longitude }: { type: 'start' | 'end', latitude: number, longitude: number }) => {
  // Track analytics
  useTrackEvent(`taxi_marker_dragged_${type}`)

  // Immediately update location with coordinates (non-blocking)
  const tempLocation = createFallbackLocation(latitude, longitude)

  if (type === 'start') {
    selectedStartLocation.value = tempLocation
    startLocationSearch.value = tempLocation.displayAddress
  } else {
    selectedEndLocation.value = tempLocation
    endLocationSearch.value = tempLocation.displayAddress
  }

  // Emit to parent immediately
  emitLocations()

  // Auto-select cross-harbour tunnel if applicable
  if (selectedStartLocation.value && selectedEndLocation.value) {
    autoSelectCrossHarbourTunnel()
  }

  // Recalculate route (this will show loading overlay, but that's for route calculation)
  if (canCalculateDistance.value) {
    await handleCalculateDistance()
  }

  // Do reverse geocoding in background to get proper address
  try {
    const location = await reverseGeocode(latitude, longitude)

    // Update with geocoded address if successful
    if (location) {
      if (type === 'start') {
        selectedStartLocation.value = location
        startLocationSearch.value = location.displayAddress
        useTrackEvent('taxi_start_location_dragged')
      } else {
        selectedEndLocation.value = location
        endLocationSearch.value = location.displayAddress
        useTrackEvent('taxi_end_location_dragged')
      }

      // Emit updated location to parent
      emitLocations()
    } else {
      // Geocoding failed, keep the coordinates-based location
      console.warn('Reverse geocoding failed, using coordinates only')
      useTrackEvent(`taxi_marker_drag_geocode_failed_${type}`)
    }
  } catch (error) {
    console.error(`Error in reverse geocoding for ${type} marker:`, error)
    useTrackEvent(`taxi_marker_drag_error_${type}`)
    // Keep the coordinates-based location on error
  }
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
        enableHighAccuracy: GEOLOCATION_CONSTANTS.ENABLE_HIGH_ACCURACY,
        timeout: GEOLOCATION_CONSTANTS.TIMEOUT,
        maximumAge: GEOLOCATION_CONSTANTS.MAXIMUM_AGE
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

// 重新整理計算 - 作為全面重置的後備方案
const handleRefresh = async () => {
  // 清除沒有選擇地點的輸入框
  if (!selectedStartLocation.value) {
    startLocationSearch.value = ''
  }
  if (!selectedEndLocation.value) {
    endLocationSearch.value = ''
  }

  // 如果兩個地點都有設置，重新計算所有內容
  if (selectedStartLocation.value && selectedEndLocation.value) {
    // 重置手動覆蓋
    isManualOverride.value = false

    // 清除舊的路線資訊
    routeInfo.value = { distance: 0, time: 0, coordinates: [] }

    // 重新清除並檢測過海隧道
    selectedTunnels.value = selectedTunnels.value.filter(t => t !== 'crossHarbour')
    autoSelectCrossHarbourTunnel()

    // 重新計算距離
    await handleCalculateDistance()

    // 重新建議的士類型
    suggestTaxiType()

    useTrackEvent('taxi_refresh_calculation')
  }
}

// Watch for initial location props from parent (URL restoration)
watch(() => props.initialStartLocation, (newLocation, oldLocation) => {
  if (newLocation) {
    // Check if coordinates actually changed
    const coordsChanged = !oldLocation ||
      oldLocation.x !== newLocation.x ||
      oldLocation.y !== newLocation.y

    selectedStartLocation.value = newLocation
    startLocationSearch.value = newLocation.displayAddress

    // Only trigger distance calculation if coordinates changed
    if (coordsChanged && selectedEndLocation.value) {
      autoSelectCrossHarbourTunnel()
      handleCalculateDistance()
    }
    emitLocations()
  }
}, { immediate: true })

watch(() => props.initialEndLocation, (newLocation, oldLocation) => {
  if (newLocation) {
    // Check if coordinates actually changed
    const coordsChanged = !oldLocation ||
      oldLocation.x !== newLocation.x ||
      oldLocation.y !== newLocation.y

    selectedEndLocation.value = newLocation
    endLocationSearch.value = newLocation.displayAddress

    // Only trigger distance calculation if coordinates changed
    if (coordsChanged && selectedStartLocation.value) {
      autoSelectCrossHarbourTunnel()
      handleCalculateDistance()
    }
    emitLocations()
  }
}, { immediate: true })

// 在組件掛載時追蹤計程車計算器打開事件，並嘗試獲取用戶位置
onMounted(() => {
  // Note: isCalculating computed will be available after this, so we use direct values for now
  emit('update:fare', {
    totalFare: totalFare.value,
    breakdown: fareBreakdown.value,
    isCalculating: false
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
    return total + (TUNNEL_FEES[tunnelId] || 0);
  }, 0)
)

// 獲取行李費總額
const getLuggageFees = computed(() => Number(luggageCount.value) * rates.value.luggageFee)

// 計算回程收費
const getReturnTollFee = computed(() => {
  const hasSelectedCrossHarbour = selectedTunnels.value.includes('crossHarbour')
  return (hasSelectedCrossHarbour && !isCrossHarbourTaxiStand.value) ? TUNNEL_FEES.crossHarbour : 0
})

const rates = computed(() => {
  return TAXI_RATES[taxiType.value]
})

// 使用 computed 計算距離費用
const distanceFare = computed(() => {
  // 如果距離為0或未填寫，不計算距離費用
  if (!distance.value || distance.value <= 0 || distance.value <= TAXI_FARE_CONSTANTS.FIRST_TIER_DISTANCE) {
    return 0;
  }

  const additionalDistance = distance.value - TAXI_FARE_CONSTANTS.FIRST_TIER_DISTANCE;
  const additionalSegments = Math.ceil(additionalDistance / TAXI_FARE_CONSTANTS.INCREMENTAL_SEGMENT);
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
    breakdown: fareBreakdown.value,
    isCalculating: isCalculating.value
  })
})

// Use isCalculatingDistance directly for loading state
const isCalculating = computed(() => {
  return isCalculatingDistance.value
})

// Watch isCalculating to emit updates
watch(isCalculating, () => {
  emit('update:fare', {
    totalFare: totalFare.value,
    breakdown: fareBreakdown.value,
    isCalculating: isCalculating.value
  })
})

// Watch focusedInput and emit to parent
watch(focusedInput, (newValue) => {
  emit('update:focusedInput', newValue)
})

// Handle map click to set location
const handleMapClick = async (latitude: number, longitude: number) => {
  // Only set location if the corresponding marker doesn't exist
  if (focusedInput.value === 'start' && !selectedStartLocation.value) {
    const tempLocation = createFallbackLocation(latitude, longitude)
    selectedStartLocation.value = tempLocation
    startLocationSearch.value = tempLocation.displayAddress
    emitLocations()

    // Track analytics
    useTrackEvent('taxi_map_click_set_start')

    // Do reverse geocoding in background
    try {
      const location = await reverseGeocode(latitude, longitude)
      if (location) {
        selectedStartLocation.value = location
        startLocationSearch.value = location.displayAddress
        emitLocations()
      }
    } catch (error) {
      console.error('Error reverse geocoding map click:', error)
    }

    // Auto-focus end location input after setting start
    if (!selectedEndLocation.value) {
      nextTick(() => {
        endLocationSearchRef.value?.focus()
      })
    }
  } else if (focusedInput.value === 'end' && !selectedEndLocation.value) {
    const tempLocation = createFallbackLocation(latitude, longitude)
    selectedEndLocation.value = tempLocation
    endLocationSearch.value = tempLocation.displayAddress
    emitLocations()

    // Track analytics
    useTrackEvent('taxi_map_click_set_end')

    // Auto-select cross-harbour tunnel if applicable
    if (selectedStartLocation.value) {
      autoSelectCrossHarbourTunnel()
    }

    // Calculate route if both locations are set
    if (canCalculateDistance.value) {
      await handleCalculateDistance()
    }

    // Do reverse geocoding in background
    try {
      const location = await reverseGeocode(latitude, longitude)
      if (location) {
        selectedEndLocation.value = location
        endLocationSearch.value = location.displayAddress
        emitLocations()
      }
    } catch (error) {
      console.error('Error reverse geocoding map click:', error)
    }
  }
}

// Expose handleMarkerDragged and handleMapClick to parent component
defineExpose({
  handleMarkerDragged,
  handleMapClick
})

</script>
