<template>
  <UCard class="mb-8">
    <template #header>
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-highlighted">{{ $t('taxiCalculator.title') }}</h2>
        <div class="flex items-center gap-2">
          <UBadge color="neutral" variant="soft" size="lg">🇭🇰</UBadge>
          <!-- 重新整理按鈕 -->
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            class="rounded-full"
            icon="i-heroicons-arrow-path"
            :title="$t('taxiCalculator.refreshCalculation')"
            :aria-label="$t('taxiCalculator.refreshCalculation')"
            @click="handleRefresh"
          />
        </div>
      </div>
    </template>

    <form>
      <div class="space-y-6">
        <!-- 地點搜尋 -->
        <div class="grid grid-cols-1 gap-6">
          <!-- 起點搜尋 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <label for="startLocation" class="text-default font-medium">
              {{ $t('taxiCalculator.startLocation') }}
            </label>
            <div class="flex space-x-2">
              <LocationSearch
                id="startLocation"
                ref="startLocationSearchRef"
                v-model="startLocationSearch"
                class="grow"
                @select="selectStartLocation"
                @focus="focusedInput = 'start'"
                @blur="focusedInput = null"
              />
              <!-- 只在支援地理位置時才顯示定位按鈕 -->
              <UButton
                v-if="isGeolocationSupported"
                color="success"
                icon="i-heroicons-map-pin"
                :loading="isGettingLocation"
                :disabled="isGettingLocation"
                :title="$t('taxiCalculator.useCurrentLocation')"
                :aria-label="$t('taxiCalculator.useCurrentLocation')"
                @click="getCurrentLocation"
              />
            </div>
          </div>

          <!-- 終點搜尋 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <label for="endLocation" class="text-default font-medium">
              {{ $t('taxiCalculator.endLocation') }}
            </label>
            <div class="flex space-x-2">
              <LocationSearch
                id="endLocation"
                ref="endLocationSearchRef"
                v-model="endLocationSearch"
                class="grow"
                @select="selectEndLocation"
                @focus="focusedInput = 'end'"
                @blur="focusedInput = null"
              />
              <!-- 交換起終點按鈕 -->
              <UButton
                color="neutral"
                variant="outline"
                icon="i-heroicons-arrows-up-down"
                :disabled="!selectedStartLocation || !selectedEndLocation"
                :title="$t('taxiCalculator.swapLocations')"
                :aria-label="$t('taxiCalculator.swapLocations')"
                @click="swapLocations"
              />
            </div>
          </div>

          <div v-if="totalFare > 0 || isCalculatingDistance" class="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700/50">
            <a
              href="#taxi-fare-detail"
              class="flex items-center justify-between group"
              :title="$t('taxiCalculator.viewDetails')"
              @click="track('inline_summary_taxi_fare_clicked', { total_fare_hkd: totalFare, taxi_type: taxiType })"
            >
              <span class="text-sm font-medium text-default group-hover:underline">{{ $t('taxiCalculator.estimatedFare') }}</span>
              <span v-if="isCalculatingDistance" class="text-lg font-bold text-primary flex items-center gap-2">
                <span class="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"/>
                {{ $t('taxiCalculator.calculatingFare') }}
              </span>
              <span v-else class="text-2xl font-bold text-primary group-hover:underline">HK$ {{ totalFare.toFixed(2) }}</span>
            </a>
            <div v-if="!isCalculatingDistance && routeInfo.time > 0" class="text-xs text-dimmed leading-tight">
              ~{{ Math.round(routeInfo.time / 60) }} {{ $t('transitComparison.min') }}<template v-if="transitMinutesSaved > 0"> · <a
                href="#transit-detail"
                :class="transitSavingsLinkClass"
                :title="$t('taxiCalculator.viewDetails')"
                @click="track('inline_summary_transit_clicked', { tier: taxiValueTier, minutes_saved: transitMinutesSaved })"
              >{{ $t('transitComparison.timeSavedShort', { minutes: transitMinutesSaved }) }}</a></template>
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
          v-model:tunnel-fee-type="tunnelFeeType"
          v-model:is-discount-fare="isDiscountFare"
          v-model:luggage-count="luggageCount"
          v-model:show-advanced-options="showAdvancedOptions"
        />

      </div>
    </form>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { watchImmediate } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { coordKey, useLocationSearch } from '../composables/useLocationSearch'
