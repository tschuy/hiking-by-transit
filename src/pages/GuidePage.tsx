import { MarkdownContent } from '../components/MarkdownContent'
import { getGuideContent, getPlaceContent } from '../data/content'
import { NotFoundPage } from './NotFoundPage'

export function GuidePage({ slug }: { slug: string }) {
  const guide = getGuideContent(slug)
  if (!guide) return <NotFoundPage />
  const place = getPlaceContent(guide.place_ids[0] ?? '')
  return <article className="page container guide-page"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span>{place && <><a href={`/places/${place.slug}`}>{place.title}</a><span aria-hidden="true">/</span></>}<span>{guide.title}</span></nav><p className="eyebrow">Transit guide</p><h1>{guide.title}</h1><MarkdownContent markdown={guide.body} />{guide.guide_id === 'samcoast' && <aside className="place-guide-callout"><p className="eyebrow">Trailhead access</p><h2>Explore the Coastside</h2><p>The place-scoped SamCoast map will return when the map library accepts geographic filters from React. The statewide map includes the underlying trailhead data.</p><a className="button-link" href="/trailheads">Open the trailhead map</a></aside>}</article>
}
