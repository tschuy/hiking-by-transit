import { ContentHikeCard } from '../components/ContentHikeCard'
import { MarkdownContent } from '../components/MarkdownContent'
import { TrailheadMap } from '../components/TrailheadMap'
import { DestinationAccess } from '../components/DestinationAccess'
import { getGuideContent, getGuidePath, getPlaceContent, hikeContent, placeContent } from '../data/content'
import { mapScopePresets } from '../map/scopes'
import { NotFoundPage } from './NotFoundPage'
import { getOwnedCatalogDestinations } from '../data/trailheadCatalog'

const kindLabels = { region: 'Region', park: 'Destination park', forest: 'Forest', 'recreation-area': 'Recreation area' }

export function PlacePage({ slug }: { slug: string }) {
  const place = getPlaceContent(slug)
  if (!place) return <NotFoundPage />
  const parent = place.parent_id ? getPlaceContent(place.parent_id) : undefined
  const children = placeContent.filter((candidate) => candidate.parent_id === place.place_id)
  const descendants = new Set([place.place_id, ...children.map((child) => child.place_id)])
  const hikes = hikeContent.filter((hike) => hike.place_ids.some((id) => descendants.has(id)))
  const guides = (place.guide_ids ?? []).map(getGuideContent).filter((guide) => guide !== undefined)
  const mapScope = mapScopePresets[place.place_id]
  const ownedDestinations = getOwnedCatalogDestinations(place.place_id)

  return <article className="page container place-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span>{parent && <><a href={`/places/${parent.slug}`}>{parent.title}</a><span aria-hidden="true">/</span></>}<span>{place.title}</span></nav>
    <p className="eyebrow">{kindLabels[place.kind]}</p><h1>{place.title}</h1>{place.blurb && <p className="page-lede">{place.blurb}</p>}
    {place.image && <img className="hike-hero-image" src={`/assets/${place.image}`} alt={`Landscape in ${place.title}`} />}
    <MarkdownContent markdown={place.body} />
    {guides.length > 0 && <aside className="place-guide-callout"><p className="eyebrow">Plan your trip</p><h2>Getting to and around {place.title}</h2>{guides.map((guide) => <a className="button-link" href={getGuidePath(guide.slug)} key={guide.guide_id}>{guide.title} <span aria-hidden="true">→</span></a>)}</aside>}
    {children.length > 0 && <section className="place-section" aria-labelledby="within-place"><h2 id="within-place">Places within {place.title}</h2><nav className="region-list" aria-label={`Places within ${place.title}`}>{children.map((child) => <a href={`/places/${child.slug}`} key={child.place_id}>{child.title}<span aria-hidden="true"> →</span></a>)}</nav></section>}
    {hikes.length > 0 && <section className="place-section" aria-labelledby="place-hikes"><h2 id="place-hikes">Recommended hikes</h2><div className="card-grid">{hikes.map((hike) => <ContentHikeCard hike={hike} key={hike.hike_id} />)}</div></section>}
    {ownedDestinations.length > 0 && <DestinationAccess destinations={ownedDestinations} label={place.title} showRelatedHikes={false} />}
    {ownedDestinations.length === 0 && mapScope && <section className="place-section" aria-labelledby="place-map"><p className="eyebrow">Trailhead access</p><h2 id="place-map">Trailheads in {place.title}</h2><TrailheadMap key={place.place_id} scope={place.place_id} center={mapScope.center} transitGroups={mapScope.transitGroups} defaultTransitGroups={mapScope.defaultTransitGroups} label={place.title} /></section>}
  </article>
}
