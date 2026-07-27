import { TrailheadMap } from '../components/TrailheadMap'
import { MarkdownContent } from '../components/MarkdownContent'
import { getPageContent } from '../data/content'

export function TrailheadsPage() {
  const methodology = getPageContent('about-data')
  const [methodologyIntroduction, includedServices = ''] = methodology?.body.split('## Included services\n\n') ?? []
  const [includedServicesBody, methodologyConclusion = ''] = includedServices.split('## Planned services\n\n')

  return (
    <section className="page container">
      <div className="section-heading trailhead-heading"><div><h1>Transit-accessible trailheads</h1><p className="page-lede">Explore all transit-accessible trailheads across California, including trailheads without a curated hike guide.</p></div></div>

      <TrailheadMap />

      {methodology && <section className="map-methodology" aria-labelledby="map-methodology-title">
        <h2 id="map-methodology-title">{methodology.title}</h2>
        <MarkdownContent markdown={methodologyIntroduction} />
        {includedServicesBody && <details className="methodology-disclosure"><summary>Included services</summary><MarkdownContent markdown={includedServicesBody} /></details>}
        {methodologyConclusion && <MarkdownContent markdown={`## Planned services\n\n${methodologyConclusion}`} />}
      </section>}
    </section>
  )
}