import { useLocationDetection } from '../composables/useLocationDetection'
import LocationSearch from './LocationSearch.vue'
import TaxiTypeSelector from './TaxiTypeSelector.vue'
import DistanceInput from './DistanceInput.vue'
import AdvancedOptions from './AdvancedOptions.vue'
import type { LocationResult, LocationSlot } from '~/types/location'
import type { TaxiType, TunnelId } from '~/types/constants'
import {
  GEOLOCATION_CONSTANTS,
} from '~/types/constants'
import { createLocationFromCoordinates } from '~/utils/location'
import { calculateTotalFare } from '~/utils/fareCalculation'
import type { TransitComparison } from '~/utils/transitValue'
import { summarizeTransitLegs } from '~/utils/transitValue'
import { useTransitComparison } from '~/composables/useTransitComparison'
import { distanceBucket } from '~/utils/analytics'

const props = defineProps<{
  initialStartLocation?: LocationResult | null
  initialEndLocation?: LocationResult | null
  skipGpsAutoRequest?: boolean
}>()

const emit = defineEmits(['update:locations', 'update:fare', 'update:focusedInput', 'update:transitInfo', 'update:initialGpsPending'])

const { t } = useI18n()
const { calculateDrivingDistance, getCachedRoute, clearRouteCache, calculateTransitRoute, clearTransitCache, reverseGeocode } = useLocationSearch()
const { shouldAutoSelectCrossHarbour, suggestTaxiType: detectTaxiType } = useLocationDetection()
const { track } = useAnalytics()

const taxiType = ref<TaxiType>('urban')
const suggestedTaxiType = ref<TaxiType | null>(null)
const showSuggestion = ref(false)
const distance = ref(0)
const selectedTunnels = ref<TunnelId[]>([])
const tunnelFeeType = ref<'oneWay' | 'return'>('return')
const isDiscountFare = ref(false)
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
const transitInfo = ref<TransitComparison | null>(null)
const focusedInput = ref<LocationSlot | null>(null)

// 距離編輯相關
const autoCalculatedDistance = ref(0)
const isManualOverride = ref(false)

// Template refs
const startLocationSearchRef = ref<{ focus: (options?: FocusOptions) => void } | null>(null)
const endLocationSearchRef = ref<{ focus: (options?: FocusOptions) => void } | null>(null)

const slotLocation = { start: selectedStartLocation, end: selectedEndLocation }
const slotSearch = { start: startLocationSearch, end: endLocationSearch }
const otherSlot = (slot: LocationSlot): LocationSlot => slot === 'start' ? 'end' : 'start'

// Abort controllers to cancel stale async operations (distance calc, geocoding per slot)
let distanceAbort: AbortController | null = null
let transitAbort: AbortController | null = null
const geocodeAborts: Record<LocationSlot, AbortController | null> = { start: null, end: null }

// 出租車類型標籤
const taxiTypeLabel = computed(() => {
  const typeMap: Record<TaxiType, string> = {
    urban: t('taxiCalculator.urban'),
    newTerritories: t('taxiCalculator.newTerritories'),
    lantau: t('taxiCalculator.lantau'),
  }
  return typeMap[taxiType.value]
})

const fareResult = computed(() => calculateTotalFare({
  distance: distance.value,
  taxiType: taxiType.value,
  selectedTunnels: selectedTunnels.value,
  tunnelFeeType: tunnelFeeType.value,
  isDiscountFare: isDiscountFare.value,
  luggageCount: luggageCount.value,
}))

const totalFare = computed(() => fareResult.value.totalFare)

const fareBreakdown = computed(() => ({
  ...fareResult.value.breakdown,
  taxiTypeLabel: taxiTypeLabel.value,
}))

const {
  minutesSaved: transitMinutesSaved,
  tier: taxiValueTier,
  tierClasses,
} = useTransitComparison(transitInfo, totalFare)

const createFallbackLocation = (latitude: number, longitude: number): LocationResult => {
  const coordsLabel = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  return createLocationFromCoordinates(latitude, longitude, `${t('taxiCalculator.customLocation')} (${coordsLabel})`)
}

