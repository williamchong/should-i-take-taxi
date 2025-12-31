<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { initializeTheme, isDark } = useDarkMode()

useHead({
  htmlAttrs: {
    style: computed(() => isDark.value ? 'background-color: #111827; color-scheme: dark;' : 'background-color: #ffffff; color-scheme: light;')
  },
  bodyAttrs: {
    style: computed(() => isDark.value ? 'background-color: #111827;' : 'background-color: #ffffff;')
  },
  meta: [
    {
      name: 'color-scheme',
      content: 'light dark'
    },
    {
      name: 'theme-color',
      content: computed(() => isDark.value ? '#111827' : '#ffffff')
    }
  ]
})

onMounted(() => {
  initializeTheme()
})
</script>
