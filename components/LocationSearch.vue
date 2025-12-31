<template>
  <div class="relative">
    <input
      :id="id"
      ref="inputRef"
      v-model="searchText"
      type="text"
      class="block w-full pl-3 pr-10 py-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
      :placeholder="$t('taxiCalculator.searchPlace')"
      @input="debounceSearch"
      @focus="handleFocus"
      @blur="handleBlur"
    >
    <!-- Clear button -->
    <div v-if="searchText && !isSearching" class="absolute inset-y-0 right-0 pr-3 flex items-center">
      <button
        type="button"
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
        @click="handleClear"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <!-- Loading spinner -->
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
          <li class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center justify-between">
            <span>{{ $t('taxiCalculator.recentLocations') }}</span>
            <button
              type="button"
              class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none transition-colors ml-2"
              :title="$t('taxiCalculator.clearRecentLocations')"
              @click="handleClearRecent"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
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

const emit = defineEmits(['update:modelValue', 'select', 'focus', 'blur'])

const { searchLocation, transformCoordinates } = useLocationSearch()
const { getRecentLocations, addRecentLocation, clearRecentLocations } = useRecentLocations()

const searchText = ref(props.modelValue)
const searchResults = ref<LocationResult[]>([])
const isSearching = ref(false)
const isFocused = ref(false)
const recentLocations = ref<LocationResult[]>([])
const lastCommittedValue = ref(props.modelValue)
const hasSelectedDuringFocus = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

// Load recent locations on mount
onMounted(() => {
  recentLocations.value = getRecentLocations()
})

watch(() => props.modelValue, (newValue) => {
  // Update lastCommittedValue only when:
  // 1. Not focused (normal updates like initial load)
  // 2. Focused but value changed externally (map click, swap, GPS - not from typing)
  if (!isFocused.value || searchText.value !== newValue) {
    lastCommittedValue.value = newValue
  }
  searchText.value = newValue
})

const setTimeout = (callback: () => void, delay: number) => {
  return window.setTimeout(callback, delay)
}

const handleFocus = () => {
  isFocused.value = true
  hasSelectedDuringFocus.value = false
  emit('focus')
}

const handleBlur = () => {
  setTimeout(() => {
    isFocused.value = false
    emit('blur')
    // If user typed but didn't select anything, revert to last committed value
    if (!hasSelectedDuringFocus.value && searchText.value !== lastCommittedValue.value) {
      searchText.value = lastCommittedValue.value
      emit('update:modelValue', lastCommittedValue.value)
      searchResults.value = []
    }
  }, 200)
}

const handleClear = () => {
  searchText.value = ''
  lastCommittedValue.value = ''
  hasSelectedDuringFocus.value = true // Prevent revert on blur
  emit('update:modelValue', '')
  emit('select', null)
  searchResults.value = []
  // Focus back to input after clearing
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const handleClearRecent = () => {
  clearRecentLocations()
  recentLocations.value = []
}

let searchTimeout: number | null = null
const debounceSearch = () => {
  isFocused.value = true
  emit('update:modelValue', searchText.value)
  // Don't clear selection immediately when typing - only clear when a new location is selected

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
  hasSelectedDuringFocus.value = true
  searchText.value = location.displayAddress
  lastCommittedValue.value = location.displayAddress
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

// Expose focus method so parent can focus this input
defineExpose({
  focus: () => {
    inputRef.value?.focus()
  }
})
</script>
