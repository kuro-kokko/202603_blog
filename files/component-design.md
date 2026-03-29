# コンポーネント設計書

> ステータス: 草案

---

## 1. ページレイアウト構造

全ページ共通の 2カラム構成。

```
┌─────────────────────────────────────────┐
│                 Header                  │
├────────────────────────┬────────────────┤
│                        │   Profile      │
│    メインコンテンツ      │   ToC          │ ← 記事ページのみ
│                        │   Calendar     │ ← index/tagページ・enabled時のみ
│                        │   Tags         │ ← index/tagページのみ
│                        │   Backlinks    │ ← 記事ページ・sidebar配置時のみ
├────────────────────────┴────────────────┤
│                 Footer                  │
└─────────────────────────────────────────┘
```

### サイドバー構成のページ別まとめ

| コンポーネント | 記事ページ | トップページ | タグページ |
|--------------|-----------|------------|---------|
| Profile | ✅ 常時 | ✅ 常時 | ✅ 常時 |
| ToC | ✅ | — | — |
| Backlinks | ✅ ※1 | — | — |
| Calendar | — | ✅ enabled時のみ | — |
| Tags | — | ✅ | ✅ |

※1 `config.backlinks.position` が `'sidebar'` のときサイドバーに表示。
　　`'below'`（デフォルト）のときは本文直下に表示。

---

## 2. コンポーネント一覧

### 2.1 レイアウト系

#### `Layout.tsx`
全ページを包むルートレイアウト。`<html>` から `<body>` までを生成する。

```typescript
interface LayoutProps {
  config: SiteConfig
  title: string               // <title> タグ用。"記事タイトル | サイト名" の形式
  description: string         // <meta description> 用
  url: string                 // OGP の og:url 用
  children: JSX.Element       // ページ固有のコンテンツ
}
```

生成する主な要素:
- `<meta>` タグ群（OGP含む）
- 共通CSS・検索インデックスJSの `<link>` / `<script>`
- `<Header>` / `<Footer>` の挿入
- 2カラムグリッドのラッパー `<div>`

---

#### `Header.tsx`
全ページ共通のヘッダー。

```typescript
interface HeaderProps {
  siteTitle: string
  currentUrl: string          // アクティブなナビリンクのハイライト用
}
```

含む要素:
- サイト名（トップページへのリンク）
- 検索ページへのリンク
- タグ一覧ページへのリンク

---

#### `Footer.tsx`
全ページ共通のフッター。propsなし（`config` はモジュールスコープで参照）。

含む要素:
- サイト名
- コピーライト表示（`config.title` + 現在年）

---

### 2.2 サイドバー系

#### `Profile.tsx`
サイドバーに常時表示するプロフィールカード。

```typescript
interface ProfileProps {
  profile: SiteConfig['profile']  // undefined のときはコンポーネント自体をレンダリングしない
}
```

含む要素:
- アバター画像（未設定時はイニシャルの円形プレースホルダー）
- 名前・自己紹介文
- 外部リンク一覧（GitHub、X 等）

---

#### `Toc.tsx`
記事ページのサイドバーに表示する目次。見出しが0件のときはレンダリングしない。

```typescript
interface TocItem {
  id: string                  // 見出しの id 属性（アンカーリンク用）
  text: string                // 見出しテキスト
  depth: number               // h2=2, h3=3
}

interface TocProps {
  items: TocItem[]
}
```

含む要素:
- h2 / h3 の階層付きリスト
- 各項目はページ内アンカーリンク（`#id`）

---

#### `Calendar.tsx`
`config.calendar.enabled` が `true` のとき、トップページのサイドバーに表示する月次カレンダー。

```typescript
interface CalendarProps {
  calendarMap: CalendarMap    // "YYYY-MM" → Page[]
  currentYearMonth: string    // 初期表示月。"YYYY-MM" 形式
}
```

