import { describe, it, expect } from 'vitest'
import { calculateMeterFare } from '~/utils/fareCalculation'
import type { TaxiType } from '~/types/constants'
import tables from '../fixtures/td-fare-tables.json'

// The fare page publishes calculateMeterFare() output as a per-km table, so
// every 200m step has to match the Transport Department's own conversion table.
describe('calculateMeterFare against the TD fare conversion tables', () => {
  const types: TaxiType[] = ['urban', 'newTerritories', 'lantau']

  it.each(types)('matches every published step for %s', (type) => {
    const steps = tables[type]
    expect(steps.length).toBe(150)
    steps.forEach((fare, step) => {
      expect(calculateMeterFare(2 + step * 0.2, type)).toBeCloseTo(fare, 5)
    })
  })
})
