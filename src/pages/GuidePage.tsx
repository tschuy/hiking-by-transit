import { MarkdownContent } from '../components/MarkdownContent'
import { getGuideContent, getPlaceContent } from '../data/content'
import { NotFoundPage } from './NotFoundPage'

export function GuidePage({ slug }: { slug: string }) {
  const guide = getGuideContent(slug)
  if (!guide) return <NotFoundPage />
  const place = getPlaceContent(guide.place_ids[0] ?? '')
  return <article className="page container guide-page"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span>{place && <><a href={`/places/${place.slug}`}>{place.title}</a><span aria-hidden="true">/</span></>}<span>{guide.title}</span></nav><p className="eyebrow">Transit guide</p><h1>{guide.title}</h1><MarkdownContent markdown={guide.body} /></article>
}
