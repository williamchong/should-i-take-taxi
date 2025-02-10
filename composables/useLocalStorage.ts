export function useLocalStorage<T>(key: string, initialValue: T) {
  const storedValue = ref<T>(initialValue)

  onMounted(() => {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        storedValue.value = JSON.parse(item)
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }
  })

  watch(storedValue, (newValue) => {
    try {
      localStorage.setItem(key, JSON.stringify(newValue))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  })

  return storedValue
}
