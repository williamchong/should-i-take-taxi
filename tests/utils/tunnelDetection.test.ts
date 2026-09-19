import { describe, it, expect } from 'vitest'
import {
  detectTunnels,
  gateAcross,
  segmentsIntersect,
  TUNNEL_BORES,
  GATE_HALF_WIDTH_M,
  type LngLat,
} from '~/utils/tunnelDetection'
import type { TunnelId } from '~/types/constants'
import fixture from '../fixtures/osrm-routes.json'

const routes = fixture.routes as { id: string; label: string; expect: TunnelId[]; coordinates: LngLat[] }[]

describe('segmentsIntersect', () => {
  it('detects crossing segments', () => {
    expect(segmentsIntersect([0, 0], [2, 2], [0, 2], [2, 0])).toBe(true)
  })

  it('rejects parallel segments', () => {
    expect(segmentsIntersect([0, 0], [2, 0], [0, 1], [2, 1])).toBe(false)
  })

  it('rejects segments that would only cross if extended', () => {
    expect(segmentsIntersect([0, 0], [1, 1], [3, 0], [2, 1])).toBe(false)
  })
})

describe('gateAcross', () => {
  it('lays a gate of the configured width across the middle of the bore', () => {
    // A north–south bore gives an east–west gate centred on its midpoint
    const [a, b] = gateAcross([[114, 22.28], [114, 22.30]])
    expect(a[1]).toBeCloseTo(22.29, 6)
    expect(b[1]).toBeCloseTo(22.29, 6)
    const widthM = Math.abs(a[0] - b[0]) * 111_320 * Math.cos(22.29 * Math.PI / 180)
    expect(widthM).toBeCloseTo(GATE_HALF_WIDTH_M * 2, 0)
  })

  it('crosses its own bore', () => {
    for (const { bore } of TUNNEL_BORES) {
      const gate = gateAcross(bore)
      expect(segmentsIntersect(bore[0], bore[1], gate[0], gate[1])).toBe(true)
    }
  })
})

describe('detectTunnels', () => {
  it('returns nothing for an empty or single-point route', () => {
    expect(detectTunnels([])).toEqual([])
    expect(detectTunnels([[114.17, 22.3]])).toEqual([])
  })

  it('lists a tunnel once even when the route passes it twice', () => {
    const [a, b] = TUNNEL_BORES.find(t => t.tunnel === 'aberdeen')!.bore
    expect(detectTunnels([a, b, a])).toEqual(['aberdeen'])
  })

  it('treats all three harbour crossings as crossHarbour', () => {
    const harbour = TUNNEL_BORES.filter(t => t.tunnel === 'crossHarbour')
    expect(harbour).toHaveLength(3)
    for (const { bore } of harbour) {
      expect(detectTunnels(bore)).toEqual(['crossHarbour'])
    }
  })

  describe('real OSRM routes', () => {
    it.each(routes.map(r => [r.label, r] as const))('%s', (_label, route) => {
      expect(detectTunnels(route.coordinates).sort()).toEqual([...route.expect].sort())
    })

    it('covers every tolled tunnel with a positive and the fixture with near-misses', () => {
      const covered = new Set(routes.flatMap(r => r.expect))
      expect([...covered].sort()).toEqual([...new Set(TUNNEL_BORES.map(t => t.tunnel))].sort())
      expect(routes.filter(r => r.expect.length === 0).length).toBeGreaterThanOrEqual(10)
    })
  })
})
