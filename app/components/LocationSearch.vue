<template>
  <div ref="wrapperRef" class="relative">
    <UInput
      :id="id"
      ref="inputRef"
      v-model="searchText"
      :loading="isSearching"
      autocomplete="off"
      type="text"
      class="w-full"
      :placeholder="$t('taxiCalculator.searchPlace')"
      @input="debounceSearch"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      @focus="handleFocus"
    >
      <template v-if="searchText && !isSearching" #trailing>
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          icon="i-heroicons-x-mark"
          :aria-label="$t('taxiCalculator.clearSearch')"
          @mousedown.prevent
          @click="handleClear"
        />
      </template>
    </UInput>

    <div
      v-if="isFocused && (searchResults.length > 0 || (!searchText && recentLocations.length > 0))"
      class="absolute z-10 mt-1 w-full bg-default shadow-lg rounded-md border border-default max-h-60 overflow-auto"
    >
      <ul>
        <!-- Recent locations (shown when no search text) -->
        <template v-if="!searchText && recentLocations.length > 0">
          <li class="px-4 py-2 text-xs font-semibold text-dimmed uppercase tracking-wide flex items-center justify-between" @mousedown.prevent>
            <span>{{ $t('taxiCalculator.recentLocations') }}</span>
            <UButton
              color="neutral"
              variant="link"
              size="xs"
              icon="i-heroicons-trash"
              :title="$t('taxiCalculator.clearRecentLocations')"
              :aria-label="$t('taxiCalculator.clearRecentLocations')"
              @click="handleClearRecent"
            />
          </li>
          <li
            v-for="(result, index) in recentLocations"
            :key="`${id}-recent-${index}`"
            class="px-4 py-2 hover:bg-elevated cursor-pointer text-sm text-highlighted"
            @mousedown.prevent
            @click="handleSelect(result, 'recent')"
          >
            {{ result.displayAddress }}
          </li>
        </template>

        <!-- Search results -->
        <li
          v-for="(result, index) in searchResults"
          :key="`${id}-${index}`"
          class="px-4 py-2 hover:bg-elevated cursor-pointer text-sm text-highlighted"
          @mousedown.prevent
          @click="handleSelect(result, 'search')"
        >
          {{ result.displayAddress }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { onClickOutside, useDebounceFn } from '@vueuse/core'
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
// True while an IME composition (e.g. pinyin/jyutping) is in progress. We defer
// emitting/searching until compositionend so partial romanization isn't searched.
const isComposing = ref(false)
const recentLocations = ref<LocationResult[]>([])
const lastCommittedValue = ref(props.modelValue)
// UInput exposes the underlying <input> element via `inputRef`.
const inputRef = ref<{ inputRef?: HTMLInputElement } | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)

// Load recent locations on mount
onMounted(() => {
  recentLocations.value = getRecentLocations()
})

watch(() => props.modelValue, (newValue) => {
  if (searchText.value === newValue) return
  // While this field is focused the user's keystrokes are the source of truth.
  // Parent prop changes are just our own emit round-tripping back, and a stale
  // echo arriving a keystroke late would reset Nuxt UI's controlled <input> and
  // drop characters during fast typing. External updates (map/swap/GPS) blur the
  // field first via onClickOutside, so they still apply.
  if (isFocused.value) return
  // External change (map click, swap, GPS, initial load).
  lastCommittedValue.value = newValue
  searchText.value = newValue
})

const closeFocusedDropdown = () => {
  if (!isFocused.value) return
  isFocused.value = false
  inputRef.value?.inputRef?.blur()
  emit('blur')
  if (searchText.value !== lastCommittedValue.value) {
    searchText.value = lastCommittedValue.value
    emit('update:modelValue', lastCommittedValue.value)
    searchResults.value = []
  }
}

onClickOutside(wrapperRef, closeFocusedDropdown)

const handleFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleClear = () => {
  searchText.value = ''
  lastCommittedValue.value = ''
  emit('update:modelValue', '')
  emit('select', null)
  searchResults.value = []
  // Focus back to input after clearing
  nextTick(() => {
    inputRef.value?.inputRef?.focus({ preventScroll: true })
  })
}

const handleClearRecent = () => {
  clearRecentLocations()
  recentLocations.value = []
}

const debouncedSearch = useDebounceFn(async () => {
  isSearching.value = true
  try {
    const results = await searchLocation(searchText.value)
    searchResults.value = results.slice(0, UI_CONSTANTS.MAX_SEARCH_RESULTS)
  } finally {
    isSearching.value = false
  }
}, UI_CONSTANTS.SEARCH_DEBOUNCE_MS)

const debounceSearch = () => {
  // Skip mid-composition; handleCompositionEnd calls this once with the committed text.
  if (isComposing.value) return
  isFocused.value = true
  emit('update:modelValue', searchText.value)
  debouncedSearch()
}

const handleCompositionStart = () => {
  isComposing.value = true
}

const handleCompositionEnd = () => {
  // v-model flushes searchText on compositionend, so the committed text is ready.
  isComposing.value = false
  debounceSearch()
}

const handleSelect = async (location: LocationResult, source: 'search' | 'recent') => {
  searchText.value = location.displayAddress
  lastCommittedValue.value = location.displayAddress
  emit('update:modelValue', location.displayAddress)
  searchResults.value = []

  // Unfocus the input after selection (closes dropdown, dismisses mobile keyboard)
  closeFocusedDropdown()

  try {
    const transformedLocation = await transformCoordinates(location)
    emit('select', transformedLocation, source)

    // Save to recent locations
    addRecentLocation(location)
    recentLocations.value = getRecentLocations()
  } catch (error) {
    console.error('Failed to transform coordinates:', error)
    searchText.value = ''
    lastCommittedValue.value = ''
    emit('update:modelValue', '')
  }
}

// Expose focus method so parent can focus this input
defineExpose({
  focus: () => {
    inputRef.value?.inputRef?.focus({ preventScroll: true })
  }
})
</script>
