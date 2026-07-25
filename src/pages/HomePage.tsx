import { SearchForm } from '../components/SearchForm'
import { ContentHikeCard } from '../components/ContentHikeCard'
import { HeroSlideshow } from '../components/HeroSlideshow'
import { hikeContent, placeContent, postContent } from '../data/content'

export function HomePage() {
  const bayAreaRegions = placeContent.filter((place) => place.parent_id === 'bay-area')
  const featuredPlaces = placeContent.filter((place) => ['tahoe', 'north-coast', 'yosemite-national-park', 'channel-islands-national-park'].includes(place.place_id))
  const bayAreaHikes = hikeContent.filter((hike) => hike.place_ids.includes('bay-area'))

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div>
            <h1>Take transit to the trail.</h1>
            <p className="hero-copy">Find California hikes, parks, and trailheads you can reach by bus, train, or ferry.</p>
            <a className="hero-map-cta" href="/trailheads">
              <span className="hero-map-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48" role="img"><path d="m4 10 12-5 16 6 12-5v32l-12 5-16-6-12 5V10Z" /><path d="M16 5v32m16-26v32" /><circle cx="25" cy="23" r="4" /><path d="M25 27c-4-4-6-7-6-10a6 6 0 0 1 12 0c0 3-2 6-6 10Z" /></svg>
              </span>
              <span className="hero-map-copy"><strong>Explore the trailhead map</strong><span>Browse every transit-accessible trailhead across California</span></span>
              <span className="hero-map-arrow" aria-hidden="true">→</span>
            </a>
            <SearchForm />
          </div>
          <HeroSlideshow />
        </div>
      </section>

      <section className="section container" id="bay-area-hikes" aria-labelledby="bay-area-title">
        <div className="section-heading">
          <div><p className="eyebrow">Recommended nearby trips</p><h2 id="bay-area-title">Hike the Bay Area</h2></div>
          <p>Explore redwoods, wetlands, oak savannahs, and more in our regional backyard.</p>
        </div>
        <nav className="region-list" aria-label="Bay Area subregions">
          {bayAreaRegions.map((region) => <a href={`/places/${region.slug}`} key={region.slug}>{region.title}<span aria-hidden="true"> →</span></a>)}
        </nav>
        <div className="card-grid home-hike-grid">
          {bayAreaHikes.map((hike) => <ContentHikeCard key={hike.hike_id} hike={hike} />)}
        </div>
      </section>

      <section className="section section-tint" id="places" aria-labelledby="places-title">
        <div className="container">
          <div className="section-heading"><div><p className="eyebrow">Go farther</p><h2 id="places-title">Explore places</h2></div><p>Browse regions and destination parks together, with transit guidance, seasonal constraints, recommended hikes, and nearby trailheads.</p></div>
          <div className="places-grid">
            {featuredPlaces.map((place, index) => <a className={`editorial-card region-theme-${index % 3 + 1}`} href={`/places/${place.slug}`} key={place.slug}><span className="eyebrow">{place.kind === 'park' ? 'Destination park' : 'California place'}</span><strong>{place.title}</strong><span>{place.blurb ?? 'Place guide'}</span><b>Explore this place <span aria-hidden="true">→</span></b></a>)}
          </div>
        </div>
      </section>

      <section className="section container" aria-labelledby="latest-posts-title"><div className="section-heading"><div><p className="eyebrow">From Hiking by Transit</p><h2 id="latest-posts-title">Latest posts</h2></div><a href="/posts">View all posts <span aria-hidden="true">→</span></a></div><div className="post-list post-list-home">{postContent.slice(0, 3).map((post) => <article className={`post-card${post.image ? '' : ' post-card-no-image'}`} key={post.url}>{post.image && <img src={`/assets/${post.image}`} alt="" loading="lazy" />}<div><time dateTime={post.date}>{post.date}</time><h3><a href={post.url}>{post.title}</a></h3></div></article>)}</div></section>
    </>
  )
}
