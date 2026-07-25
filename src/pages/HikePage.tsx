import { GpxMap } from '../components/GpxMap'
import { InlineMarkdown, MarkdownContent } from '../components/MarkdownContent'
import { getHikeContent, getPlaceContent } from '../data/content'
import { NotFoundPage } from './NotFoundPage'

export function HikePage({ slug }: { slug: string }) {
  const hike = getHikeContent(slug)
  if (!hike) return <NotFoundPage />
  const place = getPlaceContent(hike.place_ids.at(-1) ?? '')
  const difficulty = hike.difficulty_human ?? hike.difficulty

  return <article className="page container hike-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/hikes">Hikes</a><span aria-hidden="true">/</span><span>{hike.title}</span></nav>
    <p className="eyebrow">{place?.title ?? 'Hike guide'}</p><h1>{hike.title}</h1>{hike.blurb && <p className="page-lede">{hike.blurb}</p>}
    {hike.image && <img className="hike-hero-image" src={`/assets/${hike.image}`} alt={`Landscape along ${hike.title}`} />}
    <ul className="summary-grid hike-summary" aria-label="Hike summary"><li><strong>{hike.length}</strong><span>Distance</span></li><li><strong>{difficulty}</strong><span>Difficulty</span></li><li><strong>{hike.travel.served === 'daily' ? 'All week' : hike.travel.served}</strong><span>Transit service</span></li><li><strong>{hike.trailhead_ids.length || 'Unmatched'}</strong><span>Trailheads</span></li></ul>
    {hike.travel.served !== 'daily' && <p className="notice content-panel"><strong>Plan ahead:</strong> This trailhead is not served seven days a week. Check current schedules before leaving.</p>}
    <section className="transit-itinerary" aria-labelledby="transit-title"><p className="eyebrow">Transit itinerary</p><h2 id="transit-title">From {hike.travel.origin}</h2><div className="itinerary-grid"><TravelLeg title="To the trail" leg={hike.travel.out} />{hike.travel.return && <TravelLeg title="Return trip" leg={hike.travel.return} />}</div>{hike.travel.origin && <p className="field-note">Travel times are estimates from {hike.travel.origin}.</p>}</section>
    <div className="hike-actions">{hike['park-link'] && <a href={hike['park-link']}>Park information</a>}{hike.trailhead?.link && <a href={hike.trailhead.link}>{hike.trailhead.name || 'Open trailhead in maps'}</a>}{hike['hike-link'] && <a href={hike['hike-link']}>Open hike in maps</a>}{hike.gpx && <a href={`/assets/gpx/${hike.gpx}`} download>Download GPX</a>}</div>
    {hike['getting-there'] && <aside className="getting-there-infobox"><h2>Getting there</h2><p><InlineMarkdown markdown={hike['getting-there']} /></p></aside>}
    <MarkdownContent markdown={hike.body} />
    {hike.gpx ? <GpxMap file={hike.gpx} title={hike.title} /> : <p className="notice"><em>This legacy guide does not yet include a GPX route.</em></p>}
  </article>
}

function TravelLeg({ title, leg }: { title: string; leg: { time: string; routes: { name: string; link: string }[]; stops: { name: string; link: string; for?: string }[] } }) {
  return <section className="itinerary-card"><h3>{title}</h3><p><strong>Travel time:</strong> {leg.time}</p><h4>Routes</h4><ul>{leg.routes.map((route) => <li key={`${route.name}-${route.link}`}><a href={route.link}>{route.name}</a></li>)}</ul><h4>Stops</h4><ul>{leg.stops.map((stop) => <li key={`${stop.name}-${stop.link}`}><a href={stop.link}>{stop.name}</a>{stop.for && <> — {stop.for}</>}</li>)}</ul></section>
}
