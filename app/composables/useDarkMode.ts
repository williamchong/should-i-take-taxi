import { usePreferredDark, useStorage } from '@vueuse/core'

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'taxi-calc-theme-preference'

export const useDarkMode = () => {
  const { track, registerSuperProperties } = useAnalytics()

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
    registerSuperProperties({ theme_mode: mode })
    track('theme_preference_changed', { mode }, { ga4Event: `theme_preference_changed_${mode}` })
  }

  // Cycle: system → light → dark → system
  const cycleTheme = () => {
    const nextMode: Record<ThemeMode, ThemeMode> = { system: 'light', light: 'dark', dark: 'system' }
    setThemePreference(nextMode[themePreference.value])
  }

  return {
    themePreference: readonly(themePreference),
    isDark: readonly(isDark),
    initializeTheme,
    setThemePreference,
    cycleTheme
  }
}
