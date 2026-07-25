import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTransitComparison } from '~/composables/useTransitComparison'
import type { TransitComparison } from '~/utils/transitValue'

function makeTransit(overrides: Partial<TransitComparison> = {}): TransitComparison {
  return {
    transitDurationSeconds: 3600, // 60 min
    transitFareMin: 12,
    transitFareMax: 15,
    transitWalkSeconds: 600, // 10 min
    transitWaitSeconds: 300, // 5 min
    drivingTimeSeconds: 1800, // 30 min
    isCalculating: false,
    ...overrides,
  }
}

describe('useTransitComparison', () => {
  it('derives minutes saved, walk and wait time', () => {
    const transit = ref(makeTransit())
    const { minutesSaved, walkMinutes, waitMinutes } = useTransitComparison(transit, 100)

    expect(minutesSaved.value).toBe(30)
    expect(walkMinutes.value).toBe(10)
    expect(waitMinutes.value).toBe(5)
  })

  it('reports neutral values while the transit request is in flight', () => {
    const transit = ref(makeTransit({ isCalculating: true }))
    const { minutesSaved, walkMinutes, waitMinutes, tier, costPerHourSaved } =
      useTransitComparison(transit, 100)

    expect(minutesSaved.value).toBe(0)
    expect(walkMinutes.value).toBe(0)
    expect(waitMinutes.value).toBe(0)
    expect(tier.value).toBeNull()
    expect(costPerHourSaved.value).toBeNull()
  })

  it('reports neutral values when there is no transit plan', () => {
    const { minutesSaved, tier, tierClasses } = useTransitComparison(ref(null), 100)

    expect(minutesSaved.value).toBe(0)
    expect(tier.value).toBeNull()
    // Falls back to the neutral (blue) palette rather than throwing.
    expect(tierClasses.value.taxiBg).toContain('blue')
  })

  it('withholds a tier until a fare has been calculated', () => {
    const transit = ref(makeTransit())
    const { tier } = useTransitComparison(transit, 0)

    expect(tier.value).toBeNull()
  })

  it('classifies a cheap time-saving trip as great value', () => {
    const transit = ref(makeTransit())
    // HK$30 taxi vs HK$12 transit, saving 30 min -> HK$0.60/min, under min wage.
    const { tier } = useTransitComparison(transit, 30)

    expect(tier.value).toBe('great')
  })

  it('classifies an expensive trip as poor value', () => {
    const transit = ref(makeTransit())
    // HK$500 to save 30 min is far above the median wage rate.
    const { tier } = useTransitComparison(transit, 500)

    expect(tier.value).toBe('poor')
  })

  it('computes cost per hour saved, and null when the taxi is not cheaper to justify', () => {
    const transit = ref(makeTransit())
    const { costPerHourSaved } = useTransitComparison(transit, 42)

    // (42 - 12) / 30 min * 60 = HK$60/hour saved
    expect(costPerHourSaved.value).toBe(60)
  })

  it('returns null cost per hour when the taxi costs no more than transit', () => {
    const transit = ref(makeTransit())
    const { costPerHourSaved } = useTransitComparison(transit, 10)

    expect(costPerHourSaved.value).toBeNull()
  })

  it('returns null cost per hour when transit is faster', () => {
    const transit = ref(makeTransit({ transitDurationSeconds: 900 })) // 15 min vs 30
    const { minutesSaved, tier, costPerHourSaved } = useTransitComparison(transit, 100)

    expect(minutesSaved.value).toBeLessThanOrEqual(0)
    expect(tier.value).toBe('poor')
    expect(costPerHourSaved.value).toBeNull()
  })

  it('reacts to changes in the transit payload and the fare', () => {
    const transit = ref<TransitComparison | null>(null)
    const fare = ref(0)
    const { minutesSaved, tier } = useTransitComparison(transit, fare)

    expect(minutesSaved.value).toBe(0)

    transit.value = makeTransit()
    fare.value = 30

    expect(minutesSaved.value).toBe(30)
    expect(tier.value).toBe('great')

    fare.value = 500
    expect(tier.value).toBe('poor')
  })
})
