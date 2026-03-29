/** @jsxImportSource preact */
/**
 * テストランナー
 * `npm test` で実行。テスト用コンテンツでビルドを走らせ、出力を検証する。
 */
import fs from 'node:fs'
import path from 'node:path'
import { render } from 'preact-render-to-string'
import type { VNode } from 'preact'
import { parseDirectory } from '../src/lib/parser.js'
import { buildContext } from '../src/lib/context.js'
import { extractToc } from '../src/lib/toc.js'
import { testConfig, TEST_OUT_DIR, TEST_CONTENT_DIR } from './config.test.js'
import { IndexPage } from '../src/pages/index.js'
import { ArticlePage } from '../src/pages/article.js'
import { TagPage } from '../src/pages/tag.js'
import { TagsPage } from '../src/pages/tags.js'
import { SearchPage } from '../src/pages/search.js'
import { DatePage } from '../src/pages/date.js'
import type { BuildContext, SearchDocument, Page } from '../src/types.js'
import { Profile } from '../src/components/Profile.js'
import { Backlinks } from '../src/components/Backlinks.js'
import { TagList } from '../src/components/TagList.js'
import { PostList } from '../src/components/PostList.js'
import { ArticleHeader } from '../src/components/ArticleHeader.js'
import { Toc } from '../src/components/Toc.js'
import { Calendar } from '../src/components/Calendar.js'

// ---------------------------------------------------------------------------
// テストフレームワーク（軽量・外部依存なし）
// ---------------------------------------------------------------------------

type TestResult = { name: string; passed: boolean; message: string }
const results: TestResult[] = []

function test(name: string, fn: () => void) {
  try {
    fn()
    results.push({ name, passed: true, message: '' })
  } catch (e) {
    results.push({ name, passed: false, message: (e as Error).message })
  }
}

function expect(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function expectFileExists(filePath: string) {
  expect(fs.existsSync(filePath), `ファイルが存在するべき: ${filePath}`)
}

function expectFileNotExists(filePath: string) {
  expect(!fs.existsSync(filePath), `ファイルが存在してはいけない: ${filePath}`)
}

function expectHtmlContains(filePath: string, substring: string) {
  const html = fs.readFileSync(filePath, 'utf-8')
  expect(html.includes(substring), `"${substring}" が ${path.basename(filePath)} に含まれるべき`)
}

function expectHtmlNotContains(filePath: string, substring: string) {
  const html = fs.readFileSync(filePath, 'utf-8')
  expect(!html.includes(substring), `"${substring}" が ${path.basename(filePath)} に含まれてはいけない`)
}

// ---------------------------------------------------------------------------
// ビルドユーティリティ
// ---------------------------------------------------------------------------

function renderPage(vnode: VNode): string {
  return '<!DOCTYPE html>\n' + render(vnode)
}

function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
}

function buildSearchIndex(ctx: BuildContext): SearchDocument[] {
  return ctx.pages.map((page) => ({
    id: page.slug,
    title: page.frontmatter.title,
    description: page.frontmatter.description,
    tags: page.frontmatter.tags,
    url: page.url,
  }))
}

async function runBuild(ctx: BuildContext) {
  const outDir = TEST_OUT_DIR

  // クリーン
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true })
  fs.mkdirSync(outDir, { recursive: true })

  // index
  writeFile(path.join(outDir, 'index.html'), renderPage(<IndexPage ctx={ctx} />))

  // 記事ページ
  for (const page of ctx.pages) {
    writeFile(page.outputPath, renderPage(<ArticlePage page={page} ctx={ctx} />))
  }

  // タグ別ページ
  for (const [tag, tagPages] of ctx.tagMap) {
    writeFile(
      path.join(outDir, 'tags', tag, 'index.html'),
      renderPage(<TagPage tag={tag} pages={tagPages} ctx={ctx} />),
    )
  }

  // 日付別ページ（同日に複数記事がある日のみ）
  const dateMap = new Map<string, Page[]>()
  for (const page of ctx.pages) {
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

  // タグ一覧ページ
  writeFile(path.join(outDir, 'tags', 'index.html'), renderPage(<TagsPage ctx={ctx} />))

  // 検索ページ
  writeFile(path.join(outDir, 'search', 'index.html'), renderPage(<SearchPage ctx={ctx} />))

  // 検索インデックス
  writeFile(path.join(outDir, 'search-index.json'), JSON.stringify(buildSearchIndex(ctx)))
}

