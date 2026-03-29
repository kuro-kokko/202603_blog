import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Text, Link, PhrasingContent } from 'mdast'

/**
 * [[slug]] または [[slug|エイリアス]] を Markdown のリンクノードに変換する remark プラグイン。
 */
export const remarkWikiLink: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (index === undefined || !parent) return

      const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
      const parts: (string | Link)[] = []
      let last = 0
      let match: RegExpExecArray | null

      while ((match = re.exec(node.value)) !== null) {
        if (match.index > last) {
          parts.push(node.value.slice(last, match.index))
        }
        const slug = match[1].trim()
        const label = match[2]?.trim() ?? slug
        const link: Link = {
          type: 'link',
          url: `/${slug}/`,
          children: [{ type: 'text', value: label }],
        }
        parts.push(link)
        last = match.index + match[0].length
      }

      if (parts.length === 0) return // マッチなし

      if (last < node.value.length) {
        parts.push(node.value.slice(last))
      }

      const newNodes: PhrasingContent[] = parts.map((p) =>
        typeof p === 'string' ? ({ type: 'text', value: p } as Text) : p,
      )

      parent.children.splice(index, 1, ...newNodes)
    })
  }
}
