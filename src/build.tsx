import fs from 'node:fs'
import path from 'node:path'
import { render } from 'preact-render-to-string'
import type { VNode } from 'preact'
import { config } from '../config.js'
import { parseDirectory } from './lib/parser.js'
import { buildContext } from './lib/context.js'
import type { BuildContext, SearchDocument } from './types.js'
import { IndexPage } from './pages/index.js'
import { ArticlePage } from './pages/article.js'
import { TagPage } from './pages/tag.js'
import { TagsPage } from './pages/tags.js'
import { SearchPage } from './pages/search.js'
import { DatePage } from './pages/date.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage(vnode: VNode): string {
  return '<!DOCTYPE html>\n' + render(vnode)
}

function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
}

function copyAssets(outDir: string) {
  const src = path.resolve('assets')
  const dest = path.join(outDir, 'assets')
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const file of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file))
  }
}

// ---------------------------------------------------------------------------
// Build search index
// ---------------------------------------------------------------------------

function buildSearchIndex(ctx: BuildContext): SearchDocument[] {
  return ctx.pages.map((page) => ({
    id: page.slug,
    title: page.frontmatter.title,
    description: page.frontmatter.description,
    tags: page.frontmatter.tags,
    url: page.url,
  }))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const outDir = config.build?.outDir ?? 'out'
  const contentDir = path.resolve('content')

  console.log('[build] parsing content...')
  const pages = await parseDirectory(contentDir, config)
  console.log(`[build] ${pages.length} pages found`)

  const ctx = buildContext(pages, config)

  // Clean output dir
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true })
  }
  fs.mkdirSync(outDir, { recursive: true })

  // Copy assets
  copyAssets(outDir)

  // --- index page ---
  console.log('[build] generating index...')
  writeFile(
    path.join(outDir, 'index.html'),
    renderPage(<IndexPage ctx={ctx} />),
  )

  // --- article pages ---
  console.log('[build] generating articles...')
  for (const page of pages) {
    writeFile(page.outputPath, renderPage(<ArticlePage page={page} ctx={ctx} />))
  }

  // --- tag pages ---
  // ファイルパスには生のタグ名を使用（サーバーが URL デコードしてファイルを探すため）
  console.log('[build] generating tag pages...')
  for (const [tag, tagPages] of ctx.tagMap) {
    writeFile(
      path.join(outDir, 'tags', tag, 'index.html'),
      renderPage(<TagPage tag={tag} pages={tagPages} ctx={ctx} />),
    )
  }

  // --- date pages（同日に複数記事がある日のみ生成）---
  console.log('[build] generating date pages...')
  const dateMap = new Map<string, import('./types.js').Page[]>()
  for (const page of pages) {
    const d = page.frontmatter.createDateTime
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!dateMap.has(key)) dateMap.set(key, [])
    dateMap.get(key)!.push(page)
  }
  for (const [date, datePages] of dateMap) {
    if (datePages.length < 2) continue
    writeFile(
      path.join(outDir, 'date', date, 'index.html'),
      renderPage(<DatePage date={date} pages={datePages} ctx={ctx} />),
    )
  }

  // --- tags index ---
  writeFile(
    path.join(outDir, 'tags', 'index.html'),
    renderPage(<TagsPage ctx={ctx} />),
  )

  // --- search page ---
  console.log('[build] generating search page...')
  writeFile(
    path.join(outDir, 'search', 'index.html'),
    renderPage(<SearchPage ctx={ctx} />),
  )

  // --- search index JSON ---
  const searchIndex = buildSearchIndex(ctx)
  writeFile(
    path.join(outDir, 'search-index.json'),
    JSON.stringify(searchIndex),
  )

  console.log(`[build] done → ${outDir}/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