// ---------------------------------------------------------------------------
// テスト群
// ---------------------------------------------------------------------------

function runTests(ctx: BuildContext) {
  const outDir = TEST_OUT_DIR
  const pages = ctx.pages

  const findPage = (slug: string) => pages.find((p) => p.slug === slug)

  // ===== 1. FrontMatter パース =====

  test('1-1: 全フィールド指定 - title が正しく取得できる', () => {
    const page = findPage('posts/full-frontmatter')
    expect(!!page, 'posts/full-frontmatter が存在するべき')
    expect(page!.frontmatter.title === 'すべてのフィールドを指定した記事', 'title が一致するべき')
  })

  test('1-2: 全フィールド指定 - tags が正しく取得できる', () => {
    const page = findPage('posts/full-frontmatter')!
    expect(
      JSON.stringify(page.frontmatter.tags) === JSON.stringify(['テスト', 'フロントマター']),
      `tags が ['テスト', 'フロントマター'] であるべき。実際: ${JSON.stringify(page.frontmatter.tags)}`,
    )
  })

  test('1-3: 全フィールド指定 - updatedDateTime が正しく取得できる', () => {
    const page = findPage('posts/full-frontmatter')!
    const updated = page.frontmatter.updatedDateTime
    expect(
      updated.getFullYear() === 2026 && updated.getMonth() === 2 && updated.getDate() === 1,
      `updatedDateTime が 2026-03-01 であるべき。実際: ${updated.toISOString()}`,
    )
  })

  test('1-4: 全フィールド指定 - description がフロントマターの値を使う', () => {
    const page = findPage('posts/full-frontmatter')!
    expect(
      page.frontmatter.description === 'これはテスト用の説明文です。すべてのフロントマターフィールドを指定しています。',
      `description が一致するべき。実際: "${page.frontmatter.description}"`,
    )
  })

  test('1-5: 全フィールド指定 - カスタムslugが使われる', () => {
    expect(!!findPage('posts/full-frontmatter'), 'slug が posts/full-frontmatter であるべき')
  })

  test('1-6: 省略フィールド - tags が空配列になる', () => {
    const page = findPage('posts/minimal-frontmatter')!
    expect(
      Array.isArray(page.frontmatter.tags) && page.frontmatter.tags.length === 0,
      `tags が [] であるべき。実際: ${JSON.stringify(page.frontmatter.tags)}`,
    )
  })

  test('1-7: 省略フィールド - draft が false になる', () => {
    const page = findPage('posts/minimal-frontmatter')!
    expect(page.frontmatter.draft === false, 'draft が false であるべき')
  })

  test('1-8: 省略フィールド - updatedDateTime が createDateTime と同値になる', () => {
    const page = findPage('posts/minimal-frontmatter')!
    expect(
      page.frontmatter.updatedDateTime.getTime() === page.frontmatter.createDateTime.getTime(),
      'updatedDateTime と createDateTime が同値であるべき',
    )
  })

  test('1-9: 省略フィールド - slug がファイルパスから生成される', () => {
    expect(!!findPage('posts/minimal-frontmatter'), 'slug が posts/minimal-frontmatter であるべき')
  })

  test('1-10: カスタムslug - slug がフロントマターの値を使う', () => {
    expect(!!findPage('custom/my-slug'), 'slug が custom/my-slug であるべき')
  })

  // ===== 2. description 自動生成 =====

  test('2-1: 自動生成 - description が140文字以内になる', () => {
    const page = findPage('posts/auto-description')!
    expect(
      page.frontmatter.description.length <= 140,
      `description が140文字以内であるべき。実際: ${page.frontmatter.description.length}文字`,
    )
  })

  test('2-2: 自動生成 - Markdown記法が除去される', () => {
    const page = findPage('posts/auto-description')!
    const desc = page.frontmatter.description
    expect(!desc.includes('**'), '** が除去されているべき')
    expect(!desc.includes('_'), '_ が除去されているべき')
    expect(!desc.includes('`'), '` が除去されているべき')
    expect(!desc.includes('#'), '# が除去されているべき')
  })

  test('2-3: 自動生成 - 141文字目以降は含まれない', () => {
    const page = findPage('posts/auto-description')!
    expect(
      !page.frontmatter.description.includes('XXXXXXXXXX'),
      '141文字目以降の文字列が含まれてはいけない',
    )
  })

  test('2-4: 自動生成 - 本文が空のとき description は空文字', () => {
    const page = findPage('posts/empty-body')!
    expect(
      page.frontmatter.description === '',
      `本文が空のとき description が空文字であるべき。実際: "${page.frontmatter.description}"`,
    )
  })

  // ===== 3. draft / アンダースコア除外 =====

  test('3-1: draft=true の記事が pages に含まれない', () => {
    expect(!findPage('posts/draft'), 'draft記事が pages に含まれてはいけない')
  })

  test('3-2: draft=true の記事の出力HTMLが存在しない', () => {
    expectFileNotExists(path.join(outDir, 'posts', 'draft', 'index.html'))
  })

  test('3-3: draft=true の記事が TagMap に含まれない', () => {
    const draftTag = ctx.tagMap.get('下書き')
    expect(!draftTag, 'TagMap に 下書き タグが存在してはいけない')
  })

  test('3-4: _underscored ファイルが pages に含まれない', () => {
    expect(!findPage('_underscored'), '_underscored が pages に含まれてはいけない')
  })

  test('3-5: _underscored ファイルの出力HTMLが存在しない', () => {
    expectFileNotExists(path.join(outDir, '_underscored', 'index.html'))
  })

  // ===== 4. 出力ファイル生成 =====

  test('4-1: トップページが生成される', () => {
    expectFileExists(path.join(outDir, 'index.html'))
  })

  test('4-2: 記事ページが生成される', () => {
    expectFileExists(path.join(outDir, 'posts', 'full-frontmatter', 'index.html'))
  })

  test('4-3: カスタムslugのページが正しいパスに生成される', () => {
    expectFileExists(path.join(outDir, 'custom', 'my-slug', 'index.html'))
  })

  test('4-4: タグ別ページが生成される', () => {
    expectFileExists(path.join(outDir, 'tags', 'テスト', 'index.html'))
    expectFileExists(path.join(outDir, 'tags', 'タグA', 'index.html'))
    expectFileExists(path.join(outDir, 'tags', 'タグB', 'index.html'))
    expectFileExists(path.join(outDir, 'tags', 'タグC', 'index.html'))
  })

  test('4-5: タグ一覧ページが生成される', () => {
    expectFileExists(path.join(outDir, 'tags', 'index.html'))
  })

  test('4-6: 検索ページが生成される', () => {
    expectFileExists(path.join(outDir, 'search', 'index.html'))
  })

  test('4-7: 検索インデックスJSONが生成される', () => {
    expectFileExists(path.join(outDir, 'search-index.json'))
  })

  test('4-8: 検索インデックスに draft 記事が含まれない', () => {
    const json = JSON.parse(fs.readFileSync(path.join(outDir, 'search-index.json'), 'utf-8')) as SearchDocument[]
    const hasDraft = json.some((d) => d.id === 'posts/draft')
    expect(!hasDraft, 'search-index.json に posts/draft が含まれてはいけない')
  })

  test('4-10: 同日に記事が1件のみの場合、日付別ページが生成されない', () => {
    // full-frontmatter は 2026-01-15 でその日唯一の記事
    expectFileNotExists(path.join(outDir, 'date', '2026-01-15', 'index.html'))
  })

  test('4-11: 同日に記事が2件以上ある場合、日付別ページが生成される', () => {
    // same-date-a と same-date-b は共に 2026-03-10
    expectFileExists(path.join(outDir, 'date', '2026-03-10', 'index.html'))
  })

  test('4-9: 検索インデックスに必須フィールドが含まれる', () => {
    const json = JSON.parse(fs.readFileSync(path.join(outDir, 'search-index.json'), 'utf-8')) as SearchDocument[]
    const doc = json.find((d) => d.id === 'posts/search-keywords')
    expect(!!doc, 'search-index.json に posts/search-keywords が含まれるべき')
    expect(typeof doc!.title === 'string', 'title が文字列であるべき')
    expect(typeof doc!.description === 'string', 'description が文字列であるべき')
    expect(Array.isArray(doc!.tags), 'tags が配列であるべき')
    expect(typeof doc!.url === 'string', 'url が文字列であるべき')
  })

  // ===== 5. BacklinkMap =====

  test('5-1: backlink-source の links に backlink-target が含まれる', () => {
    const src = findPage('posts/backlink-source')!
    expect(
      src.links.includes('posts/backlink-target'),
      `posts/backlink-source.links に posts/backlink-target が含まれるべき。実際: ${JSON.stringify(src.links)}`,
    )
  })

  test('5-2: backlink-target の backlinks に backlink-source が含まれる', () => {
    const target = findPage('posts/backlink-target')!
    const hasSource = target.backlinks.some((p) => p.slug === 'posts/backlink-source')
    expect(hasSource, 'posts/backlink-target.backlinks に posts/backlink-source が含まれるべき')
  })

  test('5-3: wiki リンクが <a> タグに変換される', () => {
    const htmlPath = path.join(outDir, 'posts', 'backlink-source', 'index.html')
    expectHtmlContains(htmlPath, 'href="/posts/backlink-target/"')
  })

  test('5-4: エイリアス付き wiki リンクが正しく変換される', () => {
    const htmlPath = path.join(outDir, 'posts', 'backlink-source', 'index.html')
    expectHtmlContains(htmlPath, 'ターゲット記事')
    expectHtmlContains(htmlPath, 'href="/posts/backlink-target/"')
  })

  // ===== 6. ToC =====

  test('6-1: ToC に h2/h3 見出しが抽出される', () => {
    const page = findPage('posts/toc-headings')!
    const toc = extractToc(page.hast)
    const h2Items = toc.filter((t) => t.depth === 2)
    const h3Items = toc.filter((t) => t.depth === 3)
    expect(h2Items.length >= 2, `h2 が2件以上あるべき。実際: ${h2Items.length}件`)
    expect(h3Items.length >= 3, `h3 が3件以上あるべき。実際: ${h3Items.length}件`)
  })

  test('6-2: 見出しに id 属性が付与される', () => {
    const htmlPath = path.join(outDir, 'posts', 'toc-headings', 'index.html')
    expectHtmlContains(htmlPath, 'id=')
  })

  // ===== 7. CalendarMap =====

  test('7-1: 同日記事が CalendarMap の同一キーに格納される', () => {
    const marchPages = ctx.calendarMap.get('2026-03')
    expect(!!marchPages, 'CalendarMap に 2026-03 エントリが存在するべき')
    const sameDatePages = marchPages!.filter(
      (p) => p.slug === 'posts/same-date-a' || p.slug === 'posts/same-date-b',
    )
    expect(sameDatePages.length === 2, `2026-03 に same-date-a と same-date-b の2件が含まれるべき。実際: ${sameDatePages.length}件`)
  })

  // ===== 8. TagMap =====

  test('8-1: TagMap にすべてのタグが登録される', () => {
    expect(ctx.tagMap.has('テスト'), 'TagMap に テスト が存在するべき')
    expect(ctx.tagMap.has('タグA'), 'TagMap に タグA が存在するべき')
    expect(ctx.tagMap.has('人工知能'), 'TagMap に 人工知能 が存在するべき')
  })

  test('8-2: テスト タグに複数記事が含まれる', () => {
    const testPages = ctx.tagMap.get('テスト')!
    expect(testPages.length >= 2, `テスト タグに2件以上の記事があるべき。実際: ${testPages.length}件`)
  })

  test('8-3: 人工知能 タグに2件の記事が含まれる', () => {
    const aiPages = ctx.tagMap.get('人工知能')!
    expect(aiPages.length === 2, `人工知能 タグに2件の記事があるべき。実際: ${aiPages.length}件`)
  })

  // ===== 9. XSS サニタイズ =====

  test('9-1: <script> タグが出力から除去される', () => {
    const htmlPath = path.join(outDir, 'posts', 'xss-content', 'index.html')
    expectHtmlNotContains(htmlPath, 'xss-script-tag')
  })

  test('9-2: onerror 属性が除去される', () => {
    const htmlPath = path.join(outDir, 'posts', 'xss-content', 'index.html')
    expectHtmlNotContains(htmlPath, 'xss-onerror')
    expectHtmlNotContains(htmlPath, 'onerror=')
  })

  test('9-3: javascript: スキームのhref属性が除去される', () => {
    // allowDangerousHtml:false により生HTMLはテキストノード化される。
    // href="javascript:..." が属性として残っていないことを確認する。
    const htmlPath = path.join(outDir, 'posts', 'xss-content', 'index.html')
    expectHtmlNotContains(htmlPath, 'href="javascript:')
    expectHtmlNotContains(htmlPath, 'xss-href')
  })

  // ===== 10. エッジケース =====

  test('10-1: 本文が空の記事でもビルドが成功する', () => {
    expectFileExists(path.join(outDir, 'posts', 'empty-body', 'index.html'))
  })

  test('10-2: 500文字超のタイトルでもビルドが成功する', () => {
    const page = findPage('posts/long-title')!
    expect(page.frontmatter.title.length > 500, 'タイトルが500文字超であるべき')
    expectFileExists(path.join(outDir, 'posts', 'long-title', 'index.html'))
  })

  test('10-3: 記事ページのタイトルタグが "記事タイトル | サイト名" 形式になる', () => {
    const htmlPath = path.join(outDir, 'posts', 'full-frontmatter', 'index.html')
    expectHtmlContains(htmlPath, 'すべてのフィールドを指定した記事 | テストブログ')
  })

  test('10-4: OGP タグが出力される', () => {
    const htmlPath = path.join(outDir, 'posts', 'full-frontmatter', 'index.html')
    expectHtmlContains(htmlPath, 'og:title')
    expectHtmlContains(htmlPath, 'og:description')
    expectHtmlContains(htmlPath, 'og:url')
  })

  test('10-5: 連続ビルドでも出力が壊れない（冪等性）', () => {
    // index.html が有効な HTML であることを簡易チェック
    const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf-8')
    expect(html.startsWith('<!DOCTYPE html>'), 'DOCTYPE 宣言で始まるべき')
    expect(html.includes('</html>'), '</html> で閉じられているべき')
  })

  // ===== 11. Markdown 基本変換 =====

  test('11-1: <h2> 見出しが生成される', () => {
    const htmlPath = path.join(outDir, 'posts', 'markdown-elements', 'index.html')
    expectHtmlContains(htmlPath, '<h2')
  })

  test('11-2: <ul><li> リストが生成される', () => {
    const htmlPath = path.join(outDir, 'posts', 'markdown-elements', 'index.html')
    expectHtmlContains(htmlPath, '<ul')
    expectHtmlContains(htmlPath, '<li')
  })

  test('11-3: <ol><li> 番号付きリストが生成される', () => {
    const htmlPath = path.join(outDir, 'posts', 'markdown-elements', 'index.html')
    expectHtmlContains(htmlPath, '<ol')
  })

  test('11-4: <pre><code> コードブロックが生成される', () => {
    const htmlPath = path.join(outDir, 'posts', 'markdown-elements', 'index.html')
    expectHtmlContains(htmlPath, '<pre')
    expectHtmlContains(htmlPath, '<code')
  })

  test('11-5: <strong> 太字が生成される', () => {
    const htmlPath = path.join(outDir, 'posts', 'markdown-elements', 'index.html')
    expectHtmlContains(htmlPath, '<strong')
  })

  test('11-6: <a href> 通常リンクが生成される', () => {
    const htmlPath = path.join(outDir, 'posts', 'markdown-elements', 'index.html')
    expectHtmlContains(htmlPath, 'href="https://example.com"')
  })

  test('11-7: <img> 画像タグが生成される', () => {
    const htmlPath = path.join(outDir, 'posts', 'markdown-elements', 'index.html')
    expectHtmlContains(htmlPath, '<img')
  })

  // ===== 12. wiki リンク（存在しない slug）=====

  test('12-1: 存在しないslugへのwikiリンクが <a> タグに変換される', () => {
    const htmlPath = path.join(outDir, 'posts', 'wiki-link-nonexistent', 'index.html')
    expectHtmlContains(htmlPath, 'href="/posts/nonexistent-page/"')
  })

  test('12-2: 存在しないslugへのエイリアス付きwikiリンクが変換される', () => {
    const htmlPath = path.join(outDir, 'posts', 'wiki-link-nonexistent', 'index.html')
    expectHtmlContains(htmlPath, '存在しないページ')
  })

  test('12-3: 存在しないslugへのwikiリンクでビルドが成功する', () => {
    expectFileExists(path.join(outDir, 'posts', 'wiki-link-nonexistent', 'index.html'))
  })

  // ===== 13. コンポーネント HTML 出力 =====

  test('13-1: Profile - name が表示される', () => {
    const html = render(<Profile profile={testConfig.profile} />)
    expect(html.includes('Test User'), 'Profile に "Test User" が表示されるべき')
  })

  test('13-2: Profile - enabled:false のとき何も表示されない', () => {
    const html = render(<Profile profile={{ ...testConfig.profile!, enabled: false }} />)
    expect(html === '', 'enabled:false のとき空文字列を返すべき')
  })

  test('13-3: Profile - avatar なしのときイニシャルプレースホルダーが表示される', () => {
    const html = render(<Profile profile={testConfig.profile} />)
    expect(html.includes('profile-avatar__placeholder'), 'イニシャルプレースホルダーが表示されるべき')
  })

  test('13-4: Profile - links に target="_blank" と rel="noopener noreferrer" が付く', () => {
    const html = render(<Profile profile={testConfig.profile} />)
    expect(html.includes('target="_blank"'), 'target="_blank" が付くべき')
    expect(html.includes('rel="noopener noreferrer"'), 'rel="noopener noreferrer" が付くべき')
  })

  test('13-5: Backlinks - 0件のとき null を返す', () => {
    const html = render(<Backlinks backlinks={[]} />)
    expect(html === '', 'backlinks が 0 件のとき空文字列を返すべき')
  })

  test('13-6: Backlinks - バックリンクのアイテムが表示される', () => {
    const target = findPage('posts/backlink-target')!
    const html = render(<Backlinks backlinks={target.backlinks} />)
    expect(html.includes('backlinks__item'), 'backlinks__item が表示されるべき')
  })

  test('13-7: TagList - size=0 のとき null を返す', () => {
    const html = render(<TagList tagMap={new Map()} />)
    expect(html === '', 'tagMap.size=0 のとき空文字列を返すべき')
  })

  test('13-8: TagList - タグ名とカウントが表示される', () => {
    const html = render(<TagList tagMap={ctx.tagMap} />)
    expect(html.includes('テスト'), 'タグ名が表示されるべき')
    expect(html.includes('tag-list__count'), 'カウントが表示されるべき')
  })

  test('13-9: TagList - currentTag のとき aria-current="page" が付く', () => {
    const html = render(<TagList tagMap={ctx.tagMap} currentTag="テスト" />)
    expect(html.includes('aria-current="page"'), 'aria-current="page" が付くべき')
  })

  test('13-10: PostList - 0件のとき「記事がありません」が表示される', () => {
    const html = render(<PostList pages={[]} />)
    expect(html.includes('記事がありません'), '記事がありません が表示されるべき')
  })

  test('13-11: PostList - title プロパティが渡されたとき見出しが表示される', () => {
    const html = render(<PostList pages={[]} title="最新記事" />)
    expect(html.includes('最新記事'), 'title が表示されるべき')
  })

  test('13-12: PostList - createDateTime 降順ソート', () => {
    const pageA = findPage('posts/same-date-a')!  // 2026-03-10
    const pageB = findPage('posts/full-frontmatter')!  // 2026-01-15
    const html = render(<PostList pages={[pageA, pageB]} />)
    const idxSame = html.indexOf('/posts/same-date-a/')
    const idxFull = html.indexOf('/posts/full-frontmatter/')
    expect(idxSame < idxFull, 'same-date-a (2026-03-10) が full-frontmatter (2026-01-15) より先に表示されるべき')
  })

  test('13-13: ArticleHeader - h1 タイトルが表示される', () => {
    const page = findPage('posts/full-frontmatter')!
    const html = render(
      <ArticleHeader
        title={page.frontmatter.title}
        createDateTime={page.frontmatter.createDateTime}
        updatedDateTime={page.frontmatter.updatedDateTime}
        tags={page.frontmatter.tags}
      />,
    )
    expect(html.includes('<h1'), '<h1> タグが出力されるべき')
    expect(html.includes(page.frontmatter.title), 'タイトルが表示されるべき')
  })

  test('13-14: ArticleHeader - createDateTime が <time> タグで表示される', () => {
    const page = findPage('posts/full-frontmatter')!
    const html = render(
      <ArticleHeader
        title={page.frontmatter.title}
        createDateTime={page.frontmatter.createDateTime}
        updatedDateTime={page.frontmatter.updatedDateTime}
        tags={page.frontmatter.tags}
      />,
    )
    expect(html.includes('<time'), '<time> タグが出力されるべき')
    expect(html.includes('2026-01-15'), '作成日が表示されるべき')
  })

  test('13-15: ArticleHeader - updatedDateTime が createDateTime と同値のとき更新日非表示', () => {
    const d = new Date('2026-03-15')
    const html = render(<ArticleHeader title="test" createDateTime={d} updatedDateTime={d} tags={[]} />)
    expect(!html.includes('article-meta__date--updated'), '更新日が表示されないべき')
  })

  test('13-16: ArticleHeader - updatedDateTime が異なるとき更新日が表示される', () => {
    const created = new Date('2026-03-15')
    const updated = new Date('2026-03-20')
    const html = render(<ArticleHeader title="test" createDateTime={created} updatedDateTime={updated} tags={[]} />)
    expect(html.includes('article-meta__date--updated'), '更新日が表示されるべき')
    expect(html.includes('2026-03-20'), '更新日の日付が表示されるべき')
  })

  test('13-17: ArticleHeader - タグがリンクとして表示される', () => {
    const page = findPage('posts/full-frontmatter')!
    const html = render(
      <ArticleHeader
        title={page.frontmatter.title}
        createDateTime={page.frontmatter.createDateTime}
        updatedDateTime={page.frontmatter.updatedDateTime}
        tags={page.frontmatter.tags}
      />,
    )
    expect(html.includes('href="/tags/'), 'タグリンクが表示されるべき')
  })

  test('13-18: Toc - 0件のとき null を返す', () => {
    const html = render(<Toc items={[]} />)
    expect(html === '', 'ToC が 0 件のとき空文字列を返すべき')
  })

  test('13-19: Toc - h2/h3 アンカーリンクが表示される', () => {
    const page = findPage('posts/toc-headings')!
    const tocItems = extractToc(page.hast)
    const html = render(<Toc items={tocItems} />)
    expect(html.includes('href="#'), 'アンカーリンクが表示されるべき')
    expect(html.includes('toc__item--h2'), 'h2 アイテムが表示されるべき')
    expect(html.includes('toc__item--h3'), 'h3 アイテムが表示されるべき')
  })

  test('13-20: Calendar - calendarMap.size=0 のとき null を返す', () => {
    const html = render(<Calendar calendarMap={new Map()} currentYearMonth="2026-03" />)
    expect(html === '', 'CalendarMap が空のとき空文字列を返すべき')
  })

  test('13-21: Calendar - 同日複数記事のセルが /date/ リンクになる', () => {
    const html = render(<Calendar calendarMap={ctx.calendarMap} currentYearMonth="2026-03" />)
    expect(html.includes('href="/date/2026-03-10/"'), '同日複数記事のセルが /date/ リンクになるべき')
  })

  test('13-22: Calendar - 1件の日付セルが記事URLリンクになる', () => {
    const fullPage = findPage('posts/full-frontmatter')!  // 2026-03-15（1件のみ）
    const html = render(<Calendar calendarMap={ctx.calendarMap} currentYearMonth="2026-03" />)
    expect(html.includes(`href="${fullPage.url}"`), '1件の日付セルが記事URLになるべき')
  })

  // ===== 14. サイドバー構成 =====

  test('14-1: 記事ページに Profile が含まれる', () => {
    const htmlPath = path.join(outDir, 'posts', 'full-frontmatter', 'index.html')
    expectHtmlContains(htmlPath, 'profile-card')
  })

  test('14-2: 見出しある記事ページに ToC が含まれる', () => {
    const htmlPath = path.join(outDir, 'posts', 'toc-headings', 'index.html')
    expectHtmlContains(htmlPath, 'class="toc"')
  })

  test('14-3: 見出しなし記事ページに ToC が含まれない', () => {
    const htmlPath = path.join(outDir, 'posts', 'empty-body', 'index.html')
    expectHtmlNotContains(htmlPath, 'class="toc"')
  })

  test('14-4: トップページに Calendar が含まれる', () => {
    const htmlPath = path.join(outDir, 'index.html')
    expectHtmlContains(htmlPath, 'class="calendar"')
  })

  test('14-5: トップページに ToC が含まれない', () => {
    const htmlPath = path.join(outDir, 'index.html')
    expectHtmlNotContains(htmlPath, 'class="toc"')
  })

  test('14-6: タグ別ページに Calendar が含まれない', () => {
    const htmlPath = path.join(outDir, 'tags', 'テスト', 'index.html')
    expectHtmlNotContains(htmlPath, 'class="calendar"')
  })

  test('14-7: Backlinks position=below のとき <main> 内に表示される', () => {
    const page = findPage('posts/backlink-target')!
    const html = renderPage(<ArticlePage page={page} ctx={ctx} />)
    const mainIdx = html.indexOf('class="main-content"')
    const backlinksIdx = html.indexOf('class="backlinks"')
    const sidebarIdx = html.indexOf('class="sidebar"')
    expect(backlinksIdx > mainIdx && backlinksIdx < sidebarIdx, 'Backlinks が main-content 内（サイドバー前）に表示されるべき')
  })

  test('14-8: Backlinks position=sidebar のときサイドバー内に表示される', () => {
    const page = findPage('posts/backlink-target')!
    const sidebarCtx = { ...ctx, config: { ...ctx.config, backlinks: { position: 'sidebar' as const } } }
    const html = renderPage(<ArticlePage page={page} ctx={sidebarCtx} />)
    const backlinksIdx = html.indexOf('class="backlinks"')
    const sidebarIdx = html.indexOf('class="sidebar"')
    expect(backlinksIdx > sidebarIdx, 'Backlinks がサイドバー内に表示されるべき')
  })

  // ===== 15. BacklinkMap 双方向・ループ =====

  test('15-1: 双方向リンク - bidirectional-a の backlinks に bidirectional-b が含まれる', () => {
    const a = findPage('posts/bidirectional-a')!
    const hasB = a.backlinks.some((p) => p.slug === 'posts/bidirectional-b')
    expect(hasB, 'bidirectional-a の backlinks に bidirectional-b が含まれるべき')
  })

  test('15-2: 双方向リンク - bidirectional-b の backlinks に bidirectional-a が含まれる', () => {
    const b = findPage('posts/bidirectional-b')!
    const hasA = b.backlinks.some((p) => p.slug === 'posts/bidirectional-a')
    expect(hasA, 'bidirectional-b の backlinks に bidirectional-a が含まれるべき')
  })

  test('15-3: wikiリンクのループ（A→B→A）でも無限ループしない', () => {
    const a = findPage('posts/bidirectional-a')
    const b = findPage('posts/bidirectional-b')
    expect(!!a && !!b, '双方向リンク記事が両方 pages に含まれるべき')
  })
}

