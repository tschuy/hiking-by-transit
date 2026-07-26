import { PostBody } from '../components/PostBody'
import { getPostContent } from '../data/content'
import { NotFoundPage } from './NotFoundPage'

const formatDate = (date: string) => new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))

export function PostPage({ date, slug }: { date: string; slug: string }) {
  const post = getPostContent(date, slug)
  if (!post) return <NotFoundPage />
  return <article className="page container post-page"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/posts">Posts</a><span aria-hidden="true">/</span><span>{post.title}</span></nav><p className="eyebrow">News and guides</p><h1>{post.title}</h1><time className="post-date" dateTime={post.date}>{formatDate(post.date)}</time><PostBody markdown={post.body} title={post.title} /></article>
}
