import MiniSearch from 'minisearch'

interface SearchDocument {
  id: string
  title: string
  description: string
  tags: string[]
  url: string
}

interface SearchResult extends SearchDocument {
  score: number
}

let miniSearch: MiniSearch<SearchDocument> | null = null

/**
 * 日本語（CJK）を含むテキストをバイグラムに分割するトークナイザー。
 * - ASCII は空白・記号で区切った単語として扱う
 * - CJK 文字は 2 文字ずつのバイグラムと 1 文字単体の両方を生成する
 *   例: "ブログ記事" → ["ブロ", "ログ", "グ記", "記事", "ブ", "ロ", "グ", "記", "事"]
 */
function tokenize(text: string): string[] {
  const tokens: string[] = []
  // タグ配列が文字列として渡される場合の対応
  const str = Array.isArray(text) ? (text as string[]).join(' ') : String(text)

  // ASCII 部分と CJK 部分をまとめて処理
  const segments = str.split(/(\s+|[,、。．・\-_/\\[\]()（）【】「」『』])/).filter(Boolean)

  for (const seg of segments) {
    if (!seg.trim()) continue

    // CJK 文字（ひらがな・カタカナ・漢字・全角英数）が含まれるセグメント
    if (/[\u3000-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/.test(seg)) {
      for (let i = 0; i < seg.length; i++) {
        tokens.push(seg[i])                         // ユニグラム
        if (i + 1 < seg.length) tokens.push(seg.slice(i, i + 2))  // バイグラム
      }
    } else {
      // ASCII: 小文字化してそのまま
      const w = seg.toLowerCase()
      if (w) tokens.push(w)
    }
  }

  return tokens
}

async function loadIndex(): Promise<MiniSearch<SearchDocument>> {
  if (miniSearch) return miniSearch

  const res = await fetch('/search-index.json')
  const docs: SearchDocument[] = await res.json()

  miniSearch = new MiniSearch<SearchDocument>({
    fields: ['title', 'description', 'tags'],
    storeFields: ['title', 'description', 'tags', 'url'],
    tokenize,
    searchOptions: {
      tokenize,
      boost: { title: 3 },
    },
  })
  miniSearch.addAll(docs)
  return miniSearch
}

function renderResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return '<p class="search-results__empty">該当する記事がありませんでした。</p>'
  }
  return `<ul class="search-results__list">${results
    .map(
      (r) => `
    <li class="search-result-card">
      <a href="${escHtml(r.url)}" class="search-result-card__link">
        <span class="search-result-card__title">${escHtml(r.title)}</span>
      </a>
      ${r.description ? `<p class="search-result-card__desc">${escHtml(r.description)}</p>` : ''}
      ${
        r.tags.length > 0
          ? `<ul class="search-result-card__tags">${r.tags
              .map(
                (t) =>
                  `<li><a href="/tags/${encodeURIComponent(t)}/" class="tag-badge tag-badge--sm">${escHtml(t)}</a></li>`,
              )
              .join('')}</ul>`
          : ''
      }
    </li>`,
    )
    .join('')}</ul>`
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function onInput(query: string, resultsEl: HTMLElement) {
  if (!query.trim()) {
    resultsEl.innerHTML = ''
    return
  }
  const ms = await loadIndex()
  const results = ms.search(query) as SearchResult[]
  resultsEl.innerHTML = renderResults(results)
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input') as HTMLInputElement | null
  const resultsEl = document.getElementById('search-results') as HTMLElement | null
  if (!input || !resultsEl) return

  let debounceTimer: ReturnType<typeof setTimeout>
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      onInput(input.value, resultsEl)
    }, 200)
  })

  // ページロード時に URL クエリから検索ワードを復元
  const params = new URLSearchParams(location.search)
  const q = params.get('q')
  if (q) {
    input.value = q
    onInput(q, resultsEl)
  }
})
