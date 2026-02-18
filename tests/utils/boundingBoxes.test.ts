import { describe, it, expect } from 'vitest'
import {
  isWithinBoundingBox,
  toBounds,
  LANTAU_BOUNDING_BOX,
  HK_ISLAND_BOX_1,
  HK_ISLAND_BOX_2,
} from '~/utils/boundingBoxes'
import type { BoundingBox } from '~/utils/boundingBoxes'

const testBox: BoundingBox = {
  minLat: 22.2,
  maxLat: 22.4,
  minLng: 114.1,
  maxLng: 114.3,
}

describe('isWithinBoundingBox', () => {
  it('returns true for a point inside the box', () => {
    expect(isWithinBoundingBox(22.3, 114.2, testBox)).toBe(true)
  })

  it('returns true for a point on the boundary', () => {
    expect(isWithinBoundingBox(22.2, 114.1, testBox)).toBe(true) // min corner
    expect(isWithinBoundingBox(22.4, 114.3, testBox)).toBe(true) // max corner
    expect(isWithinBoundingBox(22.3, 114.1, testBox)).toBe(true) // on min lng edge
    expect(isWithinBoundingBox(22.3, 114.3, testBox)).toBe(true) // on max lng edge
    expect(isWithinBoundingBox(22.2, 114.2, testBox)).toBe(true) // on min lat edge
    expect(isWithinBoundingBox(22.4, 114.2, testBox)).toBe(true) // on max lat edge
  })

  it('returns false for a point outside - north', () => {
    expect(isWithinBoundingBox(22.5, 114.2, testBox)).toBe(false)
  })

  it('returns false for a point outside - south', () => {
    expect(isWithinBoundingBox(22.1, 114.2, testBox)).toBe(false)
  })

  it('returns false for a point outside - east', () => {
    expect(isWithinBoundingBox(22.3, 114.4, testBox)).toBe(false)
  })

  it('returns false for a point outside - west', () => {
    expect(isWithinBoundingBox(22.3, 114.0, testBox)).toBe(false)
  })
})

describe('toBounds', () => {
  it('converts a BoundingBox to Leaflet bounds format', () => {
    const bounds = toBounds(testBox)
    expect(bounds).toEqual([
      [22.2, 114.1],
      [22.4, 114.3],
    ])
  })
})

describe('real HK coordinates', () => {
  // Central, Hong Kong Island (~22.282, 114.158)
  const centralLat = 22.282
  const centralLng = 114.158

  // Tsim Sha Tsui, Kowloon (~22.297, 114.172)
  const tstLat = 22.297
  const tstLng = 114.172

  // Tung Chung, Lantau (~22.289, 113.941)
  const tungChungLat = 22.289
  const tungChungLng = 113.941

  it('Central is within HK Island Box 1', () => {
    expect(isWithinBoundingBox(centralLat, centralLng, HK_ISLAND_BOX_1)).toBe(true)
  })

  it('TST is NOT within HK Island boxes', () => {
    expect(isWithinBoundingBox(tstLat, tstLng, HK_ISLAND_BOX_1)).toBe(false)
    expect(isWithinBoundingBox(tstLat, tstLng, HK_ISLAND_BOX_2)).toBe(false)
  })

  it('Tung Chung is within Lantau bounding box', () => {
    expect(isWithinBoundingBox(tungChungLat, tungChungLng, LANTAU_BOUNDING_BOX)).toBe(true)
  })

  it('Central is NOT within Lantau bounding box', () => {
    expect(isWithinBoundingBox(centralLat, centralLng, LANTAU_BOUNDING_BOX)).toBe(false)
  })

  it('TST is NOT within Lantau bounding box', () => {
    expect(isWithinBoundingBox(tstLat, tstLng, LANTAU_BOUNDING_BOX)).toBe(false)
  })
})
