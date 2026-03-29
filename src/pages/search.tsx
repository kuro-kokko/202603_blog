import type { BuildContext } from '../types.js'
import { Layout } from '../components/Layout.js'
import { Search } from '../components/Search.js'
import { Profile } from '../components/Profile.js'

interface SearchPageProps {
  ctx: BuildContext
}

export function SearchPage({ ctx }: SearchPageProps) {
  const { config } = ctx

  const sidebar = (
    <>
      <Profile profile={config.profile} />
    </>
  )

  return (
    <Layout
      config={config}
      title={`検索 | ${config.title}`}
      description="記事を検索します"
      url="/search/"
      sidebar={sidebar}
    >
      <Search />
    </Layout>
  )
}
