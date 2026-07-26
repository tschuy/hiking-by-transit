import { placeContent, visiblePlaceContent } from '../data/content'

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

export function PlacesPage() {
  const parentName = (parentId?: string) => placeContent.find((place) => place.place_id === parentId)?.title
  return <section className="page container"><h1>Places</h1><p className="page-lede">Explore beyond. Learn how to visit California's National Parks and famous outdoor destinations.</p><div className="places-grid">{visiblePlaceContent.map((place) => {
    const parent = parentName(place.parent_id)
    const summary = place.blurb ?? firstBodyParagraph(place.body)
    return <a className={`editorial-card${place.image ? ' editorial-card-with-image' : ''}`} href={`/places/${place.slug}`} key={place.place_id}>{place.image && <img src={`/assets/${place.image}`} alt="" loading="lazy" />}{parent && <span className="card-context">{parent}</span>}<strong>{place.title}</strong>{summary && <span>{summary}</span>}<b>Explore this place <span aria-hidden="true">→</span></b></a>
  })}</div></section>
}
