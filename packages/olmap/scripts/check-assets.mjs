import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function parseArguments(argv) {
  const values = {}
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index]
    const value = argv[index + 1]
    if (!name?.startsWith('--') || !value) throw new Error(`Invalid argument: ${name ?? ''}`)
    values[name.slice(2)] = value
  }
  return values
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Cannot read JSON ${filePath}: ${error.message}`)
  }
}

function collectGpxValues(value, results = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectGpxValues(entry, results))
  } else if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      if (key === 'gpx' && typeof entry === 'string' && entry) results.add(`gpx/${entry}`)
      else collectGpxValues(entry, results)
    }
  }
  return results
}

export async function checkAssets({ configPath, assetsPath, manifestPath }) {
  const config = await readJson(configPath)
  const errors = []
  const required = new Set()

  if (config.schema_version !== 'legacy-1') errors.push('schema_version must be "legacy-1"')
  if (typeof config.data_version !== 'string' || !config.data_version) errors.push('data_version must be a non-empty string')
  if (!config.feeds || typeof config.feeds !== 'object') errors.push('feeds must be an object')
  if (!config.feed_groups || typeof config.feed_groups !== 'object') errors.push('feed_groups must be an object')
  if (!config.kml_groups || typeof config.kml_groups !== 'object') errors.push('kml_groups must be an object')

  const feeds = config.feeds && typeof config.feeds === 'object' ? config.feeds : {}
  for (const [feedId, feed] of Object.entries(feeds)) {
    required.add(`geojson/${feedId}.geojson`)
    if (!feed?.gtfs?.url) errors.push(`feeds.${feedId}.gtfs.url is required`)
    if (!feed?.agencies || typeof feed.agencies !== 'object') errors.push(`feeds.${feedId}.agencies must be an object`)
    for (const [agencyId, agency] of Object.entries(feed?.agencies ?? {})) {
      if (!agency?.type) errors.push(`feeds.${feedId}.agencies.${agencyId}.type is required`)
      if (!agency?.long_name) errors.push(`feeds.${feedId}.agencies.${agencyId}.long_name is required`)
      for (const [routeId, route] of Object.entries(agency?.routes ?? {})) {
        if (route?.hidden !== undefined && typeof route.hidden !== 'boolean') {
          errors.push(`feeds.${feedId}.agencies.${agencyId}.routes.${routeId}.hidden must be boolean`)
        }
      }
    }
  }

  const groups = config.feed_groups && typeof config.feed_groups === 'object' ? config.feed_groups : {}
  for (const [groupId, group] of Object.entries(groups)) {
    if (!Array.isArray(group?.members)) {
      errors.push(`feed_groups.${groupId}.members must be an array`)
      continue
    }
    for (const feedId of group.members) {
      if (!feeds[feedId]) errors.push(`feed_groups.${groupId} references unknown feed "${feedId}"`)
    }
  }

  const kmlGroups = config.kml_groups && typeof config.kml_groups === 'object' ? config.kml_groups : {}
  for (const [kind, layers] of Object.entries(kmlGroups)) {
    if (!layers || typeof layers !== 'object') {
      errors.push(`kml_groups.${kind} must be an object`)
      continue
    }
    for (const layerId of Object.keys(layers)) required.add(`kml/${layerId}.kml`)
  }

  if (manifestPath) {
    const manifest = await readJson(manifestPath)
    for (const asset of manifest.required ?? []) required.add(asset)
    for (const catalogPath of manifest.catalogs ?? []) {
      const resolvedCatalog = path.resolve(path.dirname(manifestPath), catalogPath)
      collectGpxValues(await readJson(resolvedCatalog), required)
    }
  }

  for (const asset of [...required].sort()) {
    try {
      await access(path.join(assetsPath, asset))
    } catch {
      errors.push(`missing asset: ${asset}`)
    }
  }

  return { errors, checkedAssets: required.size, feeds: Object.keys(feeds).length }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArguments(process.argv.slice(2))
    if (!args.config || !args.assets) throw new Error('--config and --assets are required')
    const result = await checkAssets({
      configPath: path.resolve(args.config),
      assetsPath: path.resolve(args.assets),
      manifestPath: args.manifest ? path.resolve(args.manifest) : undefined,
    })
    if (result.errors.length) {
      result.errors.forEach((error) => console.error(`- ${error}`))
      process.exitCode = 1
    } else {
      console.log(`Validated ${result.feeds} feeds and ${result.checkedAssets} referenced assets.`)
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