/** Point a slot at a location, sync its search box, and tell the parent. */
const setSlotLocation = (slot: LocationSlot, location: LocationResult) => {
  slotLocation[slot].value = location
  slotSearch[slot].value = location.displayAddress
  emitLocations()
}

const abortSlotGeocode = (slot: LocationSlot) => {
  geocodeAborts[slot]?.abort()
  geocodeAborts[slot] = null
}

/** Cancel any in-flight geocode for a slot and take ownership of the next one. */
const beginSlotGeocode = (slot: LocationSlot): AbortController => {
  geocodeAborts[slot]?.abort()
  return (geocodeAborts[slot] = new AbortController())
}

// Auto-select Cross Harbour Tunnel for cross-harbour routes
const autoSelectCrossHarbourTunnel = () => {
  if (!selectedStartLocation.value || !selectedEndLocation.value) return

  if (shouldAutoSelectCrossHarbour(selectedStartLocation.value, selectedEndLocation.value)) {
    if (!selectedTunnels.value.includes('crossHarbour')) {
      selectedTunnels.value.push('crossHarbour')
      showAdvancedOptions.value = true // Auto-expand to show the auto-selected tunnel
      track('taxi_cross_harbour_tunnel_auto_selected')
    }
  }
}

const selectLocation = async (type: LocationSlot, location: LocationResult | null, source?: 'search' | 'recent') => {
  // Abort any in-flight geocoding for this slot
  abortSlotGeocode(type)

  const otherLocation = slotLocation[otherSlot(type)]
  slotLocation[type].value = location
  routeInfo.value = { distance: 0, time: 0, coordinates: [] }

  // Clear transit info and abort any in-flight transit request
  transitAbort?.abort()
  transitAbort = null
  transitInfo.value = null
  emit('update:transitInfo', null)

  // Reset distance and auto-calculated distance when location is cleared
  if (!location) {
    distance.value = 0
    autoCalculatedDistance.value = 0
    isManualOverride.value = false
  }

  track('taxi_location_selected', {
    slot: type,
    source: source ?? 'programmatic',
    has_other_location: Boolean(otherLocation.value),
  }, {
    ga4Event: source
      ? `taxi_${type}_location_selected_${source}`
      : `taxi_${type}_location_selected`,
  })

  // Auto-select Cross Harbour Tunnel if needed
  if (location && otherLocation.value) {
    autoSelectCrossHarbourTunnel()
  }

  if (canCalculateDistance.value) {
    await handleCalculateDistance()
  }
  emitLocations()

  // Auto-focus end location input if start location is set but end is not
  if (type === 'start' && location && !selectedEndLocation.value) {
    nextTick(() => {
      endLocationSearchRef.value?.focus({ preventScroll: true })
    })
  }
}

const selectStartLocation = (location: LocationResult | null, source?: 'search' | 'recent') => selectLocation('start', location, source)
const selectEndLocation = (location: LocationResult | null, source?: 'search' | 'recent') => selectLocation('end', location, source)

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

const transitSavingsLinkClass = computed(() => `${tierClasses.value.savingsText} hover:underline`)

