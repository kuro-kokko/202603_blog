import { toHtml } from 'hast-util-to-html'
import type { Root } from 'hast'

interface ArticleBodyProps {
  hast: Root
}

export function ArticleBody({ hast }: ArticleBodyProps) {
  const html = toHtml(hast)
  return (
    <div
      class="article-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
