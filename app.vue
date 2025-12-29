<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { initializeTheme } = useDarkMode()

onMounted(() => {
  initializeTheme()
})
</script>