// Suggest taxi type based on route
const suggestTaxiType = () => {
  const suggested = detectTaxiType(selectedStartLocation.value, selectedEndLocation.value)

  if (suggested && taxiType.value !== suggested) {
    suggestedTaxiType.value = suggested
    showSuggestion.value = true
    track('taxi_type_suggestion_shown', {
      suggested,
      current_type: taxiType.value,
    })
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
const handleMarkerDragged = async ({ type, latitude, longitude }: { type: LocationSlot, latitude: number, longitude: number }) => {
  track('taxi_marker_dragged', { slot: type }, { ga4Event: `taxi_marker_dragged_${type}` })

  // Show the raw coordinates immediately; the geocoded address replaces them below
  setSlotLocation(type, createFallbackLocation(latitude, longitude))

  autoSelectCrossHarbourTunnel()

  if (canCalculateDistance.value) {
    await handleCalculateDistance()
  }

  const controller = beginSlotGeocode(type)

  try {
    const location = await reverseGeocode(latitude, longitude, controller.signal)

    // Update with geocoded address if successful
    if (location) {
      setSlotLocation(type, location)
      track('taxi_marker_drag_geocoded', { slot: type }, { ga4Event: `taxi_marker_drag_geocoded_${type}` })
    } else {
      // Geocoding failed, keep the coordinates-based location
      console.warn('Reverse geocoding failed, using coordinates only')
      track('taxi_marker_drag_geocode_failed', { slot: type }, { ga4Event: `taxi_marker_drag_geocode_failed_${type}` })
    }
  } catch (error) {
    if (controller.signal.aborted) return
    console.error(`Error in reverse geocoding for ${type} marker:`, error)
    track('taxi_marker_drag_error', { slot: type }, { ga4Event: `taxi_marker_drag_error_${type}` })
    // Keep the coordinates-based location on error
  }
}

// Apply distance/fare state from route result
const applyRouteDistance = (result: { distance: number; time: number }) => {
  autoCalculatedDistance.value = parseFloat((result.distance / 1000).toFixed(1))
  if (!isManualOverride.value) {
    distance.value = autoCalculatedDistance.value
  }
  suggestTaxiType()
}

// Fire-and-forget transit comparison (never blocks fare calculation)
const handleCalculateTransit = async () => {
  if (!selectedStartLocation.value || !selectedEndLocation.value) return

  transitAbort?.abort()
  const controller = transitAbort = new AbortController()

  const loadingPayload = {
    transitDurationSeconds: 0,
    transitFareMin: 0,
    transitFareMax: 0,
    transitWalkSeconds: 0,
    transitWaitSeconds: 0,
    drivingTimeSeconds: routeInfo.value.time,
    isCalculating: true,
  }
  transitInfo.value = loadingPayload
  emit('update:transitInfo', loadingPayload)

  try {
    const result = await calculateTransitRoute(
      selectedStartLocation.value,
      selectedEndLocation.value,
      undefined,
      controller.signal
    )

    if (controller.signal.aborted) return

    const fastest = result?.plans?.[0]
    if (fastest) {
      const { walkSeconds, waitSeconds } = summarizeTransitLegs(fastest.legs ?? [])
      const payload = {
        transitDurationSeconds: fastest.duration_seconds,
        transitFareMin: (fastest.fares_min ?? 0) / 100,
        transitFareMax: (fastest.fares_max ?? 0) / 100,
        transitWalkSeconds: walkSeconds,
        transitWaitSeconds: waitSeconds,
        drivingTimeSeconds: routeInfo.value.time,
        isCalculating: false,
      }
      transitInfo.value = payload
      emit('update:transitInfo', payload)
      // Both read through the composable, which now sees the payload assigned above.
      const tier = taxiValueTier.value ?? 'unknown'
      track('transit_comparison_loaded', {
        tier,
        minutes_saved: transitMinutesSaved.value,
        taxi_fare_hkd: totalFare.value,
        transit_fare_min_hkd: payload.transitFareMin,
        transit_fare_max_hkd: payload.transitFareMax,
        taxi_time_seconds: payload.drivingTimeSeconds,
        transit_time_seconds: payload.transitDurationSeconds,
        transit_walk_seconds: payload.transitWalkSeconds,
        transit_wait_seconds: payload.transitWaitSeconds,
        distance_km: distance.value,
        distance_bucket: distanceBucket(distance.value),
      }, { ga4Event: `transit_comparison_loaded_${tier}` })
    } else {
      transitInfo.value = null
      emit('update:transitInfo', null)
    }
  } catch {
    if (controller.signal.aborted) return
    transitInfo.value = null
    emit('update:transitInfo', null)
    track('transit_comparison_error')
  }
}

// 重構計算距離函數
const handleCalculateDistance = async () => {
  if (!selectedStartLocation.value || !selectedEndLocation.value) {
    return
  }
  distanceAbort?.abort()
  const controller = distanceAbort = new AbortController()

  // Phase 1: Try precomputed cache for instant fare (no polyline)
  const cached = getCachedRoute(selectedStartLocation.value, selectedEndLocation.value)
  if (cached) {
    routeInfo.value = cached
    applyRouteDistance(cached)
    track('taxi_distance_cache_hit', {
      distance_km: parseFloat((cached.distance / 1000).toFixed(1)),
      distance_bucket: distanceBucket(cached.distance / 1000),
    })
  } else {
    isCalculatingDistance.value = true
  }

  let osrmSucceeded = false
  try {
    const result = await calculateDrivingDistance(
      selectedStartLocation.value,
      selectedEndLocation.value,
      controller.signal
    )

    routeInfo.value = result
    applyRouteDistance(result)
    if (!cached) {
      const km = parseFloat((result.distance / 1000).toFixed(1))
      track('taxi_distance_auto_calculated', {
        distance_km: km,
        distance_bucket: distanceBucket(km),
        time_seconds: result.time,
      })
    }
    osrmSucceeded = true
  } catch (error) {
    if (controller.signal.aborted) return
    if (!cached) console.error('Error handling distance calculation:', error)
  } finally {
    if (!controller.signal.aborted) {
      isCalculatingDistance.value = false
    }
  }

  if (controller.signal.aborted) return

  if (osrmSucceeded || cached) {
    emitLocations()
    handleCalculateTransit()
  }
}

// 獲取當前位置
const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    alert(t('taxiCalculator.geolocationNotSupported'))
    return
  }

  const controller = beginSlotGeocode('start')
  isGettingLocation.value = true
  track('taxi_get_current_location_attempt')

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: GEOLOCATION_CONSTANTS.ENABLE_HIGH_ACCURACY,
        timeout: GEOLOCATION_CONSTANTS.TIMEOUT,
        maximumAge: GEOLOCATION_CONSTANTS.MAXIMUM_AGE
      })
    })

    if (controller.signal.aborted) return // User selected another start location

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
      const geoLocation = await reverseGeocode(latitude, longitude, controller.signal)
      if (geoLocation) {
        location = geoLocation
      }
    } catch (error) {
      if (controller.signal.aborted) return
      console.error("Error getting address from coordinates:", error)
      // 繼續使用基本位置信息
    }

    // 更新位置
    startLocationSearch.value = location.displayAddress
    geocodeAborts.start = null
    await selectStartLocation(location)
    track('taxi_get_current_location_success', {
      reverse_geocoded: location.addressEN !== '' || location.addressZH !== '',
    })
  } catch (error) {
    if (controller.signal.aborted) return
    console.error("Error getting current location:", error)
    alert(t('taxiCalculator.geolocationError'))
    track('taxi_get_current_location_error')
  } finally {
    if (!controller.signal.aborted) {
      isGettingLocation.value = false
    }
  }
}

