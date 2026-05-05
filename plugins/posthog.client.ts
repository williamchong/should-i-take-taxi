// PostHog initialises here (not in nuxt.config.ts) because `before_send`
// is a function and can't survive build-time serialisation. The hook below
// strips ?from / ?to query params from auto-captured URL properties so the
// user-chosen origin/destination coordinates encoded in shareable URLs
// never leave the browser.

const SENSITIVE_QUERY_PARAMS = ['from', 'to'] as const

const SENSITIVE_URL_PROPS = [
  '$current_url',
  '$referrer',
  '$initial_referrer',
  '$initial_current_url',
  '$pathname',
] as const

const ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://x'

function stripSensitiveQueryParams(raw: unknown): unknown {
  if (typeof raw !== 'string' || raw.indexOf('?') === -1) return raw
  try {
    const url = new URL(raw, ORIGIN)
    let mutated = false
    for (const key of SENSITIVE_QUERY_PARAMS) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key)
        mutated = true
      }
    }
    if (!mutated) return raw
    return raw.startsWith('http') ? url.toString() : `${url.pathname}${url.search}`
  } catch {
    return raw
  }
}

export default defineNuxtPlugin(() => {
  useScriptPostHog({
    config: {
      before_send: (event) => {
        if (!event?.properties) return event
        for (const key of SENSITIVE_URL_PROPS) {
          if (key in event.properties) {
            event.properties[key] = stripSensitiveQueryParams(event.properties[key])
          }
        }
        return event
      },
    },
  })
})
