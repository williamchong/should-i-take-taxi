<template>
  <div
    class="h-[33vh] md:h-[40vh] w-full rounded-lg shadow-md overflow-hidden relative"
  >
    <Transition name="fade">
      <div v-if="isLoading || isCalculatingDistance" class="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center z-[1000]">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"/>
      </div>
    </Transition>
    <ClientOnly>
      <LMap
        ref="map"
        :zoom="MAP_CONSTANTS.DEFAULT_ZOOM"
        :center="center"
        :use-global-leaflet="false"
        :min-zoom="MAP_CONSTANTS.MIN_ZOOM"
        :max-zoom="MAP_CONSTANTS.MAX_ZOOM"
        @ready="onMapReady"
      >
        <LTileLayer
          :url="tileLayerUrl"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <LMarker
          v-if="startLocation && startIcon"
          :lat-lng="[startLocation.y, startLocation.x]"
          :icon="startIcon"
          :draggable="true"
          @dragend="handleStartMarkerDragEnd"
        />
        <LMarker
          v-if="endLocation && endIcon"
          :lat-lng="[endLocation.y, endLocation.x]"
          :icon="endIcon"
          :draggable="true"
          @dragend="handleEndMarkerDragEnd"
        />
        <LPolyline
          v-if="routeCoordinates.length > 0"
          :lat-lngs="routeCoordinates"
          :color="MAP_CONSTANTS.ROUTE_COLOR"
          :weight="MAP_CONSTANTS.ROUTE_WEIGHT"
          :opacity="MAP_CONSTANTS.ROUTE_OPACITY"
        />
        <!-- Bounding box visualization -->
        <LRectangle
          v-if="showBoundingBoxes"
          :bounds="toBounds(LANTAU_BOUNDING_BOX)"
          :color="'#3b82f6'"
          :weight="2"
          :fill-opacity="0.1"
          :dash-array="'5, 5'"
        >
          <LTooltip :content="'Lantau Island Bounding Box'" />
        </LRectangle>
        <!-- Hong Kong Island: Box 1 (Main Island) -->
        <LRectangle
          v-if="showBoundingBoxes"
          :bounds="toBounds(HK_ISLAND_BOX_1)"
          :color="'#ef4444'"
          :weight="2"
          :fill-opacity="0.1"
          :dash-array="'5, 5'"
        >
          <LTooltip :content="'HK Island Box 1: Main Island'" />
        </LRectangle>
        <!-- Hong Kong Island: Box 2 (Northern Shore Extension) -->
        <LRectangle
          v-if="showBoundingBoxes"
          :bounds="toBounds(HK_ISLAND_BOX_2)"
          :color="'#ef4444'"
          :weight="2"
          :fill-opacity="0.15"
          :dash-array="'5, 5'"
        >
          <LTooltip :content="'HK Island Box 2: Northern Shore'" />
        </LRectangle>
      </LMap>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { LocationResult } from '~/types/location'
import type { LatLngExpression } from 'leaflet'
import {
  LANTAU_BOUNDING_BOX,
  HK_ISLAND_BOX_1,
  HK_ISLAND_BOX_2,
  toBounds,
} from '~/utils/boundingBoxes'
import { MAP_CONSTANTS } from '~/types/constants'

const props = defineProps<{
  startLocation: LocationResult | null
  endLocation: LocationResult | null
  routeCoordinates?: [number, number][]
  showBoundingBoxes?: boolean
  isCalculatingDistance?: boolean
}>()

const emit = defineEmits<{
  'marker-dragged': [{ type: 'start' | 'end', latitude: number, longitude: number }]
}>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = ref(null as any)
const isLoading = ref(true)

const { isDark } = useDarkMode()

// Custom marker icons - use shallowRef to avoid deep reactivity on Leaflet objects
// These will be undefined during SSR, but that's fine since the map is in ClientOnly
const startIcon = shallowRef()
const endIcon = shallowRef()

// Initialize icons on client side only
if (import.meta.client) {
  import('leaflet').then((L) => {
    startIcon.value = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

    endIcon.value = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  })
}

// Drag event handlers
const handleStartMarkerDragEnd = (event: any) => {
  const { lat, lng } = event.target.getLatLng()
  emit('marker-dragged', { type: 'start', latitude: lat, longitude: lng })
}

const handleEndMarkerDragEnd = (event: any) => {
  const { lat, lng } = event.target.getLatLng()
  emit('marker-dragged', { type: 'end', latitude: lat, longitude: lng })
}

const tileLayerUrl = computed(() => {
  return isDark.value
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
})

const center = computed((): [number, number] => {
  if (props.startLocation && props.endLocation) {
    return [
      (props.startLocation.y + props.endLocation.y) / 2,
      (props.startLocation.x + props.endLocation.x) / 2,
    ]
  }
  if (props.startLocation) {
    return [props.startLocation.y, props.startLocation.x]
  }
  if (props.endLocation) {
    return [props.endLocation.y, props.endLocation.x]
  }
  return MAP_CONSTANTS.DEFAULT_CENTER
})

const routeCoordinates = computed(() => {
  return (props.routeCoordinates?.map(coord => [coord[1], coord[0]]) || []) as LatLngExpression[]
})

watch(() => props.startLocation, (newVal) => {
  if (newVal && props.endLocation) {
    map.value?.leafletObject?.fitBounds([
      [newVal.y, newVal.x],
      [props.endLocation.y, props.endLocation.x],
    ], { padding: [MAP_CONSTANTS.MAP_PADDING, MAP_CONSTANTS.MAP_PADDING] })
  }
})
watch(() => props.endLocation, (newVal) => {
  if (newVal && props.startLocation) {
    map.value?.leafletObject?.fitBounds([
      [props.startLocation.y, props.startLocation.x],
      [newVal.y, newVal.x],
    ], { padding: [MAP_CONSTANTS.MAP_PADDING, MAP_CONSTANTS.MAP_PADDING] })
  }
})

const onMapReady = () => {
  isLoading.value = false
  if (props.startLocation && props.endLocation) {
    map.value?.leafletObject?.fitBounds([
      [props.startLocation.y, props.startLocation.x],
      [props.endLocation.y, props.endLocation.x],
    ], { padding: [MAP_CONSTANTS.MAP_PADDING, MAP_CONSTANTS.MAP_PADDING] })
  }
}

</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
