import { postContent } from '../data/content'

const formatDate = (date: string) => new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))

export function PostsPage() {
  return <section className="page container"><p className="eyebrow">News and guides</p><h1>Posts</h1><p className="page-lede">Updates, trip-planning resources, and news about reaching the outdoors by transit.</p><div className="post-list">{postContent.map((post) => <article className={`post-card${post.image ? '' : ' post-card-no-image'}`} key={post.url}>{post.image && <img src={`/assets/${post.image}`} alt="" loading="lazy" />}<div><time dateTime={post.date}>{formatDate(post.date)}</time><h2><a href={post.url}>{post.title}</a></h2></div></article>)}</div></section>
}
