import type { Page } from '../types.js'

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

interface PostListProps {
  pages: Page[]
  title?: string
}

export function PostList({ pages, title }: PostListProps) {
  const sorted = [...pages].sort(
    (a, b) =>
      b.frontmatter.createDateTime.getTime() - a.frontmatter.createDateTime.getTime(),
  )

  return (
    <section class="post-list">
      {title && <h2 class="post-list__heading">{title}</h2>}
      {sorted.length === 0 ? (
        <p class="post-list__empty">記事がありません。</p>
      ) : (
        <ul class="post-list__items">
          {sorted.map((page) => {
            const created = formatDate(page.frontmatter.createDateTime)
            return (
              <li key={page.slug} class="post-card">
                <a href={page.url} class="post-card__link">
                  <h3 class="post-card__title">{page.frontmatter.title}</h3>
                </a>
                <div class="post-card__meta">
                  <time class="post-card__date" dateTime={created}>
                    {created}
                  </time>
                  {page.frontmatter.tags.length > 0 && (
                    <ul class="post-card__tags">
                      {page.frontmatter.tags.map((tag) => (
                        <li key={tag} class="post-card__tags-item">
                          <a href={`/tags/${encodeURIComponent(tag)}/`} class="tag-badge tag-badge--sm">
                            {tag}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {page.frontmatter.description && (
                  <p class="post-card__description">{page.frontmatter.description}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
