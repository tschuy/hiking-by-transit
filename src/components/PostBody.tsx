import { Fragment } from 'react'
import { GpxMap } from './GpxMap'
import { MarkdownContent } from './MarkdownContent'

export function PostBody({ markdown, title }: { markdown: string; title: string }) {
  const parts = markdown.split(/\n*\[\[(gpx|gpx-pair|youtube):([^\]]+)\]\]\n*/g)
  const content = []
  for (let index = 0; index < parts.length; index += 3) {
    if (parts[index]?.trim()) content.push(<MarkdownContent markdown={parts[index]} key={`copy-${index}`} />)
    const kind = parts[index + 1]
    const value = parts[index + 2]
    if (kind === 'gpx') content.push(<GpxMap file={value} title={title} compact key={`gpx-${value}`} />)
    if (kind === 'gpx-pair') {
      const [image, gpx] = value.split('|')
      content.push(<div className="post-media-pair" key={`gpx-pair-${gpx}`}><img src={image} alt="" loading="lazy" /><GpxMap file={gpx} title={title} /></div>)
    }
    if (kind === 'youtube') content.push(<div className="video-embed" key={`video-${value}`}><iframe src={`https://www.youtube.com/embed/${value}`} title={`Video for ${title}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>)
  }
  return <Fragment>{content}</Fragment>
}
