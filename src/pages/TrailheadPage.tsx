import { getCatalogDestinationById, getCatalogHike, getCatalogPlace, getCatalogTrailhead, getDestinationPath } from '../data/trailheadCatalog'
import { TrailheadAccessMap } from '../components/TrailheadAccessMap'
import { googleMapsUrl } from '../map/googleMaps'
import { formatAccessRoutes } from '../data/transitRouteNames'
import { NotFoundPage } from './NotFoundPage'

export function TrailheadPage({ slug }: { slug: string }) {
  const trailhead = getCatalogTrailhead(slug)
  if (!trailhead) return <NotFoundPage />

  const places = trailhead.placeIds.map(getCatalogPlace).filter(Boolean)
  const destinations = trailhead.destinationIds.map(getCatalogDestinationById).filter((destination) => destination !== undefined)
  const relatedHikes = trailhead.hikeIds.map(getCatalogHike).filter(Boolean)

  return (
    <article className="page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/trailheads">Trailheads</a><span aria-hidden="true">/</span><span>{trailhead.name}</span></nav>
      <p className="page-context">Trailhead{places.length ? ` · ${places.at(-1)?.title}` : ''}</p>
      <h1>{trailhead.name}</h1>

      {destinations.length > 0 && <nav className="trailhead-destinations" aria-label="Outdoor destinations served by this trailhead"><span>Destinations</span>{destinations.map((destination) => <a href={getDestinationPath(destination)} key={destination.id}>{destination.name}</a>)}</nav>}

      <TrailheadAccessMap trailhead={trailhead} />

      {trailhead.notes && <p className="notice content-panel">{trailhead.notes}</p>}
      <section className="content-panel">
        <h2>Nearby stops</h2>
        {trailhead.access.length ? <ul className="trailhead-stop-list">{trailhead.access.map((access) => {
          const routes = formatAccessRoutes(access)
          return <li key={`${access.id}-${access.sourceFid}`}><strong>{access.stopName}</strong><p className="trailhead-stop-walk">{access.walkMinutes === null ? 'See access notes' : `${Math.round(access.walkMinutes)} min walk`}</p>{routes.length > 0 && <p className="trailhead-stop-routes">Served by {routes.join(', ')}</p>}{access.notes && <p>{access.notes}</p>}<a href={googleMapsUrl(access.coordinates)} target="_blank" rel="noreferrer">Open stop in Google Maps ↗</a></li>
        })}</ul> : <p>Structured stop details are not available for this hand-maintained record. See the access notes above and confirm current service before traveling.</p>}
      </section>

      {relatedHikes.length > 0 ? <section className="record-panel"><h2>Recommended hikes from here</h2><ul>{relatedHikes.map((hike) => hike && <li key={hike.id}><a href={`/hikes/${hike.slug}`}><strong>{hike.title}</strong></a><span>{hike.lengthLabel} · {hike.difficulty}</span></li>)}</ul></section> : <p className="field-note">This reference record does not have a complete hike guide yet.</p>}
    </article>
  )
}
