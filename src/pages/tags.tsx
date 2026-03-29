import type { BuildContext } from '../types.js'
import { Layout } from '../components/Layout.js'
import { TagList } from '../components/TagList.js'
import { Profile } from '../components/Profile.js'

interface TagsPageProps {
  ctx: BuildContext
}

export function TagsPage({ ctx }: TagsPageProps) {
  const { config, tagMap } = ctx

  const sidebar = (
    <>
      <Profile profile={config.profile} />
    </>
  )

  return (
    <Layout
      config={config}
      title={`タグ一覧 | ${config.title}`}
      description="タグ一覧"
      url="/tags/"
      sidebar={sidebar}
    >
      <section class="tags-page">
        <h1 class="tags-page__heading">タグ一覧</h1>
        <TagList tagMap={tagMap} />
      </section>
    </Layout>
  )
}
