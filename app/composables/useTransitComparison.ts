import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { TransitComparison } from '~/utils/transitValue'
import { getTaxiValueTier, getTierClasses } from '~/utils/transitValue'

/**
 * Derivations shared by the inline fare summary in TaxiFareCalculator and the
 * full comparison panel in pages/index.vue. Both read the same payload, so the
 * minutes-saved / tier maths lives here rather than being restated in each.
 *
 * Everything resolves to a neutral zero/null while the transit request is in
 * flight, so callers never have to re-check `isCalculating` themselves.
 */
export function useTransitComparison(
  transit: MaybeRefOrGetter<TransitComparison | null>,
  taxiFare: MaybeRefOrGetter<number>,
) {
  const settled = computed(() => {
    const value = toValue(transit)
    return value && !value.isCalculating ? value : null
  })

  const toMinutes = (seconds: number | undefined) => Math.round((seconds ?? 0) / 60)

  const minutesSaved = computed(() => {
    if (!settled.value) return 0
    return toMinutes(settled.value.transitDurationSeconds - settled.value.drivingTimeSeconds)
  })

  const taxiMinutes = computed(() => toMinutes(settled.value?.drivingTimeSeconds))
  const transitMinutes = computed(() => toMinutes(settled.value?.transitDurationSeconds))
  const walkMinutes = computed(() => toMinutes(settled.value?.transitWalkSeconds))
  const waitMinutes = computed(() => toMinutes(settled.value?.transitWaitSeconds))

  const tier = computed(() => {
    const fare = toValue(taxiFare)
    if (!settled.value || fare <= 0) return null
    return getTaxiValueTier({
      taxiFare: fare,
      taxiTimeSeconds: settled.value.drivingTimeSeconds,
      transitFareMin: settled.value.transitFareMin,
      transitTimeSeconds: settled.value.transitDurationSeconds,
    })
  })

  const tierClasses = computed(() => getTierClasses(tier.value))

  /** HK$ paid per hour of travel time saved, or null when the taxi isn't faster. */
  const costPerHourSaved = computed(() => {
    if (!settled.value || minutesSaved.value <= 0) return null
    const extraCost = toValue(taxiFare) - settled.value.transitFareMin
    if (extraCost <= 0) return null
    return Math.round((extraCost / minutesSaved.value) * 60)
  })

  return {
    minutesSaved,
    taxiMinutes,
    transitMinutes,
    walkMinutes,
    waitMinutes,
    tier,
    tierClasses,
    costPerHourSaved,
  }
}
