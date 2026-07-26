import { MarkdownContent } from '../components/MarkdownContent'
import { getPageContent } from '../data/content'
import { NotFoundPage } from './NotFoundPage'

export function ContentPage({ slug }: { slug: string }) {
  const page = getPageContent(slug)
  if (!page) return <NotFoundPage />
  return <article className="page container"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>{page.title}</span></nav><h1>{page.title}</h1><MarkdownContent markdown={page.body} /></article>
}
