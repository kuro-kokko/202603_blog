import type { TocItem } from '../types.js'

interface TocProps {
  items: TocItem[]
}

export function Toc({ items }: TocProps) {
  if (items.length === 0) return null

  return (
    <nav class="toc" aria-label="目次">
      <p class="toc__heading">目次</p>
      <ol class="toc__list">
        {items.map((item) => (
          <li
            key={item.id}
            class={`toc__item toc__item--h${item.depth}`}
            style={item.depth === 3 ? 'margin-left: 1rem' : undefined}
          >
            <a href={`#${item.id}`} class="toc__link">
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
