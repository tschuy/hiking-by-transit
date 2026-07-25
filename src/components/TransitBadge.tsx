import type { TransitRoute } from '../types/trails'

export function TransitBadge({ route }: { route: TransitRoute }) {
  return <span className="transit-badge">{route.mode} · {route.routeName}</span>
}
