import type { ReactNode } from 'react'

function inline(text: string, keyPrefix = 'inline'): ReactNode[] {
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|<a\s+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>|\*\*([^*]+)\*\*|\*([^*]+)\*/g
  const output: ReactNode[] = []
  let cursor = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) output.push(text.slice(cursor, match.index))
    const key = `${keyPrefix}-${match.index}`
    if (match[1] !== undefined) output.push(<a href={match[2]} key={key}>{inline(match[1], key)}</a>)
    else if (match[3] !== undefined) output.push(<a href={match[3]} key={key}>{inline(match[4], key)}</a>)
    else if (match[5] !== undefined) output.push(<strong key={key}>{inline(match[5], key)}</strong>)
    else if (match[6] !== undefined) output.push(<em key={key}>{inline(match[6], key)}</em>)
    cursor = pattern.lastIndex
  }
  if (cursor < text.length) output.push(text.slice(cursor))
  return output
}

export function InlineMarkdown({ markdown }: { markdown: string }) { return <>{inline(markdown)}</> }

export function MarkdownContent({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n\s*\n/).filter(Boolean)

  return (
    <div className="prose">
      {blocks.map((block, index) => {
        const embeddedSvg = block.match(/^<embed\s+[^>]*src=["']([^"']+\.svg)["'][^>]*(?:title|alt)=["']([^"']+)["'][^>]*>$/i)
        if (embeddedSvg) return <embed className="embedded-svg" src={embeddedSvg[1]} type="image/svg+xml" title={embeddedSvg[2]} aria-label={embeddedSvg[2]} key={index} />
        if (block.startsWith('<!--') || block.startsWith('<') || block.startsWith('{:') || block.startsWith('* Do not remove this line')) return null
        if (/^---+$/.test(block)) return <hr key={index} />
        const tableLines = block.split('\n').filter(Boolean)
        if (tableLines.length >= 2 && tableLines[0].trim().startsWith('|') && /^\|?[\s:|-]+\|?$/.test(tableLines[1].trim())) {
          const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
          const headers = cells(tableLines[0])
          return <div className="table-scroll" key={index} tabIndex={0} role="region" aria-label="Scrollable schedule table"><table><thead><tr>{headers.map((header, cellIndex) => <th scope="col" key={cellIndex}>{inline(header)}</th>)}</tr></thead><tbody>{tableLines.slice(2).map((line, rowIndex) => <tr key={rowIndex}>{cells(line).map((cell, cellIndex) => <td key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>
        }
        const image = block.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:\n([\s\S]+))?$/)
        if (image) return <figure key={index}><img src={image[2]} alt={image[1]} loading="lazy" />{image[3] && <figcaption>{inline(image[3])}</figcaption>}</figure>
        const heading = block.match(/^(#{2,4})\s+(.+)$/)
        if (heading) {
          const level = heading[1].length
          if (level === 2) return <h2 key={index}>{inline(heading[2])}</h2>
          if (level === 3) return <h3 key={index}>{inline(heading[2])}</h3>
          return <h4 key={index}>{inline(heading[2])}</h4>
        }
        const lines = block.split('\n')
        if (lines.every((line) => /^[-*]\s+/.test(line))) {
          return <ul key={index}>{lines.map((line) => <li key={line}>{inline(line.replace(/^[-*]\s+/, ''))}</li>)}</ul>
        }
        if (lines.every((line) => /^\d+\.\s+/.test(line))) {
          return <ol key={index}>{lines.map((line) => <li key={line}>{inline(line.replace(/^\d+\.\s+/, ''))}</li>)}</ol>
        }
        return <p key={index}>{lines.map((line, lineIndex) => <span key={lineIndex}>{inline(line)}{lineIndex < lines.length - 1 && <br />}</span>)}</p>
      })}
    </div>
  )
}
