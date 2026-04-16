import { describe, expect, it } from 'vitest'
import {
  HK_MEDIAN_WAGE_HKD_PER_MIN,
  HK_MIN_WAGE_HKD_PER_MIN,
  getTaxiValueTier,
} from '~/utils/transitValue'

describe('getTaxiValueTier', () => {
  it('returns "poor" when transit is faster than taxi', () => {
    expect(
      getTaxiValueTier({
        taxiFare: 100,
        taxiTimeSeconds: 1800,
        transitFareMin: 20,
        transitTimeSeconds: 1500,
      })
    ).toBe('poor')
  })

  it('returns "poor" when transit is the same duration as taxi', () => {
    expect(
      getTaxiValueTier({
        taxiFare: 100,
        taxiTimeSeconds: 1800,
        transitFareMin: 20,
        transitTimeSeconds: 1800,
      })
    ).toBe('poor')
  })

  it('returns "great" when taxi is cheaper than transit', () => {
    expect(
      getTaxiValueTier({
        taxiFare: 30,
        taxiTimeSeconds: 600,
        transitFareMin: 50,
        transitTimeSeconds: 1800,
      })
    ).toBe('great')
  })

  it('returns "great" when cost-per-minute saved is at or below the minimum wage rate', () => {
    // 30 minutes saved, HK$20 extra → HK$0.667/min (below ~$0.70/min)
    expect(
      getTaxiValueTier({
        taxiFare: 50,
        taxiTimeSeconds: 600,
        transitFareMin: 30,
        transitTimeSeconds: 2400,
      })
    ).toBe('great')
  })

  it('returns "good" when cost-per-minute saved is between min and median wage rates', () => {
    // 20 minutes saved, HK$25 extra → HK$1.25/min (between $0.70 and $1.92)
    expect(
      getTaxiValueTier({
        taxiFare: 60,
        taxiTimeSeconds: 600,
        transitFareMin: 35,
        transitTimeSeconds: 1800,
      })
    ).toBe('good')
  })

  it('returns "poor" for short trips when cost-per-minute saved is far above the median wage', () => {
    // 10 minutes saved, HK$50 extra → HK$5/min (well above scaled threshold $2.24)
    expect(
      getTaxiValueTier({
        taxiFare: 80,
        taxiTimeSeconds: 600,
        transitFareMin: 30,
        transitTimeSeconds: 1200,
      })
    ).toBe('poor')
  })

  it('upgrades long trips: saving ~100 min for HK$200 extra qualifies as "good"', () => {
    // Real example: 26-min taxi @ HK$244.90 vs 125-min transit @ HK$42.70
    // costPerMin = 202.20 / 99 ≈ 2.04 — over the unscaled median ($1.92)
    // but well within the bonus-scaled threshold ($1.92 × 2.5 = $4.80)
    expect(
      getTaxiValueTier({
        taxiFare: 244.9,
        taxiTimeSeconds: 26 * 60,
        transitFareMin: 42.7,
        transitTimeSeconds: 125 * 60,
      })
    ).toBe('good')
  })

  it('still returns "poor" for absurdly expensive long trips', () => {
    // 4 hours saved at HK$5/min — saves real time but the rate is extravagant
    expect(
      getTaxiValueTier({
        taxiFare: 1230,
        taxiTimeSeconds: 600,
        transitFareMin: 30,
        transitTimeSeconds: 600 + 240 * 60,
      })
    ).toBe('poor')
  })

  it('uses the documented HK wage thresholds', () => {
    // Sanity-check thresholds are in the expected range
    expect(HK_MIN_WAGE_HKD_PER_MIN).toBeCloseTo(0.7017, 3)
    expect(HK_MEDIAN_WAGE_HKD_PER_MIN).toBeCloseTo(1.9176, 3)
  })
})
