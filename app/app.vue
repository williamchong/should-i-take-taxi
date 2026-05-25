<template>
  <UApp :locale="uiLocale">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
import { en, zh_cn, zh_tw } from '@nuxt/ui/locale'

// color-mode (via Nuxt UI) owns the `.dark` class, the FOUC-prevention script,
// and the page background. We only mirror the resolved theme into the
// `theme-color` meta so the mobile browser chrome matches.
const { isDark } = useDarkMode()

// Localize Nuxt UI's own component strings (aria labels, etc.) from the active
// app locale. Nuxt UI only ships Simplified/Traditional Chinese, so both the
// HK and TW Traditional locales map to zh_tw.
const { locale } = useI18n()
const uiLocale = computed(() => {
  switch (locale.value) {
    case 'zh-cn': return zh_cn
    case 'zh-tw':
    case 'zh-hk': return zh_tw
    default: return en
  }
})

useHead({
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
</script>
