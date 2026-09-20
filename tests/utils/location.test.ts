import { describe, it, expect } from 'vitest'
import { createLocationFromCoordinates, dedupeLocations, getLocalizedAddress } from '~/utils/location'
import type { LocationResult } from '~/types/location'

describe('createLocationFromCoordinates', () => {
  it('creates a LocationResult with correct coordinates', () => {
    const result = createLocationFromCoordinates(22.302711, 114.177216)
    expect(result.x).toBe(114.177216)
    expect(result.y).toBe(22.302711)
  })

  it('uses coordinates as display address when none provided', () => {
    const result = createLocationFromCoordinates(22.302711, 114.177216)
    expect(result.displayAddress).toBe('22.302711, 114.177216')
  })

  it('uses provided displayAddress when given', () => {
    const result = createLocationFromCoordinates(22.302711, 114.177216, 'Central, Hong Kong')
    expect(result.displayAddress).toBe('Central, Hong Kong')
  })

  it('sets default name values', () => {
    const result = createLocationFromCoordinates(22.302711, 114.177216)
    expect(result.nameEN).toBe('Custom Location')
    expect(result.nameZH).toBe('自訂位置')
  })

  it('formats coordinates to 6 decimal places in address fields', () => {
    const result = createLocationFromCoordinates(22.3, 114.1)
    expect(result.addressEN).toBe('22.300000, 114.100000')
    expect(result.addressZH).toBe('22.300000, 114.100000')
  })

  it('sets empty strings for district fields', () => {
    const result = createLocationFromCoordinates(22.302711, 114.177216)
    expect(result.districtEN).toBe('')
    expect(result.districtZH).toBe('')
  })
})

describe('getLocalizedAddress', () => {
  const location = (overrides: Partial<LocationResult> = {}): LocationResult => ({
    x: 114.172575,
    y: 22.300093,
    nameEN: 'Tsim Sha Tsui',
    nameZH: '尖沙咀',
    addressEN: '',
    addressZH: '',
    districtEN: 'Yau Tsim Mong District',
    districtZH: '油尖旺區',
    displayAddress: '',
    ...overrides,
  })

  it('omits the address when the API returns none', () => {
    expect(getLocalizedAddress(location(), 'en-HK')).toBe('Tsim Sha Tsui - Yau Tsim Mong District')
  })

  it('joins name and address when both are present', () => {
    const result = getLocalizedAddress(location({ addressEN: '1 Canton Road' }), 'en-HK')
    expect(result).toBe('Tsim Sha Tsui, 1 Canton Road - Yau Tsim Mong District')
  })

  it('omits the district when the API returns none', () => {
    const result = getLocalizedAddress(location({ districtEN: '' }), 'en-HK')
    expect(result).toBe('Tsim Sha Tsui')
  })

  it('uses the Chinese fields for zh locales', () => {
    expect(getLocalizedAddress(location(), 'zh-HK')).toBe('尖沙咀 - 油尖旺區')
  })

  it('returns an empty string when every part is empty', () => {
    const empty = location({ nameEN: '', addressEN: '', districtEN: '' })
    expect(getLocalizedAddress(empty, 'en-HK')).toBe('')
  })
})

describe('dedupeLocations', () => {
  const at = (x: number, y: number, displayAddress: string): LocationResult =>
    createLocationFromCoordinates(y, x, displayAddress)

  it('drops repeats of the same place', () => {
    const results = dedupeLocations([
      at(114.158, 22.281, 'Central District - Central and Western District'),
      at(114.158, 22.281, 'Central District - Central and Western District'),
    ])
    expect(results).toHaveLength(1)
  })

  it('keeps distinct places that share a display address', () => {
    const results = dedupeLocations([
      at(114.158, 22.281, 'Central District'),
      at(114.200, 22.380, 'Central District'),
    ])
    expect(results).toHaveLength(2)
  })

  it('keeps the first occurrence', () => {
    const [first] = dedupeLocations([
      { ...at(114.158, 22.281, 'Central'), nameEN: 'first' },
      { ...at(114.158, 22.281, 'Central'), nameEN: 'second' },
    ])
    expect(first?.nameEN).toBe('first')
  })
})
