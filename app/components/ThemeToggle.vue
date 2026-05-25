<template>
  <UColorModeButton class="fixed top-3 right-4 z-[2000]" />
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const { track, registerSuperProperties } = useAnalytics()

// Re-add the analytics the previous hand-rolled toggle emitted on every change.
// UColorModeButton mutates colorMode.preference, so we watch it directly.
watch(() => colorMode.preference, (mode) => {
  registerSuperProperties({ theme_mode: mode })
  track('theme_preference_changed', { mode }, { ga4Event: `theme_preference_changed_${mode}` })
})
</script>
