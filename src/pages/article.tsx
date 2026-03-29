import type { BuildContext, Page } from '../types.js'
import { Layout } from '../components/Layout.js'
import { ArticleHeader } from '../components/ArticleHeader.js'
import { ArticleBody } from '../components/ArticleBody.js'
import { Backlinks } from '../components/Backlinks.js'
import { Profile } from '../components/Profile.js'
import { Toc } from '../components/Toc.js'
import { extractToc } from '../lib/toc.js'

interface ArticlePageProps {
  page: Page
  ctx: BuildContext
}

export function ArticlePage({ page, ctx }: ArticlePageProps) {
  const { config } = ctx
  const { frontmatter, hast, url, backlinks } = page
  const backlinkPosition = config.backlinks?.position ?? 'below'
  const tocItems = extractToc(hast)

  const sidebar = (
    <>
      <Profile profile={config.profile} />
      <Toc items={tocItems} />
      {backlinkPosition === 'sidebar' && <Backlinks backlinks={backlinks} />}
    </>
  )

  const title = `${frontmatter.title} | ${config.title}`

  return (
    <Layout
      config={config}
      title={title}
      description={frontmatter.description}
      url={url}
      sidebar={sidebar}
    >
      <article class="article">
        <ArticleHeader
          title={frontmatter.title}
          createDateTime={frontmatter.createDateTime}
          updatedDateTime={frontmatter.updatedDateTime}
          tags={frontmatter.tags}
        />
        <ArticleBody hast={hast} />
        {backlinkPosition === 'below' && <Backlinks backlinks={backlinks} />}
      </article>
    </Layout>
  )
}
