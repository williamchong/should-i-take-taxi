import { usePreferredDark, useStorage } from '@vueuse/core'

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'taxi-calc-theme-preference'

export const useDarkMode = () => {
  // User's explicit preference (synced with localStorage via VueUse)
  const themePreference = useStorage<ThemeMode>(STORAGE_KEY, 'system')

  // Reactive system dark mode preference (auto-tracks matchMedia changes)
  const prefersDark = usePreferredDark()

  // Actual theme currently applied
  const isDark = useState<boolean>('is-dark-mode', () => false)

  const getEffectiveTheme = (): boolean => {
    if (themePreference.value === 'dark') return true
    if (themePreference.value === 'light') return false
    return prefersDark.value
  }

  const applyTheme = () => {
    if (typeof window === 'undefined') return

    const shouldBeDark = getEffectiveTheme()
    isDark.value = shouldBeDark

    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  watch(prefersDark, () => {
    if (themePreference.value === 'system') {
      applyTheme()
    }
  })

  const initializeTheme = () => {
    if (typeof window === 'undefined') return
    applyTheme()
  }

  const setThemePreference = (mode: ThemeMode) => {
    themePreference.value = mode
    applyTheme()
    useTrackEvent(`theme_preference_changed_${mode}`)
  }

  // Cycle: system → light → dark → system
  const cycleTheme = () => {
    const modes: ThemeMode[] = ['system', 'light', 'dark']
    const currentIndex = modes.indexOf(themePreference.value)
    const nextIndex = (currentIndex + 1) % modes.length
    setThemePreference(modes[nextIndex])
  }

  return {
    themePreference: readonly(themePreference),
    isDark: readonly(isDark),
    initializeTheme,
    setThemePreference,
    cycleTheme
  }
}
