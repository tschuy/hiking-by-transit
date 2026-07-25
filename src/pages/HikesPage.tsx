import { ContentHikeCard } from '../components/ContentHikeCard'
import { hikeContent } from '../data/content'

export function HikesPage() {
  return <section className="page container"><p className="eyebrow">Transit-first trail guides</p><h1>All hikes</h1><p className="page-lede">Browse every normalized hike guide currently available.</p><div className="card-grid">{hikeContent.map((hike) => <ContentHikeCard hike={hike} key={hike.hike_id} />)}</div></section>
}
