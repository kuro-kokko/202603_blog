import type { BuildContext, Page } from '../types.js'
import { Layout } from '../components/Layout.js'
import { PostList } from '../components/PostList.js'
import { Profile } from '../components/Profile.js'

interface DatePageProps {
  date: string   // "YYYY-MM-DD"
  pages: Page[]
  ctx: BuildContext
}

export function DatePage({ date, pages, ctx }: DatePageProps) {
  const { config } = ctx
  const url = `/date/${date}/`

  const sidebar = (
    <>
      <Profile profile={config.profile} />
    </>
  )

  return (
    <Layout
      config={config}
      title={`${date} の記事 | ${config.title}`}
      description={`${date} に投稿された記事の一覧`}
      url={url}
      sidebar={sidebar}
    >
      <PostList pages={pages} title={`${date} の記事`} />
    </Layout>
  )
}
