import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const geojsonPath = path.join(root, 'dist/assets/geojson/bayarea.geojson')
const secondGeojsonPath = path.join(root, 'dist/assets/geojson/bayarea-2.geojson')
const configPath = path.join(root, 'dist/assets/data/config.json')
const maxPartBytes = 20 * 1024 * 1024

const collection = JSON.parse(await readFile(geojsonPath, 'utf8'))
const parts = [[], []]
const partSizes = [0, 0]

for (const feature of collection.features) {
  const featureBytes = Buffer.byteLength(JSON.stringify(feature)) + 1
  const target = partSizes[0] <= partSizes[1] ? 0 : 1
  if (partSizes[target] + featureBytes > maxPartBytes) {
    throw new Error('The Bay Area GeoJSON needs more than two deployment parts.')
  }
  parts[target].push(feature)
  partSizes[target] += featureBytes
}

const collectionMetadata = Object.fromEntries(Object.entries(collection).filter(([key]) => key !== 'features'))
await Promise.all([
  writeFile(geojsonPath, JSON.stringify({ ...collectionMetadata, features: parts[0] })),
  writeFile(secondGeojsonPath, JSON.stringify({ ...collectionMetadata, features: parts[1] })),
])

const config = JSON.parse(await readFile(configPath, 'utf8'))
config.feeds['bayarea-2'] = structuredClone(config.feeds.bayarea)
const bayAreaMembers = config.feed_groups.bayarea.members
if (!bayAreaMembers.includes('bayarea-2')) bayAreaMembers.push('bayarea-2')
await writeFile(configPath, JSON.stringify(config))
