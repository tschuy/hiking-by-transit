import { catalogDestinations, getDestinationPath } from '../data/trailheadCatalog'
import type { CatalogDestination } from '../types/catalog'

const destinations = [...new Map(
  [...catalogDestinations]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((destination) => [getDestinationPath(destination), destination]),
).entries()]

const destinationGroups = Object.entries(destinations.reduce<Record<string, Array<[string, CatalogDestination]>>>((groups, entry) => {
  const letter = entry[1].name.charAt(0).toLocaleUpperCase()
  groups[letter] = [...(groups[letter] ?? []), entry]
  return groups
}, {})).sort(([a], [b]) => a.localeCompare(b))

export function DestinationsPage() {
  return <section className="page container destination-directory">
    <h1>Destinations</h1>
    <nav className="destination-directory-groups" aria-label="Destinations">
      {destinationGroups.map(([letter, entries]) => <section className="destination-directory-group" aria-labelledby={`destinations-${letter}`} key={letter}>
        <h2 id={`destinations-${letter}`}>{letter}</h2>
        <ul>{entries.map(([path, destination]) => <li key={path}><a href={path}><span>{destination.name}</span><small>{destination.trailheadIds.length} trailhead{destination.trailheadIds.length === 1 ? '' : 's'}</small></a></li>)}</ul>
      </section>)}
    </nav>
  </section>
}
