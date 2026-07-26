import { DestinationMap } from './DestinationMap'
import { formatAccessRoutes } from '../data/transitRouteNames'
import { formatServiceFrequency } from '../data/transitFrequency'
import { getCatalogHike, getCatalogTrailheadById } from '../data/trailheadCatalog'
import type { CatalogDestination } from '../types/catalog'

export function DestinationAccess({ destinations, label, showRelatedHikes = true }: { destinations: CatalogDestination[]; label: string; showRelatedHikes?: boolean }) {
  const trailheads = [...new Set(destinations.flatMap((destination) => destination.trailheadIds))]
    .map(getCatalogTrailheadById)
    .filter((trailhead) => trailhead !== undefined)
  const hikes = [...new Set(trailheads.flatMap((trailhead) => trailhead.hikeIds))].map(getCatalogHike).filter((hike) => hike !== undefined)

  return <section className="destination-access" aria-labelledby="destination-access-title">
    <h2 id="destination-access-title">Transit-accessible entrances</h2>
    <p className="destination-access-lede">Explore {trailheads.length} transit-accessible trailhead{trailheads.length === 1 ? '' : 's'} serving {label}.</p>
    <DestinationMap label={label} trailheads={trailheads} />

    <section className="destination-trailheads" aria-labelledby="destination-trailheads-title">
      <h3 id="destination-trailheads-title">Trailheads</h3>
      <div className="trailhead-list">{trailheads.map((trailhead) => {
        const walkMinutes = trailhead.access.map((item) => item.walkMinutes).filter((value): value is number => value !== null).sort((a, b) => a - b)[0]
        return <article className="trailhead-row" key={trailhead.id}><div><h4><a href={`/trailheads/${trailhead.slug}`}>{trailhead.entranceName ?? trailhead.name}</a></h4><p>{walkMinutes === undefined ? 'See access notes for transit details' : `${Math.round(walkMinutes)} min walk from transit`}</p><ul className="destination-stop-service">{trailhead.access.map((access) => {
          const routes = formatAccessRoutes(access)
          const frequency = formatServiceFrequency(access)
          return routes.length > 0 && <li key={`${access.id}-${access.sourceFid}`}><strong>{access.stopName}</strong><span>Served by {routes.join(', ')}</span>{frequency.length > 0 && <span>{frequency.join(' · ')}</span>}</li>
        })}</ul></div><a href={`/trailheads/${trailhead.slug}`} aria-label={`View access details for ${trailhead.name}`}>Access details <span aria-hidden="true">→</span></a></article>
      })}</div>
    </section>

    {showRelatedHikes && hikes.length > 0 && <section className="record-panel"><h2>Recommended hikes</h2><ul>{hikes.map((hike) => <li key={hike.id}><a href={`/hikes/${hike.slug}`}><strong>{hike.title}</strong></a><span>{hike.lengthLabel} · {hike.difficulty}</span></li>)}</ul></section>}
  </section>
}
