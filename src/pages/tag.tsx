import type { BuildContext, Page } from '../types.js'
import { Layout } from '../components/Layout.js'
import { PostList } from '../components/PostList.js'
import { Profile } from '../components/Profile.js'
import { TagList } from '../components/TagList.js'

interface TagPageProps {
  tag: string
  pages: Page[]
  ctx: BuildContext
}

export function TagPage({ tag, pages, ctx }: TagPageProps) {
  const { config, tagMap } = ctx

  const sidebar = (
    <>
      <Profile profile={config.profile} />
      <TagList tagMap={tagMap} currentTag={tag} />
    </>
  )

  const url = `/tags/${encodeURIComponent(tag)}/`
  const title = `タグ: ${tag} | ${config.title}`

  return (
    <Layout
      config={config}
      title={title}
      description={`「${tag}」タグの記事一覧`}
      url={url}
      sidebar={sidebar}
    >
      <PostList pages={pages} title={`タグ: ${tag}`} />
    </Layout>
  )
}