// 交換起終點位置
const swapLocations = async () => {
  if (!selectedStartLocation.value || !selectedEndLocation.value) {
    return
  }

  // Abort any in-flight geocoding and transit requests
  abortSlotGeocode('start')
  abortSlotGeocode('end')
  transitAbort?.abort(); transitAbort = null
  emit('update:transitInfo', null)

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
  track('taxi_locations_swapped', { distance_km: distance.value })
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

    // 清除舊的路線及交通資訊
    routeInfo.value = { distance: 0, time: 0, coordinates: [] }
    transitAbort?.abort(); transitAbort = null
    emit('update:transitInfo', null)

    // 清除快取以強制重新獲取最新路線及交通資料
    clearRouteCache(selectedStartLocation.value, selectedEndLocation.value)
    clearTransitCache(selectedStartLocation.value, selectedEndLocation.value)

    // 重新清除並檢測過海隧道
    selectedTunnels.value = selectedTunnels.value.filter(t => t !== 'crossHarbour')
    autoSelectCrossHarbourTunnel()

    // 重新計算距離
    await handleCalculateDistance()

    // 重新建議的士類型
    suggestTaxiType()

    track('taxi_refresh_calculation', {
      taxi_type: taxiType.value,
      distance_km: distance.value,
    })
  }
}

watchImmediate(() => [props.initialStartLocation, props.initialEndLocation] as const, ([newStart, newEnd], oldValue) => {
  const [oldStart, oldEnd] = oldValue ?? [undefined, undefined]
  let locationsChanged = false
  let coordsChanged = false

  if (newStart) {
    const startCoordsChanged = !oldStart ||
      coordKey(oldStart.x, oldStart.y) !== coordKey(newStart.x, newStart.y)
    if (startCoordsChanged) coordsChanged = true

    selectedStartLocation.value = newStart
    startLocationSearch.value = newStart.displayAddress
    locationsChanged = true
  }

  if (newEnd) {
    const endCoordsChanged = !oldEnd ||
      coordKey(oldEnd.x, oldEnd.y) !== coordKey(newEnd.x, newEnd.y)
    if (endCoordsChanged) coordsChanged = true

    selectedEndLocation.value = newEnd
    endLocationSearch.value = newEnd.displayAddress
    locationsChanged = true
  }

  if (coordsChanged && selectedStartLocation.value && selectedEndLocation.value) {
    autoSelectCrossHarbourTunnel()
    handleCalculateDistance()
  }

  if (locationsChanged) {
    emitLocations()
  }
})

