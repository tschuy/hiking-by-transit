import type { HikeContent } from '../types/content'

export function ContentHikeCard({ hike }: { hike: HikeContent }) {
  return (
    <article className="trail-card">
      {hike.image ? <img className="card-photo" src={`/assets/${hike.image}`} alt="" loading="lazy" /> : <div className="card-landscape" aria-hidden="true"><span>▲</span></div>}
      <div className="card-body">
        <p className="eyebrow">{hike.place_ids.at(-1)?.replaceAll('-', ' ')}</p>
        <h3><a href={`/hikes/${hike.slug}`}>{hike.title}</a></h3>
        <p>{hike.blurb ?? 'Open the guide for route and transit details.'}</p>
        <ul className="fact-list" aria-label="Hike details"><li>{hike.length}</li><li>{hike.difficulty_human ?? hike.difficulty}</li></ul>
      </div>
    </article>
  )
}
