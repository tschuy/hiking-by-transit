import { describe, expect, it } from 'vitest'
import { lonLatToMap, nearestRouteSample, parseGpx } from './gpx'

const fixture = `<?xml version="1.0"?><gpx><trk><trkseg>
  <trkpt lat="37.0000" lon="-122.0000"><ele>10</ele></trkpt>
  <trkpt lat="37.0010" lon="-122.0010"><ele>30</ele></trkpt>
  <trkpt lat="37.0020" lon="-122.0020"><ele>20</ele></trkpt>
</trkseg></trk></gpx>`

describe('GPX parsing', () => {
  it('derives ordered projected extents, distance, and elevation totals', () => {
    const route = parseGpx(fixture)
    expect(route.samples).toHaveLength(3)
    expect(route.extent[0]).toBeLessThan(route.extent[2])
    expect(route.extent[1]).toBeLessThan(route.extent[3])
    expect(route.distanceMeters).toBeGreaterThan(200)
    expect(route.elevationGainMeters).toBe(20)
    expect(route.elevationLossMeters).toBe(10)
  })

  it('finds the nearest route sample in map coordinates', () => {
    const route = parseGpx(fixture)
    expect(nearestRouteSample(route.samples, route.samples[1].mapCoordinate)).toBe(1)
    expect(lonLatToMap(0, 0)[0]).toBeCloseTo(0)
  })

  it('rejects malformed and empty route data', () => {
    expect(() => parseGpx('<gpx>')).toThrow('not valid XML')
    expect(() => parseGpx('<gpx></gpx>')).toThrow('does not contain a route')
  })
})
