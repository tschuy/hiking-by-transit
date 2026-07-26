import { renderToString } from 'react-dom/server'
import App, { prerenderPaths, resolveRoute } from './App'

export { prerenderPaths }

export function renderPage(pathname: string) {
  const route = resolveRoute(pathname)
  return {
    appHtml: renderToString(<App pathname={pathname} />),
    metadata: route.metadata,
  }
}
