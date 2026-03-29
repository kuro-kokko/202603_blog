import type { TagMap } from '../types.js'

interface TagListProps {
  tagMap: TagMap
  currentTag?: string
}

export function TagList({ tagMap, currentTag }: TagListProps) {
  if (tagMap.size === 0) return null

  const sorted = [...tagMap.entries()].sort((a, b) => b[1].length - a[1].length)

  return (
    <section class="tag-list" aria-label="タグ一覧">
      <p class="tag-list__heading">タグ</p>
      <ul class="tag-list__items">
        {sorted.map(([tag, pages]) => (
          <li key={tag} class="tag-list__item">
            <a
              href={`/tags/${encodeURIComponent(tag)}/`}
              class={`tag-list__link${currentTag === tag ? ' tag-list__link--active' : ''}`}
              aria-current={currentTag === tag ? 'page' : undefined}
            >
              {tag}
              <span class="tag-list__count">{pages.length}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
