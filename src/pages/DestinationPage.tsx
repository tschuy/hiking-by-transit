import { DestinationMap } from '../components/DestinationMap'
import { formatAccessRoutes } from '../data/transitRouteNames'
import { getPlaceContent, placeContent } from '../data/content'
import { getCatalogDestination, getCatalogHike, getCatalogTrailheadById } from '../data/trailheadCatalog'
import { NotFoundPage } from './NotFoundPage'

export function DestinationPage({ slug }: { slug: string }) {
  const destination = getCatalogDestination(slug)
  if (!destination) return <NotFoundPage />
  const trailheads = destination.trailheadIds.map(getCatalogTrailheadById).filter((trailhead) => trailhead !== undefined)
  const hikes = [...new Set(trailheads.flatMap((trailhead) => trailhead.hikeIds))].map(getCatalogHike).filter((hike) => hike !== undefined)
  const placeMatch = placeContent.find((place) => place.title.localeCompare(destination.name, undefined, { sensitivity: 'base' }) === 0)
  const editorialPlace = placeMatch ? getPlaceContent(placeMatch.slug) : undefined

  return <article className="page container destination-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/trailheads">Trailheads</a><span aria-hidden="true">/</span><span>{destination.name}</span></nav>
    <p className="eyebrow">Outdoor destination</p>
    <h1>{destination.name}</h1>
    <p className="page-lede">Explore {trailheads.length} transit-accessible trailhead{trailheads.length === 1 ? '' : 's'} serving {destination.name}.</p>
    {editorialPlace && <p className="destination-guide-link"><a className="button-link" href={`/places/${editorialPlace.slug}`}>Read the {editorialPlace.title} destination guide <span aria-hidden="true">→</span></a></p>}

    <DestinationMap destination={destination} trailheads={trailheads} />

    <section className="destination-trailheads" aria-labelledby="destination-trailheads-title">
      <p className="eyebrow">Choose an entrance</p><h2 id="destination-trailheads-title">Transit-accessible trailheads</h2>
      <div className="trailhead-list">{trailheads.map((trailhead) => {
        const walkMinutes = trailhead.access.map((item) => item.walkMinutes).filter((value): value is number => value !== null).sort((a, b) => a - b)[0]
        const routes = [...new Set(trailhead.access.flatMap(formatAccessRoutes))]
        return <article className="trailhead-row" key={trailhead.id}><div><h3><a href={`/trailheads/${trailhead.slug}`}>{trailhead.entranceName ?? trailhead.name}</a></h3><p>{walkMinutes === undefined ? 'See access notes for transit details' : `${Math.round(walkMinutes)} min walk from transit`}{routes.length ? ` · ${routes.join(', ')}` : ''}</p></div><a href={`/trailheads/${trailhead.slug}`} aria-label={`View access details for ${trailhead.name}`}>Access details <span aria-hidden="true">→</span></a></article>
      })}</div>
    </section>

    {hikes.length > 0 && <section className="record-panel"><h2>Recommended hikes</h2><ul>{hikes.map((hike) => <li key={hike.id}><a href={`/hikes/${hike.slug}`}><strong>{hike.title}</strong></a><span>{hike.lengthLabel} · {hike.difficulty}</span></li>)}</ul></section>}
  </article>
}
