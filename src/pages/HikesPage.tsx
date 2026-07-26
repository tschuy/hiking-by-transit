import { ContentHikeCard } from '../components/ContentHikeCard'
import { hikeContent } from '../data/content'

export function HikesPage() {
  return <section className="page container"><h1>All hikes</h1><p className="page-lede">Browse hike guides from across the state.</p><div className="card-grid">{hikeContent.map((hike) => <ContentHikeCard hike={hike} key={hike.hike_id} />)}</div></section>
}
