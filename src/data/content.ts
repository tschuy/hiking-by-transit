import catalogJson from './content.generated.json'
import type { ContentCatalog } from '../types/content'

export const contentCatalog = catalogJson as ContentCatalog
export const hikeContent = contentCatalog.hikes
export const placeContent = contentCatalog.places
export const visiblePlaceContent = placeContent.filter((place) => place.place_id !== 'california')
export const postContent = [...contentCatalog.posts].sort((a, b) => b.date.localeCompare(a.date))
export const guideContent = contentCatalog.guides
export const eventContent = [...contentCatalog.events].sort((a, b) => b.published_date.localeCompare(a.published_date))
export const pageContent = contentCatalog.pages

export const getHikeContent = (slug: string) => hikeContent.find((hike) => hike.slug === slug)
export const getPlaceContent = (slug: string) => placeContent.find((place) => place.slug === slug)
export const getPostContent = (date: string, slug: string) => postContent.find((post) => post.date === date && post.slug === slug)
export const getGuideContent = (slug: string) => guideContent.find((guide) => guide.slug === slug)
export const getGuidePath = (slug: string) => {
  return `/guides/${slug}`
}
export const getEventContent = (slug: string) => eventContent.find((event) => event.slug === slug || event.url.includes(`/${slug}/`))
export const getPageContent = (slug: string) => pageContent.find((page) => page.slug === slug)
