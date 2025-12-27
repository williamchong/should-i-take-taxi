<template>
  <div
    class="h-[33vh] md:h-[40vh] w-full rounded-lg shadow-md overflow-hidden relative"
  >
    <div v-if="isLoading" class="absolute inset-0 bg-gray-100/80 flex items-center justify-center z-[100]">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"/>
    </div>
    <ClientOnly>
      <LMap
        ref="map"
        :zoom="13"
        :center="center"
        :use-global-leaflet="false"
        :min-zoom="11"
        :max-zoom="17"
        @ready="onMapReady"
      >
        <LTileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <LMarker
          v-if="startLocation"
          :lat-lng="[startLocation.y, startLocation.x]"
        />
        <LMarker
          v-if="endLocation"
          :lat-lng="[endLocation.y, endLocation.x]"
        />
        <LPolyline
          v-if="routeCoordinates.length > 0"
          :lat-lngs="routeCoordinates"
          color="#2563eb"
          :weight="5"
          :opacity="0.8"
        />
        <!-- Bounding box visualization -->
        <LRectangle
          v-if="showBoundingBoxes"
          :bounds="toBounds(LANTAU_BOUNDING_BOX)"
          :color="'#3b82f6'"
          :weight="2"
          :fillOpacity="0.1"
          :dashArray="'5, 5'"
        >
          <LTooltip :content="'Lantau Island Bounding Box'" />
        </LRectangle>
        <!-- Hong Kong Island: Box 1 (Main Island) -->
        <LRectangle
          v-if="showBoundingBoxes"
          :bounds="toBounds(HK_ISLAND_BOX_1)"
          :color="'#ef4444'"
          :weight="2"
          :fillOpacity="0.1"
          :dashArray="'5, 5'"
        >
          <LTooltip :content="'HK Island Box 1: Main Island'" />
        </LRectangle>
        <!-- Hong Kong Island: Box 2 (Northern Shore Extension) -->
        <LRectangle
          v-if="showBoundingBoxes"
          :bounds="toBounds(HK_ISLAND_BOX_2)"
          :color="'#ef4444'"
          :weight="2"
          :fillOpacity="0.15"
          :dashArray="'5, 5'"
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

const props = defineProps<{
  startLocation: LocationResult | null
  endLocation: LocationResult | null
  routeCoordinates?: [number, number][]
  showBoundingBoxes?: boolean
}>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = ref(null as any)
const isLoading = ref(true)

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
  return [22.302711, 114.177216]
})

const routeCoordinates = computed(() => {
  return (props.routeCoordinates?.map(coord => [coord[1], coord[0]]) || []) as LatLngExpression[]
})

watch(() => props.startLocation, (newVal) => {
  if (newVal && props.endLocation) {
    map.value?.leafletObject?.fitBounds([
      [newVal.y, newVal.x],
      [props.endLocation.y, props.endLocation.x],
    ], { padding: [25, 25] })
  }
})
watch(() => props.endLocation, (newVal) => {
  if (newVal && props.startLocation) {
    map.value?.leafletObject?.fitBounds([
      [props.startLocation.y, props.startLocation.x],
      [newVal.y, newVal.x],
    ], { padding: [25, 25] })
  }
})

const onMapReady = () => {
  isLoading.value = false
  if (props.startLocation && props.endLocation) {
    map.value?.leafletObject?.fitBounds([
      [props.startLocation.y, props.startLocation.x],
      [props.endLocation.y, props.endLocation.x],
    ], { padding: [25, 25] })
  }
}

</script>