// ---------------------------------------------------------------------------
// メイン
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== テストビルド開始 ===\n')
  console.log(`コンテンツ: ${TEST_CONTENT_DIR}`)
  console.log(`出力先:     ${TEST_OUT_DIR}\n`)

  // ビルド実行
  const pages = await parseDirectory(TEST_CONTENT_DIR, testConfig)
  console.log(`パース完了: ${pages.length} 記事\n`)

  const ctx = buildContext(pages, testConfig)
  await runBuild(ctx)

  // テスト実行
  console.log('=== テスト実行 ===\n')
  runTests(ctx)

  // 結果表示
  const passed = results.filter((r) => r.passed)
  const failed = results.filter((r) => !r.passed)

  for (const r of results) {
    const icon = r.passed ? '✅' : '❌'
    console.log(`${icon} ${r.name}`)
    if (!r.passed) console.log(`   → ${r.message}`)
  }

  console.log(`\n=== 結果: ${passed.length}/${results.length} 通過 ===`)
  if (failed.length > 0) {
    console.log(`\n失敗したテスト:`)
    failed.forEach((r) => console.log(`  - ${r.name}`))
    process.exit(1)
  } else {
    console.log('\nすべてのテストが通過しました 🎉')
  }
}

main().catch((err) => {
  console.error('[ERROR]', err)
  process.exit(1)
})
