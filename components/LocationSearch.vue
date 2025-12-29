<template>
  <div class="relative">
    <input
      :id="id"
      v-model="searchText"
      type="text"
      class="block w-full pl-3 pr-10 py-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
      :placeholder="$t('taxiCalculator.searchPlace')"
      @input="debounceSearch"
      @focus="isFocused = true"
      @blur="setTimeout(() => { isFocused = false }, 500)"
    >
    <div v-if="isSearching" class="absolute inset-y-0 right-0 pr-3 flex items-center">
      <div class="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
    </div>

    <div
      v-if="isFocused && (searchResults.length > 0 || (!searchText && recentLocations.length > 0))"
      class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto"
    >
      <ul>
        <!-- Recent locations (shown when no search text) -->
        <template v-if="!searchText && recentLocations.length > 0">
          <li class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {{ $t('taxiCalculator.recentLocations') }}
          </li>
          <li
            v-for="(result, index) in recentLocations"
            :key="`${id}-recent-${index}`"
            class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-gray-100"
            @click="handleSelect(result)"
          >
            {{ result.displayAddress }}
          </li>
        </template>

        <!-- Search results -->
        <li
          v-for="(result, index) in searchResults"
          :key="`${id}-${index}`"
          class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-gray-100"
          @click="handleSelect(result)"
        >
          {{ result.displayAddress }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLocationSearch } from '../composables/useLocationSearch'
import { useRecentLocations } from '../composables/useRecentLocations'
import type { LocationResult } from '~/types/location'
import { UI_CONSTANTS } from '~/types/constants'

const props = defineProps<{
  id: string
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue', 'select'])

const { searchLocation, transformCoordinates } = useLocationSearch()
const { getRecentLocations, addRecentLocation } = useRecentLocations()

const searchText = ref(props.modelValue)
const searchResults = ref<LocationResult[]>([])
const isSearching = ref(false)
const isFocused = ref(false)
const recentLocations = ref<LocationResult[]>([])

// Load recent locations on mount
onMounted(() => {
  recentLocations.value = getRecentLocations()
})

watch(() => props.modelValue, (newValue) => {
  searchText.value = newValue
})

const setTimeout = (callback: () => void, delay: number) => {
  return window.setTimeout(callback, delay)
}

let searchTimeout: number | null = null
const debounceSearch = () => {
  isFocused.value = true
  emit('update:modelValue', searchText.value)
  emit('select', null)

  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    isSearching.value = true
    try {
      const results = await searchLocation(searchText.value)
      searchResults.value = results.slice(0, UI_CONSTANTS.MAX_SEARCH_RESULTS)
    } finally {
      isSearching.value = false
    }
  }, UI_CONSTANTS.SEARCH_DEBOUNCE_MS) as unknown as number
}

const handleSelect = async (location: LocationResult) => {
  searchText.value = location.displayAddress
  emit('update:modelValue', location.displayAddress)
  searchResults.value = []

  const transformedLocation = await transformCoordinates(location)
  emit('select', transformedLocation)

  // Save to recent locations
  addRecentLocation(location)
  recentLocations.value = getRecentLocations()
}

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>
