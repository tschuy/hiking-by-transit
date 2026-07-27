import { placeContent, visiblePlaceContent } from '../data/content'
import type { PlaceContent } from '../types/content'

function firstBodyParagraph(markdown: string) {
  const paragraph = markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(?:#{1,6}\s|!\[|<|\[\[)/.test(block))

  return paragraph
    ?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function PlaceCard({ place }: { place: PlaceContent }) {
  const parentName = (parentId?: string) => placeContent.find((place) => place.place_id === parentId)?.title
  const parent = parentName(place.parent_id)
  const summary = place.blurb ?? firstBodyParagraph(place.body)
  return <a className={`editorial-card${place.image ? ' editorial-card-with-image' : ''}`} href={`/places/${place.slug}`}>{place.image && <img src={`/assets/${place.image}`} alt="" loading="lazy" />}{parent && parent !== 'California' && <span className="card-context">{parent}</span>}<strong>{place.title}</strong>{summary && <span>{summary}</span>}<b>Explore this place <span aria-hidden="true">→</span></b></a>
}

export function PlacesPage() {
  const destinationGuides = visiblePlaceContent.filter((place) => place.parent_id === 'california' && place.place_id !== 'bay-area')
  const regions = visiblePlaceContent.filter((place) => place.place_id === 'bay-area' || place.parent_id === 'bay-area')

  return <section className="page container"><h1>Places</h1><p className="page-lede">Explore beyond. Learn how to visit California's National Parks and famous outdoor destinations.</p>
    <section className="places-section" aria-labelledby="destination-guides-title"><h2 id="destination-guides-title">Destination guides</h2><div className="places-grid">{destinationGuides.map((place) => <PlaceCard place={place} key={place.place_id} />)}</div></section>
    <section className="places-section" aria-labelledby="regions-title"><h2 id="regions-title">Regions</h2><div className="places-grid">{regions.map((place) => <PlaceCard place={place} key={place.place_id} />)}</div></section>
  </section>
}