含む要素:
- 月の切り替えボタン（前月・次月）
- 日付グリッド（7列）
- 記事が存在する日付はリンク付きでハイライト表示
- 日付クリックで該当記事へ遷移（複数記事がある日はその日の記事一覧へ）

---

#### `TagList.tsx`
トップページ・タグページのサイドバーに表示するタグ一覧。

```typescript
interface TagListProps {
  tagMap: TagMap              // タグ名 → Page[]
  currentTag?: string         // タグページ表示時にアクティブなタグをハイライト
}
```

含む要素:
- タグ名 + 記事件数のバッジ
- 各タグはタグ別一覧ページへのリンク

---

#### `Backlinks.tsx`
記事ページに表示するバックリンク（被リンク）一覧。バックリンクが0件のときはレンダリングしない。

```typescript
interface BacklinksProps {
  backlinks: Page[]
}
```

含む要素:
- 被リンク元の記事タイトルと作成日
- 各項目は該当記事へのリンク

配置:
- `config.backlinks.position === 'sidebar'` → `Sidebar.tsx` 内に挿入
- `config.backlinks.position === 'below'`（デフォルト） → 本文直下に挿入

---

### 2.3 記事系

#### `ArticleHeader.tsx`
記事ページの本文上部に表示するメタ情報エリア。

```typescript
interface ArticleHeaderProps {
  title: string
  createDateTime: Date
  updatedDateTime: Date
  tags: string[]
}
```

含む要素:
- 記事タイトル（h1）
- 作成日 / 最終更新日
- タグ一覧（各タグはタグ別ページへのリンク）

---

#### `ArticleBody.tsx`
unified が生成した hast（HTML AST）を HTML 文字列に変換して出力するコンポーネント。

```typescript
interface ArticleBodyProps {
  hast: Root                  // unified / hast の Root 型
}
```

> 注意: `hast-util-to-html` を使って文字列に変換し、`dangerouslySetInnerHTML` 相当で挿入する。
> XSS リスクは unified パイプライン内（sanitize プラグイン）で対処する。

---

### 2.4 一覧系

#### `PostList.tsx`
記事の一覧を表示する。トップページ・タグページで使用。

```typescript
interface PostListProps {
  pages: Page[]
  title?: string              // 一覧上部に表示する見出し（例: "タグ: ポエム"）
}
```

含む要素:
- 見出し（`title` が渡された場合）
- 記事カード一覧（タイトル・作成日・タグ）

---

### 2.5 検索系

#### `Search.tsx`
クライアントサイドの全文検索UI。`/search/` ページで使用。

```typescript
interface SearchProps {
  // MiniSearch のインデックスは out/search-index.json として書き出し済み。
  // このコンポーネントは HTML をレンダリングするのみで、
  // データ取得・検索ロジックはクライアントサイド JS（search.client.ts）が担う。
}
```

含む要素:
- テキスト入力フォーム
- 結果一覧（タイトル・description・タグ）のレンダリング用プレースホルダー

---

## 3. ページコンポーネント一覧

`src/pages/` 以下に配置。各ページコンポーネントは `Layout` を使い、
メインコンテンツとサイドバーの中身を組み立てて渡す役割を担う。

| ファイル | URL | 使用するコンポーネント |
|---------|-----|-------------------|
| `index.tsx` | `/` | PostList, Profile, Calendar（任意）, TagList |
| `article.tsx` | `/posts/[slug]/` | ArticleHeader, ArticleBody, Backlinks, Profile, Toc |
| `tag.tsx` | `/tags/[tag]/` | PostList, Profile, TagList |
| `tags.tsx` | `/tags/` | TagList（全タグ一覧）, Profile |
| `search.tsx` | `/search/` | Search, Profile |

---

## 4. config への追加項目

コンポーネント設計により `SiteConfig` に以下を追加する。

```typescript
interface SiteConfig {
  // ... 既存フィールド省略 ...

  backlinks?: {
    position?: 'below' | 'sidebar'  // デフォルト: 'below'
  }
}
```

---

## 5. 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-03-25 | 初版作成 |
