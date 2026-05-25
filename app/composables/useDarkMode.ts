/**
 * Thin wrapper over @nuxtjs/color-mode (auto-registered by Nuxt UI).
 * Color-mode owns the `.dark` class, FOUC-prevention script, and system-preference
 * tracking; this composable just exposes the resolved `isDark` flag that consumers
 * (e.g. the Leaflet basemap in MapDisplay) need. Theme-change analytics live in
 * ThemeToggle.vue, next to the control that triggers them.
 */
export const useDarkMode = () => {
  const colorMode = useColorMode()

  const isDark = computed(() => colorMode.value === 'dark')

  return { isDark }
}
