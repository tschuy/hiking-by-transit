import { getCatalogHike, getCatalogPlace, getCatalogTrailhead } from '../data/trailheadCatalog'
import { TrailheadAccessMap } from '../components/TrailheadAccessMap'
import { googleMapsUrl } from '../map/googleMaps'
import { NotFoundPage } from './NotFoundPage'

export function TrailheadPage({ slug }: { slug: string }) {
  const trailhead = getCatalogTrailhead(slug)
  if (!trailhead) return <NotFoundPage />

  const places = trailhead.placeIds.map(getCatalogPlace).filter(Boolean)
  const relatedHikes = trailhead.hikeIds.map(getCatalogHike).filter(Boolean)

  return (
    <article className="page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/trailheads">Trailheads</a><span aria-hidden="true">/</span><span>{trailhead.name}</span></nav>
      <p className="eyebrow">Trailhead{places.length ? ` · ${places.at(-1)?.title}` : ''}</p>
      <h1>{trailhead.name}</h1>

      <TrailheadAccessMap trailhead={trailhead} />

      {trailhead.notes && <p className="notice content-panel">{trailhead.notes}</p>}
      <section className="content-panel">
        <p className="eyebrow">Arrive by transit</p>
        <h2>Nearby stops</h2>
        {trailhead.access.length ? <ul className="record-list">{trailhead.access.map((access) => <li key={`${access.id}-${access.sourceFid}`}><strong>{access.stopName}</strong><span>{access.walkMinutes === null ? 'See access notes' : `${Math.round(access.walkMinutes)} min walk`}{access.routeIds.length ? ` · ${access.routeIds.join(', ')}` : ''}</span>{access.notes && <p>{access.notes}</p>}<a href={googleMapsUrl(access.coordinates)} target="_blank" rel="noreferrer">Open stop in Google Maps ↗</a></li>)}</ul> : <p>No transit access record is currently available.</p>}
      </section>

      {relatedHikes.length > 0 ? <section className="record-panel"><h2>Recommended hikes from here</h2><ul>{relatedHikes.map((hike) => hike && <li key={hike.id}><a href={`/hikes/${hike.slug}`}><strong>{hike.title}</strong></a><span>{hike.lengthLabel} · {hike.difficulty}</span></li>)}</ul></section> : <p className="field-note">This reference record does not have a complete hike guide yet.</p>}
    </article>
  )
}
