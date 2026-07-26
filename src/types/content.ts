export interface ContentLink {
  name: string
  link: string
  for?: string
}

export interface TravelLeg {
  time: string
  routes: ContentLink[]
  stops: ContentLink[]
}

export interface HikeContent {
  layout: 'hike'
  hike_id: string
  slug: string
  title: string
  trailhead_ids: string[]
  place_ids: string[]
  tags: string[]
  difficulty: string
  difficulty_human?: string
  length: string
  travel: {
    origin: string
    served: string
    out: TravelLeg
    return?: TravelLeg
  }
  trailhead?: ContentLink
  gpx?: string
  image?: string
  blurb?: string
  body: string
  'park-link'?: string
  'hike-link'?: string
  'map-embed'?: string
  'getting-there'?: string
}

export interface PlaceContent {
  layout: 'place'
  place_id: string
  slug: string
  title: string
  kind: 'region' | 'park' | 'forest' | 'recreation-area'
  parent_id?: string
  image?: string
  blurb?: string
  body: string
  guide_ids?: string[]
  destination_names?: string[]
}

export interface PostContent {
  layout: 'post'
  slug: string
  title: string
  date: string
  url: string
  image?: string
  gpx?: boolean
  body: string
}

export interface GuideContent {
  layout: 'guide'
  guide_id: string
  slug: string
  title: string
  place_ids: string[]
  body: string
}

export interface EventContent {
  layout: 'event'
  slug: string
  title: string
  event_date: string
  published_date: string
  url: string
  body: string
}

export interface PageContent {
  layout: 'page'
  page_id: string
  slug: string
  title: string
  body: string
}

export interface ContentCatalog {
  hikes: HikeContent[]
  places: PlaceContent[]
  posts: PostContent[]
  guides: GuideContent[]
  events: EventContent[]
  pages: PageContent[]
}
