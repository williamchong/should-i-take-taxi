import { CACHE_PREFIXES, sweepExpired } from '~/utils/cache'

export default defineNuxtPlugin(() => {
  onNuxtReady(() => {
    const run = () => {
      for (const prefix of Object.values(CACHE_PREFIXES)) sweepExpired(prefix)
    }
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 2000 })
    } else {
      setTimeout(run, 0)
    }
  })
})
