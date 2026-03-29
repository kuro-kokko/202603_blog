import type { Root } from 'hast'

// ---------------------------------------------------------------------------
// FrontMatter
// ---------------------------------------------------------------------------

/**
 * .md ファイルの YAML フロントマターをパースした生データ。
 * gray-matter の result.data に対応する。
 */
export interface FrontMatter {
  title: string
  tags?: string[]
  createDateTime: Date
  updatedDateTime?: Date
  draft?: boolean
  description?: string
  slug?: string
}

/**
 * 省略フィールドをすべて確定値に補完したフロントマター。
 */
export interface ResolvedFrontMatter extends Required<FrontMatter> {}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * 1記事分の完成データ。
 */
export interface Page {
  frontmatter: ResolvedFrontMatter
  hast: Root
  rawContent: string

  filePath: string
  relativePath: string
  slug: string
  url: string
  outputPath: string

  links: string[]
  backlinks: Page[]
}

// ---------------------------------------------------------------------------
// BuildContext
// ---------------------------------------------------------------------------

/** slug → そのタグを持つ Page[] */
export type TagMap = Map<string, Page[]>

/** ページの slug → そのページを参照している Page[] */
export type BacklinkMap = Map<string, Page[]>

/** "YYYY-MM" → その月の Page[] */
export type CalendarMap = Map<string, Page[]>

/**
 * ビルド中の共有状態。シングルトンとして build.ts 内で生成される。
 */
export interface BuildContext {
  config: SiteConfig
  pages: Page[]
  tagMap: TagMap
  backlinkMap: BacklinkMap
  calendarMap: CalendarMap
}

// ---------------------------------------------------------------------------
// SearchIndex
// ---------------------------------------------------------------------------

/**
 * MiniSearch に渡す 1 ドキュメントの型。
 */
export interface SearchDocument {
  id: string
  title: string
  description: string
  tags: string[]
  url: string
}

// ---------------------------------------------------------------------------
// SiteConfig
// ---------------------------------------------------------------------------

export interface ProfileLink {
  label: string
  url: string
  icon?: string
}

export interface SiteConfig {
  title: string
  baseUrl: string
  description?: string
  language?: string

  profile?: {
    enabled: boolean
    name: string
    bio?: string
    avatar?: string
    links?: ProfileLink[]
  }

  calendar?: {
    enabled: boolean
    dateField?: keyof FrontMatter
  }

  build?: {
    outDir?: string
    excludeDrafts?: boolean
    excludeUnderscored?: boolean
  }

  backlinks?: {
    position?: 'below' | 'sidebar'
  }
}

// ---------------------------------------------------------------------------
// ToC
// ---------------------------------------------------------------------------

export interface TocItem {
  id: string
  text: string
  depth: number
}
