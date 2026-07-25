import type { KeyboardEvent, PointerEvent } from 'react'
import type { ParsedRoute } from '../map/gpx'

const metersToFeet = 3.28084
const metersToMiles = 0.000621371

function formatFeet(meters: number): string {
  return `${Math.round(meters * metersToFeet).toLocaleString()} ft`
}

export function ElevationProfile({ route, activeIndex, onActiveIndex }: {
  route: ParsedRoute
  activeIndex?: number
  onActiveIndex: (index?: number) => void
}) {
  const width = 1000
  const height = 220
  const inset = 14
  const elevationRange = Math.max(1, route.maximumElevationMeters - route.minimumElevationMeters)
  const stride = Math.max(1, Math.ceil(route.samples.length / 500))
  const plotted = route.samples.filter((_sample, index) => index % stride === 0 || index === route.samples.length - 1)
  const point = (index: number) => {
    const sample = route.samples[index]
    return {
      x: inset + sample.distanceMeters / route.distanceMeters * (width - inset * 2),
      y: inset + (route.maximumElevationMeters - sample.elevationMeters) / elevationRange * (height - inset * 2),
    }
  }
  const path = plotted.map((sample, index) => {
    const x = inset + sample.distanceMeters / route.distanceMeters * (width - inset * 2)
    const y = inset + (route.maximumElevationMeters - sample.elevationMeters) / elevationRange * (height - inset * 2)
    return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
  const activePoint = activeIndex === undefined ? undefined : point(activeIndex)
  const activeSample = activeIndex === undefined ? undefined : route.samples[activeIndex]

  const inspectPointer = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
    const targetDistance = ratio * route.distanceMeters
    let low = 0
    let high = route.samples.length - 1
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      if (route.samples[middle].distanceMeters < targetDistance) low = middle + 1
      else high = middle
    }
    onActiveIndex(low)
  }

  const inspectKeyboard = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = Math.max(1, Math.round(route.samples.length / 100))
    const current = activeIndex ?? 0
    let next: number | undefined
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.min(route.samples.length - 1, current + step)
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.max(0, current - step)
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = route.samples.length - 1
    if (next !== undefined) {
      event.preventDefault()
      onActiveIndex(next)
    }
  }

  return <figure className="elevation-profile">
    <figcaption>
      <strong>{(route.distanceMeters * metersToMiles).toFixed(1)} mi</strong>
      <span>{formatFeet(route.elevationGainMeters)} gain</span>
      <span>{formatFeet(route.elevationLossMeters)} loss</span>
      <span>{formatFeet(route.minimumElevationMeters)}–{formatFeet(route.maximumElevationMeters)}</span>
    </figcaption>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Route elevation profile. Use arrow keys to inspect elevation along the route." tabIndex={0} onKeyDown={inspectKeyboard} onPointerMove={inspectPointer} onPointerLeave={() => onActiveIndex(undefined)}>
      <path className="elevation-profile-area" d={`${path} L${width - inset},${height - inset} L${inset},${height - inset} Z`} />
      <path className="elevation-profile-line" d={path} />
      {activePoint && <><line className="elevation-profile-cursor" x1={activePoint.x} x2={activePoint.x} y1={inset} y2={height - inset} /><circle className="elevation-profile-point" cx={activePoint.x} cy={activePoint.y} r="7" /></>}
    </svg>
    <p aria-live="polite">{activeSample ? `${(activeSample.distanceMeters * metersToMiles).toFixed(1)} miles: ${formatFeet(activeSample.elevationMeters)}` : 'Move across the profile or focus it and use the arrow keys to inspect the route.'}</p>
  </figure>
}
