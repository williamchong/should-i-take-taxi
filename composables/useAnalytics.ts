// Sends each event to both GA4 (variance baked into the event name, since
// GA4 dimensions need admin registration) and PostHog (canonical name + free
// properties). `ga4Event` overrides the GA4 name when variance is in the
// middle of the event name (e.g. taxi_start_location_selected_search).

type Properties = Record<string, string | number | boolean | null | undefined>

interface TrackOptions {
  ga4Event?: string
}

export const useAnalytics = () => {
  const { proxy: posthogProxy } = useScriptPostHog()
  const { proxy: gaProxy } = useScriptGoogleAnalytics()

  const track = (
    eventName: string,
    properties?: Properties,
    options?: TrackOptions,
  ) => {
    gaProxy.gtag('event', options?.ga4Event ?? eventName, properties)
    posthogProxy.posthog.capture(eventName, properties)
  }

  const registerSuperProperties = (properties: Properties) => {
    posthogProxy.posthog.register(properties)
  }

  return { track, registerSuperProperties }
}
