import configJson from '../../public/assets/data/config.json'
import catalogJson from './catalog-v0.9.generated.json'
import type { CatalogAccess, CatalogRoute } from '../types/catalog'

interface RawAgency { short_name?: string; long_name?: string }
interface RawFeed { gtfs: { url: string }; agencies: Record<string, RawAgency> }

const feeds = Object.values(configJson.feeds) as RawFeed[]

function agencyFor(access: CatalogAccess, agencyId?: string): RawAgency | undefined {
  const matchingFeed = feeds.find((feed) => feed.gtfs.url === access.gtfsSource)
  if (agencyId) return matchingFeed?.agencies[agencyId] ?? feeds.map((feed) => feed.agencies[agencyId]).find(Boolean)
  const agencies = matchingFeed ? Object.values(matchingFeed.agencies) : []
  return agencies.length === 1 ? agencies[0] : undefined
}

function cleanRouteName(routeId: string): string {
  const routeName = routeId.includes(':') ? routeId.slice(routeId.indexOf(':') + 1) : routeId
  return routeName.replace(/-(?:N|S)$/i, '').replace(/^0+(?=\d)/, '')
}

export function formatAccessRoutes(access: CatalogAccess): string[] {
  return formatAccessRoutesUsing(access, catalogJson.routes)
}

export function formatAccessRoutesUsing(access: CatalogAccess, routes: CatalogRoute[]): string[] {
  const names = access.routeIds.map((routeId) => {
    const metadata = routes.find((route) => route.gtfsSource === access.gtfsSource && route.id === routeId)
    const agencyId = metadata?.agencyId ?? (routeId.includes(':') ? routeId.slice(0, routeId.indexOf(':')) : undefined)
    const agency = agencyFor(access, agencyId)
    const agencyName = agency?.short_name ?? agency?.long_name
    const routeName = cleanRouteName(metadata?.shortName ?? metadata?.longName ?? routeId)
    return agencyName && agencyName !== routeName ? `${agencyName} ${routeName}` : agencyName ?? routeName
  })
  return [...new Set(names)]
}
