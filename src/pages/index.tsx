import type { BuildContext } from '../types.js'
import { Layout } from '../components/Layout.js'
import { PostList } from '../components/PostList.js'
import { Profile } from '../components/Profile.js'
import { Calendar } from '../components/Calendar.js'
import { TagList } from '../components/TagList.js'

interface IndexPageProps {
  ctx: BuildContext
}

export function IndexPage({ ctx }: IndexPageProps) {
  const { config, pages, tagMap, calendarMap } = ctx
  const calendarEnabled = config.calendar?.enabled ?? false

  const now = new Date()
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const sidebar = (
    <>
      <Profile profile={config.profile} />
      {calendarEnabled && (
        <Calendar calendarMap={calendarMap} currentYearMonth={currentYearMonth} />
      )}
      <TagList tagMap={tagMap} />
    </>
  )

  return (
    <Layout
      config={config}
      title={config.title}
      description={config.description ?? config.title}
      url="/"
      sidebar={sidebar}
    >
      <PostList pages={pages} />
    </Layout>
  )
}
