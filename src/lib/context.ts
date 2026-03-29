import type {
  Page,
  SiteConfig,
  BuildContext,
  TagMap,
  BacklinkMap,
  CalendarMap,
} from '../types.js'

function buildTagMap(pages: Page[]): TagMap {
  const map: TagMap = new Map()
  for (const page of pages) {
    for (const tag of page.frontmatter.tags) {
      if (!map.has(tag)) map.set(tag, [])
      map.get(tag)!.push(page)
    }
  }
  return map
}

function buildBacklinkMap(pages: Page[]): BacklinkMap {
  const map: BacklinkMap = new Map()
  // slug → Page の逆引きテーブル
  const slugIndex = new Map<string, Page>()
  for (const page of pages) {
    slugIndex.set(page.slug, page)
  }

  for (const page of pages) {
    for (const linkedSlug of page.links) {
      if (!map.has(linkedSlug)) map.set(linkedSlug, [])
      map.get(linkedSlug)!.push(page)
    }
  }
  return map
}

function buildCalendarMap(pages: Page[], dateField: keyof import('../types.js').FrontMatter = 'createDateTime'): CalendarMap {
  const map: CalendarMap = new Map()
  for (const page of pages) {
    const date = page.frontmatter[dateField as keyof typeof page.frontmatter]
    if (!(date instanceof Date)) continue
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(page)
  }
  return map
}

export function buildContext(pages: Page[], config: SiteConfig): BuildContext {
  const tagMap = buildTagMap(pages)
  const backlinkMap = buildBacklinkMap(pages)

  // backlinks を各 Page に注入
  for (const page of pages) {
    page.backlinks = backlinkMap.get(page.slug) ?? []
  }

  const calendarEnabled = config.calendar?.enabled ?? false
  const dateField = config.calendar?.dateField ?? 'createDateTime'
  const calendarMap = calendarEnabled
    ? buildCalendarMap(pages, dateField)
    : new Map()

  return { config, pages, tagMap, backlinkMap, calendarMap }
}
