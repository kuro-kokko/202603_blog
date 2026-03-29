import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'
import type { TocItem } from '../types.js'

function elementText(node: Element): string {
  const parts: string[] = []
  visit(node, 'text', (t: { value: string }) => {
    parts.push(t.value)
  })
  return parts.join('')
}

export function extractToc(hast: Root): TocItem[] {
  const items: TocItem[] = []
  visit(hast, 'element', (node: Element) => {
    if (node.tagName === 'h2' || node.tagName === 'h3') {
      const depth = parseInt(node.tagName[1], 10)
      const id = typeof node.properties?.['id'] === 'string' ? node.properties['id'] : ''
      const text = elementText(node)
      if (id && text) {
        items.push({ id, text, depth })
      }
    }
  })
  return items
}
