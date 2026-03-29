function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

interface ArticleHeaderProps {
  title: string
  createDateTime: Date
  updatedDateTime: Date
  tags: string[]
}

export function ArticleHeader({ title, createDateTime, updatedDateTime, tags }: ArticleHeaderProps) {
  const created = formatDate(createDateTime)
  const updated = formatDate(updatedDateTime)
  const showUpdated = created !== updated

  return (
    <header class="article-header">
      <h1 class="article-title">{title}</h1>
      <div class="article-meta">
        <time class="article-meta__date" dateTime={created}>
          <span class="article-meta__label">投稿日</span> {created}
        </time>
        {showUpdated && (
          <time class="article-meta__date article-meta__date--updated" dateTime={updated}>
            <span class="article-meta__label">更新日</span> {updated}
          </time>
        )}
        {tags.length > 0 && (
          <ul class="article-tags">
            {tags.map((tag) => (
              <li key={tag} class="article-tags__item">
                <a href={`/tags/${encodeURIComponent(tag)}/`} class="tag-badge">
                  {tag}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  )
}
