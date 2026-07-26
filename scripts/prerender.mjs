import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const serverEntry = path.join(root, 'dist-ssr', 'entry-server.js')
const { prerenderPaths, renderPage } = await import(`${pathToFileURL(serverEntry).href}?v=${Date.now()}`)
const template = await readFile(path.join(dist, 'index.html'), 'utf8')

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function outputFile(pathname) {
  return pathname === '/' ? path.join(dist, 'index.html') : path.join(dist, pathname.slice(1), 'index.html')
}

for (const pathname of prerenderPaths) {
  const { appHtml, metadata } = renderPage(pathname)
  const canonicalUrl = `https://hikingbytransit.com${metadata.canonicalPath === '/' ? '/' : metadata.canonicalPath}`
  const structuredData = metadata.structuredData
    ? `<script type="application/ld+json">${JSON.stringify(metadata.structuredData).replaceAll('<', '\\u003c')}</script>`
    : ''
  const socialTags = [
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="Hiking by Transit" />`,
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(metadata.socialImage)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(metadata.socialImage)}" />`,
  ].join('')
  const headTags = `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />${socialTags}${structuredData}`
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(metadata.description)}" />`)
    .replace('</head>', `    ${headTags}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
  const file = outputFile(pathname)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, html)
}

const notFound = renderPage('/__prerendered-not-found__')
const notFoundHtml = template
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Page not found · Hiking by Transit</title>')
  .replace(/<meta name="description" content="[^"]*" \/>/, '<meta name="description" content="The requested Hiking by Transit page could not be found." />')
  .replace('<div id="root"></div>', `<div id="root">${notFound.appHtml}</div>`)
await writeFile(path.join(dist, '404.html'), notFoundHtml)

console.log(`Prerendered ${prerenderPaths.length} routes.`)
