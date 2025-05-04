<template>
  <div
    class="h-[50vh] w-full rounded-lg shadow-md overflow-hidden relative"
  >
    <div v-if="isLoading" class="absolute inset-0 bg-gray-100/80 flex items-center justify-center z-[1000]">
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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <LMarker
          v-if="startLocation"
          :lat-lng="[startLocation.y, startLocation.x]"
        />
        <LMarker
          v-if="endLocation"
          :lat-lng="[endLocation.y, endLocation.x]"
        />
      </LMap>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { LocationResult } from '~/types/location'
import type { Map } from 'leaflet'

const props = defineProps<{
  startLocation: LocationResult | null
  endLocation: LocationResult | null
}>()

const map = ref<Map | null>(null)
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

const onMapReady = (mapInstance: Map) => {
  map.value = mapInstance
  if (props.startLocation && props.endLocation) {
    map.value.fitBounds([
      [props.startLocation.y, props.startLocation.x],
      [props.endLocation.y, props.endLocation.x],
    ], { padding: [25, 25] })
  }
  isLoading.value = false
}

</script>
