<template>
  <div class="relative">
    <input
      :id="id"
      v-model="searchText"
      type="text"
      class="block w-full pl-3 pr-10 py-2 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      :placeholder="$t('taxiCalculator.searchPlace')"
      @input="debounceSearch"
      @focus="isFocused = true"
      @blur="setTimeout(() => { isFocused = false }, 500)"
    >
    <div v-if="isSearching" class="absolute inset-y-0 right-0 pr-3 flex items-center">
      <div class="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
    </div>

    <div
      v-if="isFocused && searchResults.length > 0"
      class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto"
    >
      <ul>
        <li
          v-for="(result, index) in searchResults"
          :key="`${id}-${index}`"
          class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
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
import type { LocationResult } from '~/types/location';

const props = defineProps<{
  id: string
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue', 'select'])

const { searchLocation, transformCoordinates } = useLocationSearch()

const searchText = ref(props.modelValue)
const searchResults = ref<LocationResult[]>([])
const isSearching = ref(false)
const isFocused = ref(false)

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
      searchResults.value = results.slice(0, 5)
    } finally {
      isSearching.value = false
    }
  }, 500) as unknown as number
}

const handleSelect = async (location: LocationResult) => {
  searchText.value = location.displayAddress
  emit('update:modelValue', location.displayAddress)
  searchResults.value = []

  const transformedLocation = await transformCoordinates(location)
  emit('select', transformedLocation)
}
</script>
