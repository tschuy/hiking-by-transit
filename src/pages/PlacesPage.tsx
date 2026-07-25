import { placeContent, visiblePlaceContent } from '../data/content'

export function PlacesPage() {
  const parentName = (parentId?: string) => placeContent.find((place) => place.place_id === parentId)?.title
  return <section className="page container"><p className="eyebrow">Regions and destinations</p><h1>Places</h1><p className="page-lede">Explore beyond. Learn how to visit California's National Parks and famous outdoor destinations.</p><div className="places-grid">{visiblePlaceContent.map((place, index) => <a className={`editorial-card region-theme-${index % 3 + 1}`} href={`/places/${place.slug}`} key={place.place_id}><span className="eyebrow">{parentName(place.parent_id) ?? place.kind}</span><strong>{place.title}</strong><span>{place.blurb ?? `${place.kind} guide`}</span><b>Explore this place <span aria-hidden="true">→</span></b></a>)}</div></section>
}
