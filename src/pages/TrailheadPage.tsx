import { TransitBadge } from '../components/TransitBadge'
import { getPark, getTrailhead, trails } from '../data/trails'
import { NotFoundPage } from './NotFoundPage'

export function TrailheadPage({ slug }: { slug: string }) {
  const trailhead = getTrailhead(slug)
  if (!trailhead) return <NotFoundPage />

  const park = getPark(trailhead.parkSlug)
  const relatedHikes = trails.filter((trail) => trail.trailheadSlug === trailhead.slug)

  return (
    <article className="page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/trailheads">Trailheads</a><span aria-hidden="true">/</span><span>{trailhead.name}</span></nav>
      <p className="eyebrow">Trailhead{park ? ` · ${park.name}` : ''}</p>
      <h1>{trailhead.name}</h1>
      <p className="page-lede">A transit-accessible starting point at {trailhead.coordinates.latitude.toFixed(4)}, {trailhead.coordinates.longitude.toFixed(4)}.</p>

      <div className="content-panel">
        <p className="eyebrow">Arrive by transit</p>
        <h2>{trailhead.stopName}</h2>
        <p>Allow about {trailhead.walkFromStopMinutes} minutes to walk from the stop to the trailhead.</p>
        <div className="badge-row">{trailhead.transitRoutes.map((route) => <TransitBadge key={`${route.agency}-${route.routeName}`} route={route} />)}</div>
        <p>{trailhead.accessibilityNotes}</p>
      </div>

      {relatedHikes.length > 0 ? <section className="record-panel"><h2>Recommended hikes from here</h2><ul>{relatedHikes.map((trail) => <li key={trail.slug}><a href={`/trips/${trail.slug}`}><strong>{trail.name}</strong></a><span>{trail.distanceMiles} miles · {trail.difficulty}</span></li>)}</ul></section> : <p className="field-note">This reference record does not have a complete hike guide yet.</p>}
    </article>
  )
}
