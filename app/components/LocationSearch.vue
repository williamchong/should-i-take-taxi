<template>
  <div ref="wrapperRef" class="relative">
    <UInput
      :id="id"
      ref="inputRef"
      v-model="searchText"
      :loading="isSearching"
      autocomplete="off"
      type="text"
      size="xl"
      :ui="{ base: 'min-h-11' }"
      class="w-full"
      :placeholder="$t('taxiCalculator.searchPlace')"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="isOpen"
      :aria-controls="`${id}-listbox`"
      :aria-activedescendant="activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined"
      @input="debounceSearch"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      @focus="handleFocus"
      @keydown="handleKeydown"
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
      v-if="isOpen"
      ref="listboxRef"
      class="absolute z-10 mt-1 w-full bg-default shadow-lg rounded-md border border-default max-h-60 overflow-auto"
    >
      <ul :id="`${id}-listbox`" role="listbox">
        <!-- Recent locations (shown when no search text) -->
        <template v-if="!searchText && recentLocations.length > 0">
          <li class="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wide flex items-center justify-between" @mousedown.prevent>
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
            :id="`${id}-option-${index}`"
            :key="`${id}-recent-${index}`"
            role="option"
            :aria-selected="activeIndex === index"
            class="px-4 py-2 hover:bg-elevated cursor-pointer text-sm text-highlighted"
            :class="{ 'bg-elevated': activeIndex === index }"
            @mousedown.prevent
            @click="handleSelect(result, 'recent')"
          >
            {{ result.displayAddress }}
          </li>
        </template>

        <!-- Search results -->
        <li
          v-for="(result, index) in searchResults"
          :id="`${id}-option-${recentOffset + index}`"
          :key="`${id}-${index}`"
          role="option"
          :aria-selected="activeIndex === recentOffset + index"
          class="px-4 py-2 hover:bg-elevated cursor-pointer text-sm text-highlighted"
          :class="{ 'bg-elevated': activeIndex === recentOffset + index }"
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
import { computed, ref, watch } from 'vue'
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
const listboxRef = ref<HTMLElement | null>(null)
// Index of the keyboard-highlighted option across the whole list; -1 is none.
const activeIndex = ref(-1)

// Recent locations only show when the field is empty, so they never share the
// list with search results — but the offset keeps the option ids contiguous.
const showRecent = computed(() => !searchText.value && recentLocations.value.length > 0)
const recentOffset = computed(() => (showRecent.value ? recentLocations.value.length : 0))
const isOpen = computed(() => isFocused.value && (searchResults.value.length > 0 || showRecent.value))
const activeOptions = computed(() => [
  ...(showRecent.value ? recentLocations.value.map(location => ({ location, source: 'recent' as const })) : []),
  ...searchResults.value.map(location => ({ location, source: 'search' as const })),
])

// A new result set invalidates the highlight.
watch([searchResults, showRecent], () => { activeIndex.value = -1 })

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

const moveActive = (delta: number) => {
  const count = activeOptions.value.length
  if (count === 0) return
  activeIndex.value = (activeIndex.value + delta + count) % count
  nextTick(() => {
    listboxRef.value
      ?.querySelector(`#${CSS.escape(`${props.id}-option-${activeIndex.value}`)}`)
      ?.scrollIntoView({ block: 'nearest' })
  })
}

const handleKeydown = (event: KeyboardEvent) => {
  // Enter commits an IME candidate; intercepting it would select the wrong row
  // (or any row) while the user is still composing jyutping/pinyin.
  if (isComposing.value || event.isComposing) return

  switch (event.key) {
    case 'ArrowDown':
      if (!isOpen.value) { isFocused.value = true; return }
      event.preventDefault()
      moveActive(1)
      break
    case 'ArrowUp':
      if (!isOpen.value) return
      event.preventDefault()
      moveActive(-1)
      break
    case 'Enter': {
      const active = activeOptions.value[activeIndex.value]
      if (!isOpen.value || !active) return
      event.preventDefault()
      handleSelect(active.location, active.source)
      break
    }
    case 'Escape':
      if (!isOpen.value) return
      event.preventDefault()
      closeFocusedDropdown()
      break
  }
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
