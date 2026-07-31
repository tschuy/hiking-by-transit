import type { HikeContent } from '../types/content'
import { getPlaceContent } from '../data/content'

export function ContentHikeCard({ hike }: { hike: HikeContent }) {
  const place = getPlaceContent(hike.place_ids.at(-1) ?? '')

  return (
    <article className={`trail-card${hike.image ? '' : ' trail-card-no-image'}`}>
      {hike.image && <img className="card-photo" src={`/assets/${hike.image}`} alt="" loading="lazy" />}
      <div className="card-body">
        {place && <p className="card-context">{place.title}</p>}
        <h3><a href={`/hikes/${hike.slug}`}>{hike.title}</a></h3>
        {hike.blurb && <p>{hike.blurb}</p>}
        <ul className="fact-list" aria-label="Hike details"><li className="travel-time">{hike.travel.out.time} from {hike.travel.origin}</li><li>{hike.length}</li><li>{hike.difficulty_human ?? hike.difficulty}</li></ul>
      </div>
    </article>
  )
}