onUnmounted(() => {
  distanceAbort?.abort()
  abortSlotGeocode('start')
  abortSlotGeocode('end')
  transitAbort?.abort()
})

// 在組件掛載時追蹤計程車計算器打開事件，並嘗試獲取用戶位置
onMounted(() => {
  isGeolocationSupported.value = typeof navigator !== 'undefined' && !!navigator.geolocation

  emit('update:fare', {
    totalFare: totalFare.value,
    breakdown: fareBreakdown.value,
    isCalculating: false
  })
  track('taxi_calculator_opened', {
    has_initial_locations: Boolean(props.initialStartLocation || props.initialEndLocation),
    skip_gps: Boolean(props.skipGpsAutoRequest),
  })

  if (isGeolocationSupported.value && !selectedStartLocation.value && !props.skipGpsAutoRequest) {
    emit('update:initialGpsPending', true)
    getCurrentLocation().finally(() => {
      emit('update:initialGpsPending', false)
      // Skip focus if a manual GPS retry is already in flight — when the user
      // re-clicks GPS mid-prompt, the initial controller aborts but this
      // .finally() still runs, and we'd otherwise yank focus mid-second-attempt.
      if (!selectedStartLocation.value && !isGettingLocation.value) {
        startLocationSearchRef.value?.focus({ preventScroll: true })
      }
    })
  }
})

watch(totalFare, (newTotalFare, prevTotalFare) => {
  if (newTotalFare > 0 && newTotalFare !== prevTotalFare) {
    track('taxi_fare_calculated', {
      taxi_type: taxiType.value,
      distance_km: distance.value,
      distance_bucket: distanceBucket(distance.value),
      total_fare_hkd: newTotalFare,
      tunnel_count: selectedTunnels.value.length,
      has_cross_harbour: selectedTunnels.value.includes('crossHarbour'),
      tunnel_fee_type: tunnelFeeType.value,
      is_discount_fare: isDiscountFare.value,
      luggage_count: luggageCount.value,
      is_manual_distance: isManualOverride.value,
    })
  }
})

watch([totalFare, isCalculatingDistance], ([newTotalFare, calculating]) => {
  emit('update:fare', {
    totalFare: newTotalFare,
    breakdown: fareBreakdown.value,
    isCalculating: calculating
  })
})

watch(focusedInput, (newValue) => {
  emit('update:focusedInput', newValue)
})

// Handle map click to set location.
// `target` is the input that was focused when the map mousedown fired —
// the input's blur fires before click, so we can't rely on focusedInput here.
const handleMapClick = async (latitude: number, longitude: number, target: LocationSlot) => {
  // Only set location if the corresponding marker doesn't exist
  if (slotLocation[target].value) return

  setSlotLocation(target, createFallbackLocation(latitude, longitude))

  track('taxi_map_click_set_location', { slot: target }, { ga4Event: `taxi_map_click_set_${target}` })

  // Fire the geocode before awaiting the route so the address label isn't
  // gated on OSRM. Catching here (rather than at the await) keeps a rejection
  // from surfacing as unhandled while handleCalculateDistance is in flight.
  const controller = beginSlotGeocode(target)
  const geocoding = reverseGeocode(latitude, longitude, controller.signal).catch((error) => {
    if (!controller.signal.aborted) console.error('Error reverse geocoding map click:', error)
    return null
  })

  autoSelectCrossHarbourTunnel()

  if (canCalculateDistance.value) {
    await handleCalculateDistance()
  }

  // Auto-focus end location input after setting start
  if (target === 'start' && !selectedEndLocation.value) {
    nextTick(() => {
      endLocationSearchRef.value?.focus({ preventScroll: true })
    })
  }

  const location = await geocoding
  if (location) setSlotLocation(target, location)
}

// Expose handleMarkerDragged and handleMapClick to parent component
defineExpose({
  handleMarkerDragged,
  handleMapClick
})

</script>
