const allowedElements = new Set(['A', 'B', 'BR', 'EM', 'H3', 'H4', 'I', 'LI', 'OL', 'P', 'STRONG', 'UL'])

function safeHref(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed
  try {
    const url = new URL(trimmed)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

export function sanitizeMapHtml(html: string): string {
  const documentValue = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = documentValue.body.firstElementChild
  if (!root) return ''

  const clean = (node: Node): Node | undefined => {
    if (node.nodeType === Node.TEXT_NODE) return documentValue.createTextNode(node.textContent ?? '')
    if (!(node instanceof Element)) return undefined
    if (!allowedElements.has(node.tagName)) {
      const fragment = documentValue.createDocumentFragment()
      Array.from(node.childNodes).forEach((child) => {
        const cleaned = clean(child)
        if (cleaned) fragment.append(cleaned)
      })
      return fragment
    }
    const element = documentValue.createElement(node.tagName.toLowerCase())
    if (node.tagName === 'A') {
      const href = safeHref(node.getAttribute('href') ?? '')
      if (href) {
        element.setAttribute('href', href)
        if (href.startsWith('http')) {
          element.setAttribute('target', '_blank')
          element.setAttribute('rel', 'noreferrer')
        }
      }
    }
    Array.from(node.childNodes).forEach((child) => {
      const cleaned = clean(child)
      if (cleaned) element.append(cleaned)
    })
    return element
  }

  const output = documentValue.createElement('div')
  Array.from(root.childNodes).forEach((child) => {
    const cleaned = clean(child)
    if (cleaned) output.append(cleaned)
  })
  return output.innerHTML
}
