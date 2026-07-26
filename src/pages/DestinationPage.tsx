import { DestinationAccess } from '../components/DestinationAccess'
import { getCatalogDestination } from '../data/trailheadCatalog'
import { NotFoundPage } from './NotFoundPage'

export function DestinationPage({ slug }: { slug: string }) {
  const destination = getCatalogDestination(slug)
  if (!destination) return <NotFoundPage />
  return <article className="page container destination-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/trailheads">Trailheads</a><span aria-hidden="true">/</span><span>{destination.name}</span></nav>
    <p className="eyebrow">Outdoor destination</p>
    <h1>{destination.name}</h1>
    <DestinationAccess destinations={[destination]} label={destination.name} />
  </article>
}
