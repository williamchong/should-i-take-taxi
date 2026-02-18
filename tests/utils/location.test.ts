import { describe, it, expect } from 'vitest'
import { createLocationFromCoordinates } from '~/utils/location'

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
