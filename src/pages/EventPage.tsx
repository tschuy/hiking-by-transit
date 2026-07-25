import { MarkdownContent } from '../components/MarkdownContent'
import { getEventContent } from '../data/content'
import { NotFoundPage } from './NotFoundPage'

export function EventPage({ slug }: { slug: string }) {
  const event = getEventContent(slug)
  if (!event) return <NotFoundPage />
  return <article className="page container"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/events">Events</a><span aria-hidden="true">/</span><span>{event.title}</span></nav><p className="eyebrow">{event.event_date}</p><h1>{event.title}</h1><MarkdownContent markdown={event.body} /></article>
}
