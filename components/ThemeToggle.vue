<template>
  <button
    type="button"
    class="fixed top-3 right-4 z-[2000] p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
    :aria-label="ariaLabel"
    :title="tooltipText"
    @click="handleToggle"
  >
    <!-- System Mode Icon (Monitor) -->
    <svg
      v-if="themePreference === 'system'"
      class="w-5 h-5 text-gray-700 dark:text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>

    <!-- Light Mode Icon (Sun) -->
    <svg
      v-else-if="themePreference === 'light'"
      class="w-5 h-5 text-yellow-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>

    <!-- Dark Mode Icon (Moon) -->
    <svg
      v-else
      class="w-5 h-5 text-blue-600 dark:text-blue-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
const { themePreference, cycleTheme } = useDarkMode()
const { t } = useI18n()

const ariaLabel = computed(() => {
  return t(`theme.toggle.${themePreference.value}`)
})

const tooltipText = computed(() => {
  return t('theme.currentMode', { mode: t(`theme.mode.${themePreference.value}`) })
})

const handleToggle = () => {
  cycleTheme()
  const { gtag } = useGtag()
  gtag('event', 'theme_toggle_clicked', { to: themePreference.value })
}
</script>
