export type TaxiValueTier = 'great' | 'good' | 'poor'

// HK statutory minimum wage: HK$42.10/hour (effective May 2025).
export const HK_MIN_WAGE_HKD_PER_MIN = 42.1 / 60

// HK median monthly employment earnings ~HK$20,250 (2023 census),
// against ~176 working hours/month (22 days × 8 hours).
export const HK_MEDIAN_WAGE_HKD_PER_MIN = 20250 / (22 * 8 * 60)

// Absolute time savings raise tolerance for higher per-minute cost: saving
// 1.5+ hours is qualitatively different from shaving off 5 minutes (transfers,
// fatigue, opportunity cost). Cap prevents the model from rubber-stamping
// extreme cases (e.g. HK$1,200 to save 4 hours).
export const TIME_VALUE_BONUS_CAP_HOURS = 1.5

export interface TaxiValueInput {
  taxiFare: number
  taxiTimeSeconds: number
  transitFareMin: number
  transitTimeSeconds: number
}

// Classify whether taking a taxi over public transit is "worth it" for a
// typical HK person. Compares cost-per-minute-saved against wage-rate
// thresholds, scaled up for trips that save a lot of absolute time:
//
//   effectiveRate = baseRate × (1 + min(hoursSaved, 1.5))
//
//   - 'great': taxi is cheaper, OR cost-per-min ≤ scaled minimum wage rate
//   - 'good':  cost-per-min ≤ scaled median wage rate
//   - 'poor':  cost-per-min exceeds scaled median, OR transit is faster
export function getTaxiValueTier(input: TaxiValueInput): TaxiValueTier {
  const minutesSaved = (input.transitTimeSeconds - input.taxiTimeSeconds) / 60
  if (minutesSaved <= 0) return 'poor'

  const extraCost = input.taxiFare - input.transitFareMin
  if (extraCost <= 0) return 'great'

  const costPerMin = extraCost / minutesSaved
  const hoursSaved = minutesSaved / 60
  const bonusMultiplier = 1 + Math.min(hoursSaved, TIME_VALUE_BONUS_CAP_HOURS)

  if (costPerMin <= HK_MIN_WAGE_HKD_PER_MIN * bonusMultiplier) return 'great'
  if (costPerMin <= HK_MEDIAN_WAGE_HKD_PER_MIN * bonusMultiplier) return 'good'
  return 'poor'
}

export interface TierClasses {
  taxiBg: string
  taxiText: string
  transitBg: string
  transitText: string
  savingsText: string
}

const NEUTRAL_BG = 'bg-gray-50 dark:bg-gray-800/30'
const NEUTRAL_TEXT = 'text-gray-600 dark:text-gray-400'
const POSITIVE_BG = 'bg-green-50 dark:bg-green-900/20'
const POSITIVE_TEXT = 'text-green-600 dark:text-green-400'

export function getTierClasses(tier: TaxiValueTier | null): TierClasses {
  switch (tier) {
    case 'great':
      return {
        taxiBg: POSITIVE_BG,
        taxiText: POSITIVE_TEXT,
        transitBg: NEUTRAL_BG,
        transitText: NEUTRAL_TEXT,
        savingsText: 'text-green-700 dark:text-green-400',
      }
    case 'good':
      return {
        taxiBg: 'bg-amber-50 dark:bg-amber-900/20',
        taxiText: 'text-amber-600 dark:text-amber-400',
        transitBg: NEUTRAL_BG,
        transitText: NEUTRAL_TEXT,
        savingsText: 'text-amber-700 dark:text-amber-400',
      }
    case 'poor':
      return {
        taxiBg: NEUTRAL_BG,
        taxiText: NEUTRAL_TEXT,
        transitBg: POSITIVE_BG,
        transitText: POSITIVE_TEXT,
        savingsText: 'text-red-700 dark:text-red-400',
      }
    default:
      return {
        taxiBg: 'bg-blue-50 dark:bg-blue-900/20',
        taxiText: 'text-blue-600 dark:text-blue-400',
        transitBg: NEUTRAL_BG,
        transitText: NEUTRAL_TEXT,
        savingsText: NEUTRAL_TEXT,
      }
  }
}

export interface TransitLeg {
  type: 'walk' | 'transit' | 'wait' | 'station_transfer'
  duration_seconds?: number
  distance_meters?: number
}

// Walking covers both first/last-mile walks and inter-platform station transfers
// (e.g. Central interchange) — counting only `walk` would silently undercount.
export function summarizeTransitLegs(legs: TransitLeg[]): {
  walkSeconds: number
  walkMeters: number
  waitSeconds: number
} {
  let walkSeconds = 0
  let walkMeters = 0
  let waitSeconds = 0
  for (const leg of legs) {
    if (leg.type === 'walk' || leg.type === 'station_transfer') {
      walkSeconds += leg.duration_seconds ?? 0
      walkMeters += leg.distance_meters ?? 0
    } else if (leg.type === 'wait') {
      waitSeconds += leg.duration_seconds ?? 0
    }
  }
  return { walkSeconds, walkMeters, waitSeconds }
}
