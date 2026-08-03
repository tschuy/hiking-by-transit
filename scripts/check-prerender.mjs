import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const serverEntry = path.join(root, 'dist-ssr', 'entry-server.js')
const { prerenderPaths, renderPage } = await import(`${pathToFileURL(serverEntry).href}?v=${Date.now()}`)
const failures = []

for (const pathname of prerenderPaths) {
  const file = pathname === '/' ? path.join(dist, 'index.html') : path.join(dist, pathname.slice(1), 'index.html')
  const html = await readFile(file, 'utf8')
  if (!/<main id="main-content">[\s\S]+<\/main>/.test(html)) failures.push(`${pathname}: empty main content`)
  if (!/<title>(?!Hiking by Transit<\/title>).*<\/title>/.test(html) && pathname !== '/') failures.push(`${pathname}: generic or missing title`)
  if (!/<link rel="canonical" href="https:\/\/hikingbytransit\.com\//.test(html)) failures.push(`${pathname}: missing canonical URL`)
  if (!/<meta property="og:image" content="https:\/\/[^\"]+" \/>/.test(html)) failures.push(`${pathname}: missing Open Graph image`)
  if (!html.includes('<meta name="twitter:card" content="summary_large_image" />')) failures.push(`${pathname}: missing Twitter card`)
  if (!/<script type="module" crossorigin src="\/assets\//.test(html)) failures.push(`${pathname}: missing hydration bundle`)
}

const notFoundHtml = await readFile(path.join(dist, '404.html'), 'utf8')
if (!notFoundHtml.includes('<h1>Page not found</h1>')) failures.push('404.html: missing not-found content')

const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8')
for (const pathname of prerenderPaths) {
  const canonicalPath = renderPage(pathname).metadata.canonicalPath
  const canonicalUrl = `https://hikingbytransit.com${canonicalPath === '/' ? '/' : canonicalPath}`
  if (!sitemap.includes(`<loc>${canonicalUrl}</loc>`)) failures.push(`sitemap.xml: missing ${canonicalUrl}`)
}
const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8')
if (!robots.includes('Sitemap: https://hikingbytransit.com/sitemap.xml')) failures.push('robots.txt: missing sitemap declaration')

if (failures.length) throw new Error(`Prerender verification failed:\n- ${failures.join('\n- ')}`)
console.log(`Verified ${prerenderPaths.length} prerendered routes.`)
