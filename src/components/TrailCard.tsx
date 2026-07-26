import { getPark, getTrailhead } from '../data/trails'
import type { Trail } from '../types/trails'
import { TransitBadge } from './TransitBadge'

export function TrailCard({ trail }: { trail: Trail }) {
  const park = getPark(trail.parkSlug)
  const trailhead = getTrailhead(trail.trailheadSlug)

  return (
    <article className="trail-card">
      <div className="card-landscape" aria-hidden="true"><span>▲</span></div>
      <div className="card-body">
        <p className="card-context">{park?.name}</p>
        <h3><a href={`/trips/${trail.slug}`}>{trail.name}</a></h3>
        <p>{trail.summary}</p>
        <ul className="fact-list" aria-label="Trail details">
          <li>{trail.distanceMiles} miles</li>
          <li>{trail.difficulty}</li>
          <li>{trail.elevationGainFeet.toLocaleString()} ft gain</li>
        </ul>
        {trailhead?.transitRoutes.map((route) => (
          <TransitBadge key={`${route.agency}-${route.routeName}`} route={route} />
        ))}
      </div>
    </article>
  )
}
