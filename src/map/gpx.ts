import type { Extent } from 'olmap'

export interface RouteSample {
  longitude: number
  latitude: number
  elevationMeters: number
  distanceMeters: number
  mapCoordinate: [number, number]
}

export interface ParsedRoute {
  samples: RouteSample[]
  lines: number[][][]
  extent: Extent
  distanceMeters: number
  elevationGainMeters: number
  elevationLossMeters: number
  minimumElevationMeters: number
  maximumElevationMeters: number
}

const earthRadius = 6_378_137

export function lonLatToMap(longitude: number, latitude: number): [number, number] {
  const boundedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude))
  return [
    earthRadius * longitude * Math.PI / 180,
    earthRadius * Math.log(Math.tan(Math.PI / 4 + boundedLatitude * Math.PI / 360)),
  ]
}

function distanceBetween(left: RouteSample, right: RouteSample): number {
  const latitudeDelta = (right.latitude - left.latitude) * Math.PI / 180
  const longitudeDelta = (right.longitude - left.longitude) * Math.PI / 180
  const leftLatitude = left.latitude * Math.PI / 180
  const rightLatitude = right.latitude * Math.PI / 180
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2
  return 2 * earthRadius * Math.asin(Math.sqrt(value))
}

export function parseGpx(xml: string): ParsedRoute {
  const documentValue = new DOMParser().parseFromString(xml, 'application/xml')
  if (documentValue.querySelector('parsererror')) throw new Error('The GPX file is not valid XML')
  const segmentNodes = [...documentValue.querySelectorAll('trkseg')]
  const pointGroups = segmentNodes.length
    ? segmentNodes.map((segment) => [...segment.querySelectorAll('trkpt')])
    : [[...documentValue.querySelectorAll('rtept')]]
  const samples: RouteSample[] = []
  const lines: number[][][] = []
  let distanceMeters = 0
  let elevationGainMeters = 0
  let elevationLossMeters = 0

  pointGroups.forEach((points) => {
    const line: number[][] = []
    let previous: RouteSample | undefined
    points.forEach((point) => {
      const longitude = Number(point.getAttribute('lon'))
      const latitude = Number(point.getAttribute('lat'))
      const elevationMeters = Number(point.querySelector('ele')?.textContent ?? 0)
      if (![longitude, latitude, elevationMeters].every(Number.isFinite)) return
      const sample: RouteSample = { longitude, latitude, elevationMeters, distanceMeters, mapCoordinate: lonLatToMap(longitude, latitude) }
      if (previous) {
        distanceMeters += distanceBetween(previous, sample)
        sample.distanceMeters = distanceMeters
        const elevationDelta = elevationMeters - previous.elevationMeters
        if (elevationDelta > 0) elevationGainMeters += elevationDelta
        else elevationLossMeters -= elevationDelta
      }
      samples.push(sample)
      line.push([longitude, latitude, elevationMeters])
      previous = sample
    })
    if (line.length) lines.push(line)
  })
  if (samples.length < 2) throw new Error('The GPX file does not contain a route')
  const xValues = samples.map((sample) => sample.mapCoordinate[0])
  const yValues = samples.map((sample) => sample.mapCoordinate[1])
  const elevations = samples.map((sample) => sample.elevationMeters)
  return {
    samples,
    lines,
    extent: [Math.min(...xValues), Math.min(...yValues), Math.max(...xValues), Math.max(...yValues)],
    distanceMeters,
    elevationGainMeters,
    elevationLossMeters,
    minimumElevationMeters: Math.min(...elevations),
    maximumElevationMeters: Math.max(...elevations),
  }
}

export function nearestRouteSample(samples: RouteSample[], coordinate: [number, number]): number {
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY
  samples.forEach((sample, index) => {
    const x = sample.mapCoordinate[0] - coordinate[0]
    const y = sample.mapCoordinate[1] - coordinate[1]
    const distance = x * x + y * y
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })
  return nearestIndex
}
