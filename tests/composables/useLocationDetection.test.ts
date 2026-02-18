import { describe, it, expect } from 'vitest'
import { useLocationDetection } from '~/composables/useLocationDetection'
import type { LocationResult } from '~/types/location'

function makeLocation(lat: number, lng: number): LocationResult {
  return {
    x: lng,
    y: lat,
    nameEN: 'Test',
    nameZH: 'Test',
    addressEN: '',
    addressZH: '',
    districtEN: '',
    districtZH: '',
    displayAddress: 'Test',
  }
}

// Central, Hong Kong Island
const central = makeLocation(22.282, 114.158)
// Tsim Sha Tsui, Kowloon
const tst = makeLocation(22.297, 114.172)
// Mong Kok, Kowloon
const mongKok = makeLocation(22.319, 114.169)
// Tung Chung, Lantau
const tungChung = makeLocation(22.289, 113.941)
// Tai O, Lantau
const taiO = makeLocation(22.252, 113.862)

describe('useLocationDetection', () => {
  const { isOnHongKongIsland, isLantauLocation, shouldAutoSelectCrossHarbour, suggestTaxiType } = useLocationDetection()

  describe('isOnHongKongIsland', () => {
    it('returns true for Central', () => {
      expect(isOnHongKongIsland(22.282, 114.158)).toBe(true)
    })

    it('returns false for TST', () => {
      expect(isOnHongKongIsland(22.297, 114.172)).toBe(false)
    })

    it('returns false for Tung Chung', () => {
      expect(isOnHongKongIsland(22.289, 113.941)).toBe(false)
    })
  })

  describe('isLantauLocation', () => {
    it('returns true for Tung Chung', () => {
      expect(isLantauLocation(tungChung)).toBe(true)
    })

    it('returns true for Tai O', () => {
      expect(isLantauLocation(taiO)).toBe(true)
    })

    it('returns false for Central', () => {
      expect(isLantauLocation(central)).toBe(false)
    })

    it('returns false for null', () => {
      expect(isLantauLocation(null)).toBe(false)
    })
  })

  describe('shouldAutoSelectCrossHarbour', () => {
    it('returns true for Central → TST (cross harbour)', () => {
      expect(shouldAutoSelectCrossHarbour(central, tst)).toBe(true)
    })

    it('returns true for TST → Central (cross harbour, reverse)', () => {
      expect(shouldAutoSelectCrossHarbour(tst, central)).toBe(true)
    })

    it('returns false for TST → Mong Kok (both Kowloon)', () => {
      expect(shouldAutoSelectCrossHarbour(tst, mongKok)).toBe(false)
    })

    it('returns false when start is null', () => {
      expect(shouldAutoSelectCrossHarbour(null, tst)).toBe(false)
    })

    it('returns false when end is null', () => {
      expect(shouldAutoSelectCrossHarbour(central, null)).toBe(false)
    })

    it('returns false when both are null', () => {
      expect(shouldAutoSelectCrossHarbour(null, null)).toBe(false)
    })
  })

  describe('suggestTaxiType', () => {
    it('suggests lantau when both locations are in Lantau', () => {
      expect(suggestTaxiType(tungChung, taiO)).toBe('lantau')
    })

    it('returns null when only start is in Lantau', () => {
      expect(suggestTaxiType(tungChung, tst)).toBeNull()
    })

    it('returns null when only end is in Lantau', () => {
      expect(suggestTaxiType(central, tungChung)).toBeNull()
    })

    it('returns null when neither is in Lantau', () => {
      expect(suggestTaxiType(central, tst)).toBeNull()
    })

    it('returns null when both are null', () => {
      expect(suggestTaxiType(null, null)).toBeNull()
    })
  })
})
