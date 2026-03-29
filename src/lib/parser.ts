import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'
import type { FrontMatter, ResolvedFrontMatter, Page, SiteConfig } from '../types.js'
import { remarkWikiLink } from './remark-wiki-link.js'

// ---------------------------------------------------------------------------
// unified processor
// ---------------------------------------------------------------------------

const processor = unified()
  .use(remarkParse)
  .use(remarkWikiLink)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSlug)
  .use(rehypeSanitize, {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      '*': [...(defaultSchema.attributes?.['*'] ?? []), 'id', 'className'],
    },
  })

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extractSlugFromPath(relativePath: string): string {
  return relativePath.replace(/\.md$/, '')
}

function buildUrl(slug: string): string {
  return `/${slug}/`
}

function buildOutputPath(slug: string, outDir: string): string {
  return path.join(outDir, slug, 'index.html')
}

/** rawContent の冒頭 140 文字を plain text として取り出す */
function extractDescription(rawContent: string): string {
  return rawContent
    .replace(/^#+\s+.+$/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[*_`~>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140)
}

/** [[slug]] または [[slug|alias]] 形式のリンクを抽出する */
function extractWikiLinks(content: string): string[] {
  const results: string[] = []
  const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    results.push(m[1].trim())
  }
  return [...new Set(results)]
}

// ---------------------------------------------------------------------------
// FrontMatter validation / resolution
// ---------------------------------------------------------------------------

function resolveFrontMatter(raw: Record<string, unknown>, filePath: string): ResolvedFrontMatter {
  const title = typeof raw['title'] === 'string' ? raw['title'] : ''
  if (!title) {
    console.warn(`[warn] missing title in ${filePath}`)
  }

  const createDateTime =
    raw['createDateTime'] instanceof Date
      ? raw['createDateTime']
      : typeof raw['createDateTime'] === 'string'
        ? new Date(raw['createDateTime'])
        : (() => {
            console.warn(`[warn] invalid createDateTime in ${filePath}`)
            return new Date()
          })()

  if (isNaN(createDateTime.getTime())) {
    console.warn(`[warn] invalid createDateTime in ${filePath}`)
  }

  const updatedDateTime =
    raw['updatedDateTime'] instanceof Date
      ? raw['updatedDateTime']
      : typeof raw['updatedDateTime'] === 'string'
        ? new Date(raw['updatedDateTime'])
        : createDateTime

  const tags = Array.isArray(raw['tags'])
    ? (raw['tags'] as unknown[]).filter((t): t is string => typeof t === 'string')
    : []

  const draft = typeof raw['draft'] === 'boolean' ? raw['draft'] : false
  const description = typeof raw['description'] === 'string' ? raw['description'] : ''
  const slug = typeof raw['slug'] === 'string' ? raw['slug'] : ''

  return { title, tags, createDateTime, updatedDateTime, draft, description, slug }
}

// ---------------------------------------------------------------------------
// parse single file
// ---------------------------------------------------------------------------

export async function parseFile(
  filePath: string,
  contentDir: string,
  config: SiteConfig,
): Promise<Page | null> {
  const outDir = config.build?.outDir ?? 'out'
  const excludeDrafts = config.build?.excludeDrafts !== false
  const excludeUnderscored = config.build?.excludeUnderscored !== false

  const fileName = path.basename(filePath)
  if (excludeUnderscored && fileName.startsWith('_')) return null

  const source = fs.readFileSync(filePath, 'utf-8')
  const { data, content: rawContent } = matter(source)

  const resolved = resolveFrontMatter(data, filePath)

  if (excludeDrafts && resolved.draft) return null

  const relativePath = path.relative(contentDir, filePath).replace(/\\/g, '/')

  // slug: フロントマター指定 > ファイルパスから生成
  const slug = resolved.slug || extractSlugFromPath(relativePath)
  resolved.slug = slug

  // description: フロントマター指定 > 本文冒頭140文字
  if (!resolved.description) {
    resolved.description = extractDescription(rawContent)
  }

  const url = buildUrl(slug)
  const outputPath = buildOutputPath(slug, outDir)

  // Markdown → hast
  const hast = (await processor.run(processor.parse(rawContent))) as Root

  const links = extractWikiLinks(rawContent)

  return {
    frontmatter: resolved,
    hast,
    rawContent,
    filePath,
    relativePath,
    slug,
    url,
    outputPath,
    links,
    backlinks: [],
  }
}

// ---------------------------------------------------------------------------
// parse directory recursively
// ---------------------------------------------------------------------------

export async function parseDirectory(
  contentDir: string,
  config: SiteConfig,
): Promise<Page[]> {
  const pages: Page[] = []

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name))
      } else if (entry.name.endsWith('.md')) {
        pendingFiles.push(path.join(dir, entry.name))
      }
    }
  }

  const pendingFiles: string[] = []
  walk(contentDir)

  for (const file of pendingFiles) {
    const page = await parseFile(file, contentDir, config)
    if (page) pages.push(page)
  }

  return pages
}
