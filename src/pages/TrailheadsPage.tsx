import { TransitBadge } from '../components/TransitBadge'
import { TrailheadMap } from '../components/TrailheadMap'
import { MarkdownContent } from '../components/MarkdownContent'
import { getPageContent } from '../data/content'
import { getPark, trailheads } from '../data/trails'

export function TrailheadsPage() {
  const methodology = getPageContent('about-data')
  return (
    <section className="page container">
      <div className="section-heading trailhead-heading"><div><p className="eyebrow">Statewide explorer</p><h1>Transit-accessible trailheads</h1><p className="page-lede">Explore all known access points across California, including trailheads without a curated hike guide.</p></div><span className="view-label" aria-label="Current view">Map view</span></div>

      <TrailheadMap />

      <section className="trailhead-results" aria-labelledby="visible-trailheads">
        <div className="section-heading"><div><p className="eyebrow">Accessible companion view</p><h2 id="visible-trailheads">Featured trailhead records</h2></div><p>The full map dataset is available above. These fixture-backed records demonstrate the companion detail experience while map-to-list synchronization is added.</p></div>
        <div className="trailhead-list">{trailheads.map((trailhead) => <article className="trailhead-row" key={trailhead.slug}><div><p className="eyebrow">{getPark(trailhead.parkSlug)?.name}</p><h2>{trailhead.name}</h2><p>{trailhead.walkFromStopMinutes} minute walk from {trailhead.stopName}</p></div><div>{trailhead.transitRoutes.map((route) => <TransitBadge key={`${route.agency}-${route.routeName}`} route={route} />)}{trailhead.dataOnly && <p className="data-label">Trailhead record · no hike guide yet</p>}</div></article>)}</div>
      </section>

      {methodology && <section className="map-methodology" aria-labelledby="map-methodology-title"><p className="eyebrow">How the map is made</p><h2 id="map-methodology-title">{methodology.title}</h2><MarkdownContent markdown={methodology.body} /></section>}
    </section>
  )
}
