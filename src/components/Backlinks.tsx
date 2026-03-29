import type { Page } from '../types.js'

interface BacklinksProps {
  backlinks: Page[]
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function Backlinks({ backlinks }: BacklinksProps) {
  if (backlinks.length === 0) return null

  return (
    <section class="backlinks" aria-label="この記事へのリンク">
      <p class="backlinks__heading">この記事へのリンク</p>
      <ul class="backlinks__list">
        {backlinks.map((page) => (
          <li key={page.slug} class="backlinks__item">
            <a href={page.url} class="backlinks__link">
              <span class="backlinks__title">{page.frontmatter.title}</span>
              <time class="backlinks__date" dateTime={formatDate(page.frontmatter.createDateTime)}>
                {formatDate(page.frontmatter.createDateTime)}
              </time>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
