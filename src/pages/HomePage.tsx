import { useEffect, useState } from 'react'
import { SearchForm } from '../components/SearchForm'
import { ContentHikeCard } from '../components/ContentHikeCard'
import { TrailheadMap } from '../components/TrailheadMap'
import { hikeContent, placeContent, postContent } from '../data/content'
import trailMapIcon from '../assets/trail-map.svg'

function shuffled<T>(items: T[]): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = current
  }
  return result
}

export function HomePage() {
  const [homepageHikes, setHomepageHikes] = useState(hikeContent)
  const bayAreaRegions = placeContent.filter((place) => place.parent_id === 'bay-area')
  const featuredPlaces = placeContent.filter((place) => ['tahoe', 'north-coast', 'yosemite-national-park', 'channel-islands-national-park'].includes(place.place_id))

  useEffect(() => {
    const timeout = window.setTimeout(() => setHomepageHikes(shuffled(hikeContent)), 0)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <>
      <section className="hero-section hero-section-map">
        <div className="container hero-grid">
          <div className="hero-content">
            <h1>Take transit to the trail.</h1>
            <p className="hero-copy">Find California hikes, parks, and trailheads you can reach by bus, train, or ferry.</p>
            <SearchForm />
            <a className="hero-map-cta" href="/trailheads">
              <span className="hero-map-icon" aria-hidden="true">
                <img src={trailMapIcon} alt="" />
              </span>
              <span className="hero-map-copy"><strong>Explore the map</strong><span>Browse transit-accessible hikes and trailheads across California</span></span>
              <span className="hero-map-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="hero-trailhead-map"><TrailheadMap variant="home" /></div>
      </section>

      <section className="section container" id="bay-area-hikes" aria-labelledby="bay-area-title">
        <div className="section-heading"><div><h2 id="bay-area-title">Hike the Bay Area</h2></div><p>Explore redwoods, wetlands, oak savannahs, and more in our regional backyard.</p></div>
        <div className="bay-area-region-list">
          {bayAreaRegions.map((region) => {
            const regionHikes = homepageHikes.filter((hike) => hike.place_ids.includes(region.place_id))
            if (regionHikes.length === 0) return null
            return <section className="bay-area-region" aria-labelledby={`bay-area-${region.slug}`} key={region.slug}>
              <div className="bay-area-region-heading"><h3 id={`bay-area-${region.slug}`}>{region.title}</h3><a className="button-link" href={`/places/${region.slug}`}>View All</a></div>
              <div className="home-hike-carousel" role="region" aria-label={`${region.title} hike guides`} tabIndex={0}>
                {regionHikes.map((hike) => <ContentHikeCard key={hike.hike_id} hike={hike} />)}
              </div>
            </section>
          })}
        </div>
      </section>

      <section className="section section-tint" id="places" aria-labelledby="places-title">
        <div className="container">
          <div className="section-heading"><div><h2 id="places-title">Explore destinations</h2></div><p>Get all the details for a car-free visit to California's National Parks and destinations like Lake Tahoe.</p></div>
          <div className="places-grid">
            {featuredPlaces.map((place) => <a className={`editorial-card${place.image ? ' editorial-card-with-image' : ''}`} href={`/places/${place.slug}`} key={place.slug}>{place.image && <img src={`/assets/${place.image}`} alt="" loading="lazy" />}<strong>{place.title}</strong>{place.blurb && <span>{place.blurb}</span>}<b>Explore this place <span aria-hidden="true">→</span></b></a>)}
          </div>
        </div>
      </section>

      <section className="section container" aria-labelledby="latest-posts-title"><div className="section-heading"><div><h2 id="latest-posts-title">Latest posts</h2></div><a href="/posts">View all posts <span aria-hidden="true">→</span></a></div><div className="post-list post-list-home">{postContent.slice(0, 3).map((post) => <article className={`post-card${post.image ? '' : ' post-card-no-image'}`} key={post.url}>{post.image && <img src={`/assets/${post.image}`} alt="" loading="lazy" />}<div><time dateTime={post.date}>{post.date}</time><h3><a href={post.url}>{post.title}</a></h3></div></article>)}</div></section>
    </>
  )
}
