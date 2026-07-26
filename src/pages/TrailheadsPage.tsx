import { TrailheadMap } from '../components/TrailheadMap'
import { MarkdownContent } from '../components/MarkdownContent'
import { getPageContent } from '../data/content'

export function TrailheadsPage() {
  const methodology = getPageContent('about-data')
  return (
    <section className="page container">
      <div className="section-heading trailhead-heading"><div><p className="eyebrow">Statewide explorer</p><h1>Transit-accessible trailheads</h1><p className="page-lede">Explore all transit-accessible trailheads across California, including trailheads without a curated hike guide.</p></div></div>

      <TrailheadMap />

      {methodology && <section className="map-methodology" aria-labelledby="map-methodology-title"><p className="eyebrow">How the map is made</p><h2 id="map-methodology-title">{methodology.title}</h2><MarkdownContent markdown={methodology.body} /></section>}
    </section>
  )
}
