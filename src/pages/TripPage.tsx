import { TransitBadge } from '../components/TransitBadge'
import { getPark, getTrail, getTrailhead, getTrip } from '../data/trails'
import { NotFoundPage } from './NotFoundPage'

export function TripPage({ slug }: { slug: string }) {
  const trip = getTrip(slug)
  const trail = trip ? getTrail(trip.trailSlug) : undefined
  const trailhead = trail ? getTrailhead(trail.trailheadSlug) : undefined
  const park = trail ? getPark(trail.parkSlug) : undefined

  if (!trip || !trail || !trailhead || !park) return <NotFoundPage />

  return (
    <article className="page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>Trips</span></nav>
      <p className="eyebrow">{park.name}</p>
      <h1>{trail.name}</h1>
      <p className="page-lede">{trail.summary}</p>
      <ul className="summary-grid" aria-label="Trip summary">
        <li><strong>{trail.distanceMiles} mi</strong><span>Distance</span></li>
        <li><strong>{trail.elevationGainFeet} ft</strong><span>Elevation gain</span></li>
        <li><strong>{trail.difficulty}</strong><span>Difficulty</span></li>
        <li><strong>{trip.estimatedTransitTime}</strong><span>Transit time</span></li>
      </ul>
      <section className="content-panel">
        <p className="eyebrow">Transit overview</p><h2>From {trip.origin}</h2>
        <p>{trip.transferSummary}</p>
        <div className="badge-row">{trailhead.transitRoutes.map((route) => <TransitBadge key={route.routeName} route={route} />)}</div>
        <p className="notice"><strong>Plan ahead:</strong> {trip.returnServiceWarning}</p>
      </section>
      <p className="field-note">The complete itinerary, map, safety, and accessibility content arrives in Milestone 4.</p>
    </article>
  )
}
