# データモデル設計書

> ステータス: 草案

---

## 1. 全体マップ

```
FrontMatter          ← .md のヘッダー部分をパースした生データ
    ↓
Page                 ← 1記事分の全データ（FrontMatter + AST + 解決済みメタ）
    ↓
BuildContext         ← ビルド中に全 Page を保持する共有状態
    ↓（参照）
TagMap               ← タグ → Page[] のインデックス
BacklinkMap          ← slug → Page[] のインデックス
CalendarMap          ← "YYYY-MM" → Page[] のインデックス
SearchIndex          ← MiniSearch に渡す検索用データ
    ↓
SiteConfig           ← config.ts の型
```

---

## 2. FrontMatter

Markdown ファイルの YAML ヘッダーをそのままマッピングする型。
パース直後の「生データ」なので、バリデーション前の状態を表す。

```typescript
/**
 * .md ファイルの YAML フロントマターをパースした生データ。
 * gray-matter の result.data に対応する。
 * 省略可能フィールドは undefined になりうる。
 */
interface FrontMatter {
  title: string
  tags?: string[]
  createDateTime: Date         // 製作日（日付のみ）
  updatedDateTime?: Date       // 最終更新日（日付のみ）。省略時は createDateTime と同値として扱う
  draft?: boolean              // true のとき本番ビルドから除外
  description?: string         // <meta description> / RSS 要約文 / 検索インデックス用。
                               // 省略時は本文冒頭 140 文字を自動生成してフォールバックとして使用
  slug?: string                // カスタム URL スラッグ。省略時はファイル名から生成
}
```

### 2.1 フロントマター記述例

```yaml
---
title: はじめての記事
tags:
  - ポエム
  - 日常
createDateTime: 2026-03-25
updatedDateTime: 2026-03-26
draft: false
description: この記事では〜について書きます。
---
```

### 2.2 バリデーションルール

| フィールド | ルール |
|-----------|-------|
| `title` | 必須。空文字はエラー |
| `createDateTime` | 必須。不正な日付はビルド時警告 |
| `updatedDateTime` | 省略時は `createDateTime` を自動補完 |
| `draft` | 省略時は `false` として扱う |
| `tags` | 省略時は `[]` として扱う |
| `description` | 省略時は本文冒頭 140 文字を自動生成してメタタグに使用 |
| `slug` | 省略時はファイル名をケバブケースに変換して使用 |

---

## 3. Page

1 つの Markdown ファイルに対応するコアデータ型。
パース・変換が完了した後に生成される。

```typescript
import type { Root } from 'hast'  // unified の HTML AST 型

/**
 * 1記事分の完成データ。
 * FrontMatter を継承しつつ、省略フィールドをすべて確定値に補完した状態。
 */
interface Page {
  // --- コンテンツ ---
  frontmatter: ResolvedFrontMatter // 省略フィールドを補完済みの FrontMatter
  hast: Root                       // unified の HTML AST（rehype で変換済み）
  rawContent: string               // フロントマターを除いた生 Markdown 文字列

  // --- パス・URL ---
  filePath: string                 // Vault 内の絶対ファイルパス
  relativePath: string             // content/ からの相対パス（例: posts/hello.md）
  slug: string                     // URL スラッグ（例: posts/hello）
  url: string                      // サイトルートからの URL（例: /posts/hello/）
  outputPath: string               // out/ 内の出力先パス（例: out/posts/hello/index.html）

  // --- 解決済みリンク情報 ---
  links: string[]                  // このページが参照している他ページの slug[]
  backlinks: Page[]                // このページを参照している他ページ（BuildContext から注入）
}

/**
 * 省略フィールドをすべて確定値に補完したフロントマター。
 */
interface ResolvedFrontMatter extends Required<FrontMatter> {
  // Required<FrontMatter> により全フィールドが non-undefined に
  // updatedDateTime は未指定なら createDateTime と同値
}
```

---

## 4. BuildContext

ビルド処理全体を通じて共有される状態。
パースが完了した全 Page を保持し、各変換処理・ページ生成処理から参照する。

```typescript
/**
 * ビルド中の共有状態。シングルトンとして build.ts 内で生成される。
 */
interface BuildContext {
  config: SiteConfig

  // 全 Page（draft を除いた確定リスト）
  pages: Page[]

  // 高速検索用インデックス（Page[] から自動構築）
  tagMap: TagMap
  backlinkMap: BacklinkMap
  calendarMap: CalendarMap
}

// slug → そのタグを持つ Page[]
type TagMap = Map<string, Page[]>

// ページの slug → そのページを参照している Page[]
type BacklinkMap = Map<string, Page[]>

// "YYYY-MM" → その月の Page[]（calendar.enabled が true のときのみ構築）
type CalendarMap = Map<string, Page[]>
```

---

## 5. SearchIndex

MiniSearch に渡す検索用ドキュメントの型。
ビルド時に Page[] から生成し、`out/search-index.json` として書き出す。

```typescript
/**
 * MiniSearch に渡す 1 ドキュメントの型。
 * Page から必要な情報だけを絞り込んだ軽量な表現。
 */
interface SearchDocument {
  id: string          // slug（MiniSearch の一意キー）
  title: string
  description: string
  tags: string[]
  url: string
}
```

---

## 6. SiteConfig

`config.ts` の型定義。アーキテクチャ設計書 §4 の設定構造に対応する。

```typescript
interface SiteConfig {
  title: string
  baseUrl: string
  description?: string
  language?: string            // デフォルト: "ja"

  profile?: {
    enabled: boolean
    name: string
    bio?: string
    avatar?: string            // /assets/ 以下のパス
    links?: ProfileLink[]
  }

  calendar?: {
    enabled: boolean
    dateField?: keyof FrontMatter  // デフォルト: "createDateTime"
  }

  build?: {
    outDir?: string            // デフォルト: "out"
    excludeDrafts?: boolean    // デフォルト: true
    excludeUnderscored?: boolean // デフォルト: true
  }

  backlinks?: {
    position?: 'below' | 'sidebar'  // デフォルト: 'below'
  }
}

interface ProfileLink {
  label: string
  url: string
  icon?: string                // アイコン名（将来的な拡張用。現時点では任意）
}
```

---

## 7. 型の依存関係まとめ

```
SiteConfig
    └─ ProfileLink

FrontMatter
    └─ ResolvedFrontMatter（FrontMatter を extends して全フィールドを確定）

Page
    ├─ ResolvedFrontMatter
    └─ hast.Root（unified / hast）

BuildContext
    ├─ SiteConfig
    ├─ Page[]
    ├─ TagMap         = Map<string, Page[]>
    ├─ BacklinkMap    = Map<string, Page[]>
    └─ CalendarMap    = Map<string, Page[]>

SearchDocument（Page の派生・軽量版）
```

---

## 8. 未決事項

| 項目 | 内容 |
|------|------|
| `hast.Root` の依存 | unified / hast パッケージのバージョンを固定するタイミングで確定 |
| `icon` フィールド | ProfileLink の `icon` は現時点では未使用。SVG スプライト等の実装時に確定 |

---

## 9. 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-03-25 | 初版作成 |
| 2026-03-25 | createDateTime/updatedDateTime を日付のみに確定。draft・slug をFrontMatterに追加確定。descriptionの自動生成フォールバック仕様を明記 |
